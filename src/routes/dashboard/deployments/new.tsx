import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, Info, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Switch } from "../../../components/ui/switch";
import { Textarea } from "../../../components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../../../components/ui/tooltip";
import {
	type CreateUserScopeDeploymentRequest,
	type DashboardSnapshot,
	type DeploymentLifetimePolicyResponse,
	type ExternalTemplateRepo,
	type ResourceEstimateSummary,
	type SkyforgeUserScope,
	type UserScopeTemplatesResponse,
	type UserVariableGroup,
	convertUserScopeEveLab,
	createUserScopeDeployment,
	estimateUserScopeTemplateResources,
	getDashboardSnapshot,
	getDeploymentLifetimePolicy,
	getSession,
	getUserScopeContainerlabTemplate,
	getUserScopeContainerlabTemplates,
	getUserScopeEveNgTemplates,
	getUserScopeNetlabTemplate,
	getUserScopeNetlabTemplates,
	getUserScopeTerraformTemplates,
	getUserSettings,
	importUserScopeEveLab,
	listUserContainerlabServers,
	listUserEveServers,
	listUserForwardCollectorConfigs,
	listUserNetlabServers,
	listUserScopeEveLabs,
	listUserScopes,
	listUserVariableGroups,
	validateUserScopeNetlabTemplate,
} from "../../../lib/api-client";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import { queryKeys } from "../../../lib/query-keys";

const deploymentsSearchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/new")({
	validateSearch: (search) => deploymentsSearchSchema.parse(search),
	component: CreateDeploymentPage,
});

type DeploymentKind =
	| "c9s_netlab"
	| "netlab"
	| "eve_ng"
	| "containerlab"
	| "c9s_containerlab"
	| "terraform";
type TemplateSource = "user" | "blueprints" | "external" | "custom";
type DeploymentMode = "in_cluster" | "byos";

function deploymentKindToSpec(kind: DeploymentKind): {
	family: CreateUserScopeDeploymentRequest["family"];
	engine: CreateUserScopeDeploymentRequest["engine"];
} {
	switch (kind) {
		case "c9s_netlab":
			return { family: "c9s", engine: "netlab" };
		case "c9s_containerlab":
			return { family: "c9s", engine: "containerlab" };
		case "netlab":
			return { family: "byos", engine: "netlab" };
		case "containerlab":
			return { family: "byos", engine: "containerlab" };
		case "eve_ng":
			return { family: "byos", engine: "eve_ng" };
		default:
			return { family: "terraform", engine: "terraform" };
	}
}

function deploymentModeFromKind(kind: DeploymentKind): DeploymentMode {
	switch (kind) {
		case "netlab":
		case "containerlab":
		case "eve_ng":
			return "byos";
		default:
			return "in_cluster";
	}
}

function applyDeploymentModeToKind(
	kind: DeploymentKind,
	mode: DeploymentMode,
): DeploymentKind {
	switch (kind) {
		case "netlab":
		case "c9s_netlab":
			return mode === "byos" ? "netlab" : "c9s_netlab";
		case "containerlab":
		case "c9s_containerlab":
			return mode === "byos" ? "containerlab" : "c9s_containerlab";
		default:
			return kind;
	}
}

const fallbackManagedFamilies = ["c9s", "byos", "terraform"];
const fallbackAllowedHours = [4, 8, 24, 72];

const USER_REPO_SOURCE = "user" as const;
const toAPITemplateSource = (source: TemplateSource): string =>
	source === USER_REPO_SOURCE ? "user" : source;

const formSchema = z.object({
	userId: z.string().min(1, "User is required"),
	name: z.string().min(1, "Deployment name is required").max(100),
	kind: z.enum([
		"c9s_netlab",
		"netlab",
		"containerlab",
		"c9s_containerlab",
		"terraform",
		"eve_ng",
	]),
	source: z.enum([USER_REPO_SOURCE, "blueprints", "external", "custom"]),
	templateRepoId: z.string().optional(),
	template: z.string().min(1, "Template is required"),
	netlabServer: z.string().optional(),
	eveServer: z.string().optional(),
	forwardCollectorId: z.string().optional(),
	deploymentMode: z.enum(["in_cluster", "byos"]).optional(),
	labLifetime: z.string().optional(),
	netlabInitialDebug: z.string().optional(),
	variableGroupId: z.string().optional(),
	env: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});

function hostLabelFromURL(raw: string): string {
	const s = String(raw ?? "").trim();
	if (!s) return "";
	try {
		const u = new URL(s);
		return u.hostname || s;
	} catch {
		return s.replace(/^https?:\/\//, "").split("/")[0] ?? s;
	}
}

function formatResourceEstimate(estimate?: ResourceEstimateSummary): string {
	if (!estimate || !estimate.supported) return "Resource estimate unavailable";
	const cpu = Number.isFinite(estimate.vcpu) ? estimate.vcpu.toFixed(1) : "0.0";
	const ram = Number.isFinite(estimate.ramGiB)
		? estimate.ramGiB.toFixed(1)
		: "0.0";
	return `${cpu} vCPU • ${ram} GiB RAM`;
}

function parsePositiveInt(value: unknown, fallback: number): number {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function CreateDeploymentPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { userId } = Route.useSearch();
	const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
	const [terraformProviderFilter, setTerraformProviderFilter] =
		useState<string>("all");
	const [importOpen, setImportOpen] = useState(false);
	const [importServer, setImportServer] = useState("");
	const [importLabPath, setImportLabPath] = useState("");
	const [importDeploymentName, setImportDeploymentName] = useState("");
	const [importCreateContainerlab, setImportCreateContainerlab] =
		useState(false);
	const [importContainerlabServer, setImportContainerlabServer] = useState("");

	useDashboardEvents(true);
	const dash = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: getDashboardSnapshot,
		initialData: () =>
			(queryClient.getQueryData(queryKeys.dashboardSnapshot()) as
				| DashboardSnapshot
				| undefined) ?? null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const userSettingsQ = useQuery({
		queryKey: queryKeys.userSettings(),
		queryFn: getUserSettings,
		staleTime: 30_000,
		retry: false,
	});

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
	});
	const allUserScopes = (userScopesQ.data ?? []) as SkyforgeUserScope[];
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const lifetimePolicyQ = useQuery<DeploymentLifetimePolicyResponse>({
		queryKey: queryKeys.deploymentLifetimePolicy(),
		queryFn: getDeploymentLifetimePolicy,
		staleTime: 30_000,
		retry: false,
	});
	const effectiveUsername = String(sessionQ.data?.username ?? "").trim();
	const userScopes = useMemo(() => {
		if (!effectiveUsername) return allUserScopes;
		const mine = allUserScopes.filter((w) => {
			if (String(w.createdBy ?? "").trim() === effectiveUsername) return true;
			if ((w.owners ?? []).includes(effectiveUsername)) return true;
			if (String(w.slug ?? "").trim() === effectiveUsername) return true;
			return false;
		});
		return mine.length > 0 ? mine : allUserScopes;
	}, [allUserScopes, effectiveUsername]);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			userId: userId || "",
			name: "",
			kind: "c9s_netlab",
			source: "blueprints",
			templateRepoId: "",
			template: "",
			netlabServer: "",
			eveServer: "",
			forwardCollectorId: "none",
			deploymentMode: "in_cluster",
			labLifetime: "never",
			netlabInitialDebug: "",
			variableGroupId: "none",
			env: [],
		},
	});

	const { watch, setValue, control } = form;
	const { fields, append, remove } = useFieldArray({
		control,
		name: "env",
	});

	// Apply per-user default env vars exactly once, as a pre-fill.
	useEffect(() => {
		const defaults = userSettingsQ.data?.defaultEnv ?? [];
		if (!defaults.length) return;
		const current = form.getValues("env") ?? [];
		if (current.length) return;
		setValue("env", defaults, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: true,
		});
	}, [userSettingsQ.data?.defaultEnv, form, setValue]);

	const upsertEnvVar = (key: string, value: string) => {
		const k = key.trim();
		const v = value;
		if (!k) return;
		const cur = (form.getValues("env") ?? []).slice();
		const idx = cur.findIndex((e) => String(e?.key ?? "").trim() === k);
		if (idx >= 0) {
			cur[idx] = { key: k, value: v };
		} else {
			cur.push({ key: k, value: v });
		}
		setValue("env", cur, {
			shouldDirty: true,
			shouldTouch: true,
			shouldValidate: true,
		});
	};

	const watchUserScopeId = watch("userId");
	const watchKind = watch("kind");
	const watchSource = watch("source");
	const watchTemplateRepoId = watch("templateRepoId");
	const watchTemplate = watch("template");
	const watchName = watch("name");
	const watchForwardCollectorId = watch("forwardCollectorId");
	const watchDeploymentMode = watch("deploymentMode");
	const watchLabLifetime = watch("labLifetime");
	const watchEnv = watch("env");
	const templatesUpdatedAt = dash.data?.templatesIndexUpdatedAt ?? "";
	const watchSpec = useMemo(() => deploymentKindToSpec(watchKind), [watchKind]);
	const managedFamilies = useMemo(
		() =>
			new Set(
				(lifetimePolicyQ.data?.managedFamilies ?? fallbackManagedFamilies).map(
					(v) => String(v).trim().toLowerCase(),
				),
			),
		[lifetimePolicyQ.data?.managedFamilies],
	);
	const lifetimeAllowedHours = useMemo(() => {
		const raw = lifetimePolicyQ.data?.allowedHours ?? fallbackAllowedHours;
		const parsed = raw
			.map((h) => Number.parseInt(String(h), 10))
			.filter((h) => Number.isFinite(h) && h > 0);
		return parsed.length > 0 ? parsed : fallbackAllowedHours;
	}, [lifetimePolicyQ.data?.allowedHours]);
	const lifetimeDefaultHours = parsePositiveInt(
		lifetimePolicyQ.data?.defaultHours,
		24,
	);
	const lifetimeManaged = managedFamilies.has(
		String(watchSpec.family ?? "")
			.trim()
			.toLowerCase(),
	);
	const allowNoExpiry = Boolean(lifetimePolicyQ.data?.allowNoExpiry ?? false);
	const lifetimeCanEdit = Boolean(sessionQ.data?.isAdmin) && lifetimeManaged;
	const expiryAction = String(
		lifetimePolicyQ.data?.expiryActions?.[watchSpec.family] ?? "stop",
	)
		.trim()
		.toLowerCase();
	const lifetimeOptions = useMemo(() => {
		if (!lifetimeManaged) return [] as Array<{ value: string; label: string }>;
		const options = lifetimeAllowedHours.map((h) => ({
			value: String(h),
			label: `${h} hours`,
		}));
		if (allowNoExpiry) {
			options.unshift({
				value: "never",
				label: "Never auto-stop",
			});
		}
		return options;
	}, [allowNoExpiry, lifetimeAllowedHours, lifetimeManaged]);
	const driverSummary =
		watchSpec.family === "c9s"
			? "In-cluster (c9s)"
			: watchSpec.family === "byos"
				? "BYOS (external server)"
				: "Terraform managed";

	const lastUserScopeKey = "skyforge.lastUserScopeId.deployments";

	// Sync userId when userScopes load if not already set or passed via URL
	useEffect(() => {
		if (watchUserScopeId || userScopes.length === 0) return;
		const urlWs = String(userId ?? "").trim();
		if (urlWs && userScopes.some((w) => w.id === urlWs)) {
			setValue("userId", urlWs);
			return;
		}
		const stored =
			typeof window !== "undefined"
				? (window.localStorage.getItem(lastUserScopeKey) ?? "")
				: "";
		if (stored && userScopes.some((w) => w.id === stored)) {
			setValue("userId", stored);
			return;
		}
		setValue("userId", userScopes[0].id);
	}, [watchUserScopeId, userScopes, setValue]);

	// Persist last-selected user for Create Deployment.
	useEffect(() => {
		if (!watchUserScopeId) return;
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem(lastUserScopeKey, watchUserScopeId);
		} catch {
			// ignore
		}
	}, [watchUserScopeId]);

	useEffect(() => {
		const derivedMode = deploymentModeFromKind(watchKind);
		if (watchDeploymentMode !== derivedMode) {
			setValue("deploymentMode", derivedMode, {
				shouldDirty: false,
				shouldTouch: false,
				shouldValidate: false,
			});
		}
	}, [setValue, watchDeploymentMode, watchKind]);

	useEffect(() => {
		if (!lifetimeManaged) {
			if (watchLabLifetime !== "not_managed") {
				setValue("labLifetime", "not_managed", {
					shouldDirty: false,
					shouldTouch: false,
					shouldValidate: false,
				});
			}
			return;
		}
		const defaultSelection = allowNoExpiry
			? "never"
			: String(lifetimeDefaultHours);
		const isValidSelection = lifetimeOptions.some(
			(o) => o.value === watchLabLifetime,
		);
		if (!isValidSelection) {
			setValue("labLifetime", defaultSelection, {
				shouldDirty: false,
				shouldTouch: false,
				shouldValidate: false,
			});
		}
	}, [
		allowNoExpiry,
		lifetimeDefaultHours,
		lifetimeManaged,
		lifetimeOptions,
		setValue,
		watchLabLifetime,
	]);

	// Auto-generate name when template or kind changes
	useEffect(() => {
		const base = (watchTemplate || watchKind).split("/").pop() || watchKind;
		const ts = new Date()
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\..+/, "")
			.slice(0, 15);
		const generated = `${base}-${ts}`;
		setValue("name", generated);
	}, [watchTemplate, watchKind, setValue]);

	const userNetlabServersQ = useQuery({
		queryKey: queryKeys.userNetlabServers(),
		queryFn: listUserNetlabServers,
		staleTime: 30_000,
		retry: false,
	});

	const userContainerlabServersQ = useQuery({
		queryKey: queryKeys.userContainerlabServers(),
		queryFn: listUserContainerlabServers,
		staleTime: 30_000,
		retry: false,
	});

	const userEveServersQ = useQuery({
		queryKey: queryKeys.userEveServers(),
		queryFn: listUserEveServers,
		staleTime: 30_000,
		retry: false,
	});

	const eveLabsQ = useQuery({
		queryKey: queryKeys.userEveLabs(watchUserScopeId, importServer, "", true),
		queryFn: () =>
			listUserScopeEveLabs(watchUserScopeId, {
				server: importServer,
				recursive: true,
			}),
		enabled: Boolean(importOpen && watchUserScopeId && importServer),
		staleTime: 30_000,
		retry: false,
	});

	const variableGroupsQ = useQuery({
		queryKey: queryKeys.userVariableGroups(),
		queryFn: listUserVariableGroups,
		staleTime: 30_000,
	});

	const forwardCollectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		enabled: ["c9s_netlab", "c9s_containerlab", "terraform"].includes(
			watchKind,
		),
		staleTime: 30_000,
		retry: false,
	});

	const selectableCollectors = useMemo(() => {
		return (forwardCollectorsQ.data?.collectors ?? [])
			.filter(
				(c: any) => c && typeof c.id === "string" && typeof c.name === "string",
			)
			.filter((c: any) => !c.decryptionFailed);
	}, [forwardCollectorsQ.data?.collectors]);

	useEffect(() => {
		if (!["c9s_netlab", "c9s_containerlab", "terraform"].includes(watchKind)) {
			if ((watchForwardCollectorId ?? "none") !== "none")
				setValue("forwardCollectorId", "none");
			return;
		}
		if ((watchForwardCollectorId ?? "none") !== "none") return;
		const preferred = String(
			userSettingsQ.data?.defaultForwardCollectorConfigId ?? "",
		).trim();
		const def =
			(preferred
				? selectableCollectors.find((c: any) => c.id === preferred)
				: null) ??
			selectableCollectors.find((c: any) => c.isDefault) ??
			selectableCollectors[0];
		if (def?.id) setValue("forwardCollectorId", String(def.id));
	}, [
		watchKind,
		watchForwardCollectorId,
		selectableCollectors,
		setValue,
		userSettingsQ.data?.defaultForwardCollectorConfigId,
	]);

	const effectiveSource: TemplateSource = useMemo(() => {
		if (watchKind === "netlab" || watchKind === "c9s_netlab") {
			if (watchSource === USER_REPO_SOURCE) return USER_REPO_SOURCE;
			if (watchSource === "custom") return "custom";
			return "blueprints";
		}
		if (watchKind === "eve_ng") return "blueprints";
		if (watchKind === "containerlab" || watchKind === "c9s_containerlab")
			return watchSource;
		if (watchKind === "terraform") return watchSource;
		return USER_REPO_SOURCE;
	}, [watchKind, watchSource]);

	const templatesQ = useQuery<UserScopeTemplatesResponse>({
		queryKey: queryKeys.userTemplates(
			watchUserScopeId,
			watchKind,
			effectiveSource,
			watchTemplateRepoId || undefined,
			undefined,
		),
		enabled: !!watchUserScopeId,
		queryFn: async () => {
			const query: { source?: string; repo?: string } = {
				source: toAPITemplateSource(effectiveSource),
			};
			if (
				(effectiveSource === "external" || effectiveSource === "custom") &&
				watchTemplateRepoId
			)
				query.repo = watchTemplateRepoId;

			switch (watchKind) {
				case "netlab":
				case "c9s_netlab":
					return getUserScopeNetlabTemplates(watchUserScopeId, query);
				case "eve_ng":
					return getUserScopeEveNgTemplates(watchUserScopeId, query);
				case "containerlab":
				case "c9s_containerlab":
					return getUserScopeContainerlabTemplates(watchUserScopeId, query);
				case "terraform":
					return getUserScopeTerraformTemplates(watchUserScopeId, query);
				default:
					return getUserScopeNetlabTemplates(watchUserScopeId, query);
			}
		},
		staleTime: 5 * 60_000,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (!templatesUpdatedAt) return;
		void queryClient.invalidateQueries({ queryKey: ["userScopeTemplates"] });
	}, [templatesUpdatedAt, queryClient]);

	const templates = useMemo(() => {
		const raw = templatesQ.data?.templates ?? [];
		if (watchKind !== "terraform") return raw;
		const f = String(terraformProviderFilter ?? "all")
			.trim()
			.toLowerCase();
		if (!f || f === "all") return raw;
		return raw.filter(
			(t) =>
				String(t).toLowerCase().startsWith(`${f}/`) ||
				String(t).toLowerCase() === f,
		);
	}, [templatesQ.data?.templates, terraformProviderFilter, watchKind]);

	const terraformProviders = useMemo(() => {
		if (watchKind !== "terraform") return [];
		const raw = templatesQ.data?.templates ?? [];
		const providers = new Set<string>();
		for (const t of raw) {
			const first = String(t ?? "")
				.split("/")[0]
				?.trim();
			if (first) providers.add(first);
		}
		return Array.from(providers).sort((a, b) => a.localeCompare(b));
	}, [templatesQ.data?.templates, watchKind]);

	useEffect(() => {
		if (watchKind !== "terraform") {
			setTerraformProviderFilter("all");
			return;
		}
		// If filter is no longer present after a template refresh, reset to all.
		if (
			terraformProviderFilter !== "all" &&
			!terraformProviders.includes(terraformProviderFilter)
		) {
			setTerraformProviderFilter("all");
		}
	}, [terraformProviderFilter, terraformProviders, watchKind]);

	const templatePreviewQ = useQuery({
		queryKey: [
			"userScopeTemplate",
			watchKind,
			watchUserScopeId,
			effectiveSource,
			watchTemplateRepoId,
			templatesQ.data?.dir,
			watchTemplate,
		],
		queryFn: async () => {
			if (!watchUserScopeId) throw new Error("userId is required");
			if (!watchTemplate) throw new Error("template is required");
			const query: any = { source: toAPITemplateSource(effectiveSource) };
			if (
				(effectiveSource === "external" || effectiveSource === "custom") &&
				watchTemplateRepoId
			)
				query.repo = watchTemplateRepoId;
			if (templatesQ.data?.dir) query.dir = templatesQ.data.dir;
			if (watchKind === "containerlab" || watchKind === "c9s_containerlab") {
				return getUserScopeContainerlabTemplate(watchUserScopeId, {
					...query,
					file: watchTemplate,
				});
			}
			// Default: treat as netlab-like.
			return getUserScopeNetlabTemplate(watchUserScopeId, {
				...query,
				template: watchTemplate,
			});
		},
		enabled:
			templatePreviewOpen &&
			Boolean(watchUserScopeId) &&
			Boolean(watchTemplate) &&
			(watchKind === "netlab" ||
				watchKind === "c9s_netlab" ||
				watchKind === "containerlab" ||
				watchKind === "c9s_containerlab"),
		retry: false,
		staleTime: 30_000,
	});

	const templateEstimateQ = useQuery({
		queryKey: [
			"userScopeTemplateEstimate",
			watchUserScopeId,
			watchKind,
			effectiveSource,
			watchTemplateRepoId,
			templatesQ.data?.dir,
			watchTemplate,
		],
		queryFn: async () => {
			if (!watchUserScopeId) throw new Error("userId is required");
			if (!watchTemplate) throw new Error("template is required");
			const body: {
				kind: string;
				engine?: string;
				source: string;
				repo?: string;
				dir?: string;
				template: string;
			} = {
				kind: watchSpec.family,
				engine: watchSpec.engine,
				source: toAPITemplateSource(effectiveSource),
				template: watchTemplate,
			};
			if (
				(effectiveSource === "external" || effectiveSource === "custom") &&
				watchTemplateRepoId
			) {
				body.repo = watchTemplateRepoId;
			}
			if (templatesQ.data?.dir) body.dir = templatesQ.data.dir;
			return estimateUserScopeTemplateResources(watchUserScopeId, body);
		},
		enabled:
			Boolean(watchUserScopeId) &&
			Boolean(watchTemplate) &&
			watchSpec.engine === "netlab",
		retry: false,
		staleTime: 30_000,
	});

	const externalRepos = (
		(userSettingsQ.data?.externalTemplateRepos ?? []) as ExternalTemplateRepo[]
	).filter(
		(r) => !!r && typeof r.id === "string" && typeof r.repo === "string",
	);
	const externalAllowed = externalRepos.length > 0;

	const mutation = useMutation({
		mutationFn: async (values: z.infer<typeof formSchema>) => {
			const normalizedKind = applyDeploymentModeToKind(
				values.kind,
				(values.deploymentMode as DeploymentMode | undefined) ??
					deploymentModeFromKind(values.kind),
			);
			if (
				effectiveSource === "custom" &&
				!(values.templateRepoId || "").trim()
			) {
				throw new Error("One-shot repo URL is required");
			}
			const config: Record<string, unknown> = {
				template: values.template,
			};

			if (values.variableGroupId && values.variableGroupId !== "none") {
				config.envGroupIds = [Number.parseInt(values.variableGroupId, 10)];
				config.envGroupScope = "user";
			}

			if (values.env && values.env.length > 0) {
				const envMap: Record<string, string> = {};
				for (const e of values.env) {
					if (e.key.trim()) envMap[e.key.trim()] = e.value;
				}
				if (Object.keys(envMap).length > 0) {
					config.environment = envMap;
				}
			}

			if (
				["c9s_netlab", "c9s_containerlab", "terraform"].includes(normalizedKind)
			) {
				const cid = String(values.forwardCollectorId ?? "none").trim();
				if (cid && cid !== "none") {
					config.forwardEnabled = true;
					(config as any).forwardCollectorId = cid;
				}
			}

			if (normalizedKind === "netlab" || normalizedKind === "containerlab") {
				const v = (values.netlabServer || "").trim();
				if (!v) throw new Error("BYOS server is required");
				config.netlabServer = v;
				config.templateSource = toAPITemplateSource(effectiveSource);
				if (
					(effectiveSource === "external" || effectiveSource === "custom") &&
					values.templateRepoId
				)
					config.templateRepo = values.templateRepoId;
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
			}

				if (normalizedKind === "c9s_netlab") {
					config.templateSource = toAPITemplateSource(effectiveSource);
					if (
						(effectiveSource === "external" || effectiveSource === "custom") &&
						values.templateRepoId
					)
						config.templateRepo = values.templateRepoId;
					if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
					const debugFlags = String(values.netlabInitialDebug ?? "").trim();
					if (debugFlags) config.netlabInitialDebug = debugFlags;
				}

			if (normalizedKind === "c9s_containerlab") {
				config.templateSource = toAPITemplateSource(effectiveSource);
				if (
					(effectiveSource === "external" || effectiveSource === "custom") &&
					values.templateRepoId
				)
					config.templateRepo = values.templateRepoId;
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
			}

			if (normalizedKind === "terraform") {
				config.templateSource = toAPITemplateSource(effectiveSource);
				if (
					(effectiveSource === "external" || effectiveSource === "custom") &&
					values.templateRepoId
				)
					config.templateRepo = values.templateRepoId;
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
			}

			if (normalizedKind === "eve_ng") {
				config.templateSource = "blueprints";
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
				const eve = (values.eveServer || "").trim();
				if (!eve) throw new Error("EVE-NG server is required");
				config.eveServer = eve;
			}

			const { family, engine } = deploymentKindToSpec(normalizedKind);
			config.engine = engine;
			if (
				Boolean(sessionQ.data?.isAdmin) &&
				managedFamilies.has(String(family).trim().toLowerCase())
			) {
				const selectedLifetime = String(values.labLifetime ?? "").trim();
				if (selectedLifetime === "never") {
					config.leaseEnabled = false;
				} else {
					const selectedHours = Number.parseInt(selectedLifetime, 10);
					if (
						Number.isFinite(selectedHours) &&
						selectedHours > 0 &&
						lifetimeAllowedHours.includes(selectedHours)
					) {
						config.leaseEnabled = true;
						config.leaseHours = selectedHours;
					}
				}
			}

			const body: CreateUserScopeDeploymentRequest = {
				name: values.name,
				family,
				engine,
				config: config as any,
			};
			return createUserScopeDeployment(values.userId, body);
		},
		onSuccess: async (_, variables) => {
			const kind = String(variables.kind ?? "").trim();
			const description =
				kind === "netlab"
					? `${variables.name} create run is queued.`
					: `${variables.name} is created. Use deployment actions to start provisioning.`;
			toast.success("Deployment created successfully", {
				description,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			await navigate({
				to: "/dashboard/deployments",
				search: { userId: variables.userId },
			});
		},
		onError: (error) => {
			toast.error("Failed to create deployment", {
				description: (error as Error).message,
			});
		},
	});

	const importEveLab = useMutation({
		mutationFn: async () => {
			if (!watchUserScopeId) throw new Error("Select a user first.");
			const server = importServer.trim();
			if (!server) throw new Error("Select an EVE-NG server.");
			const labPath = importLabPath.trim();
			if (!labPath) throw new Error("Select an EVE-NG lab.");
			return importUserScopeEveLab(watchUserScopeId, {
				server,
				labPath,
				deploymentName: importDeploymentName.trim() || undefined,
			});
		},
		onSuccess: async (deployment) => {
			toast.success("EVE-NG lab imported", {
				description: deployment?.name ?? "Deployment created.",
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			setImportOpen(false);
			await navigate({
				to: "/dashboard/deployments",
				search: { userId: watchUserScopeId },
			});
		},
		onError: (error) => {
			toast.error("Failed to import EVE-NG lab", {
				description: (error as Error).message,
			});
		},
	});

	const convertEveLab = useMutation({
		mutationFn: async () => {
			if (!watchUserScopeId) throw new Error("Select a user first.");
			const server = importServer.trim();
			if (!server) throw new Error("Select an EVE-NG server.");
			const labPath = importLabPath.trim();
			if (!labPath) throw new Error("Select an EVE-NG lab.");
			const createDeployment = importCreateContainerlab;
			const containerlabServer = importContainerlabServer.trim();
			if (createDeployment && !containerlabServer) {
				throw new Error("Select a Containerlab server.");
			}
			return convertUserScopeEveLab(watchUserScopeId, {
				server,
				labPath,
				createDeployment,
				containerlabServer: createDeployment ? containerlabServer : undefined,
			});
		},
		onSuccess: async (resp) => {
			const warnings = resp?.warnings ?? [];
			toast.success("Containerlab template created", {
				description: resp?.path ?? "Template saved.",
			});
			if (warnings.length > 0) {
				toast.message("Conversion warnings", {
					description: warnings.slice(0, 3).join(" | "),
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			setImportOpen(false);
			if (resp?.deployment) {
				await navigate({
					to: "/dashboard/deployments",
					search: { userId: watchUserScopeId },
				});
			}
		},
		onError: (error) => {
			toast.error("Failed to convert EVE-NG lab", {
				description: (error as Error).message,
			});
		},
	});

	const validateNetlabTemplate = useMutation({
		mutationFn: async () => {
			if (!watchUserScopeId) throw new Error("Select a user first.");
			if (!watchTemplate) throw new Error("Select a template first.");
			const envFromList = new Map<string, string>();
			for (const kv of form.getValues("env") || []) {
				const k = (kv?.key ?? "").trim();
				if (!k) continue;
				envFromList.set(k, String(kv?.value ?? ""));
			}

			const groupIdRaw = String(form.getValues("variableGroupId") ?? "none");
			const groupId = groupIdRaw !== "none" ? Number(groupIdRaw) : null;
			const groupVars = groupId
				? variableGroups.find((g: UserVariableGroup) => g.id === groupId)
						?.variables
				: undefined;
			const env: Record<string, string> = {
				...(groupVars ?? {}),
			};
			for (const [k, v] of envFromList.entries()) env[k] = v;

			const body: any = {
				source: toAPITemplateSource(effectiveSource),
				template: watchTemplate,
				environment: env,
			};
			if (
				(effectiveSource === "external" || effectiveSource === "custom") &&
				watchTemplateRepoId
			)
				body.repo = watchTemplateRepoId;
			if (templatesQ.data?.dir) body.dir = templatesQ.data.dir;
			return validateUserScopeNetlabTemplate(watchUserScopeId, body);
		},
		onSuccess: async (res: any) => {
			const runId = String(res?.task?.id ?? res?.task?.task_id ?? "").trim();
			toast.success("Validation queued", {
				description: runId
					? `Run ${runId} started.`
					: "Validation run started.",
			});
			if (runId) {
				navigate({ to: "/dashboard/runs/$runId", params: { runId } });
			}
		},
		onError: (err: any) => {
			toast.error("Validation failed", {
				description: String(err?.message ?? err),
			});
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		mutation.mutate(values);
	}

	const userNetlabOptions = userNetlabServersQ.data?.servers ?? [];
	const userContainerlabOptions = userContainerlabServersQ.data?.servers ?? [];
	const eveOptions = userEveServersQ.data?.servers ?? [];
	const variableGroups = (variableGroupsQ.data?.groups ??
		[]) as UserVariableGroup[];
	const byosNetlabEnabled = userNetlabOptions.length > 0;
	const byosContainerlabEnabled = userContainerlabOptions.length > 0;
	const byosEveEnabled = eveOptions.length > 0;
	useEffect(() => {
		if (!importOpen) return;
		if (!importServer && eveOptions.length > 0) {
			setImportServer(`user:${eveOptions[0].id}`);
		}
	}, [importOpen, importServer, eveOptions]);

	useEffect(() => {
		if (!importOpen) return;
		setImportLabPath("");
	}, [importOpen, importServer]);

	useEffect(() => {
		if (!importOpen || !importCreateContainerlab) return;
		if (!importContainerlabServer && userContainerlabOptions.length > 0) {
			setImportContainerlabServer(`user:${userContainerlabOptions[0].id}`);
		}
	}, [
		importOpen,
		importCreateContainerlab,
		importContainerlabServer,
		userContainerlabOptions,
	]);
	const byosNetlabServerRefs = useMemo(() => {
		return userNetlabOptions
			.filter((s) => !!s?.id)
			.map((s) => ({
				value: `user:${s.id}`,
				label: hostLabelFromURL(s.apiUrl) || s.name,
			}));
	}, [userNetlabOptions]);
	const byosContainerlabServerRefs = useMemo(() => {
		return userContainerlabOptions
			.filter((s) => !!s?.id)
			.map((s) => ({
				value: `user:${s.id}`,
				label: hostLabelFromURL(s.apiUrl) || s.name,
			}));
	}, [userContainerlabOptions]);
	const eveLabOptions = useMemo(() => {
		const labs = eveLabsQ.data?.labs ?? [];
		return labs
			.map((lab) => ({
				value: lab.path,
				label: lab.folder ? `${lab.folder}/${lab.name}` : lab.name,
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [eveLabsQ.data?.labs]);
	const byosServerRefs =
		watchKind === "netlab"
			? byosNetlabServerRefs
			: watchKind === "containerlab"
				? byosContainerlabServerRefs
				: [];
	const deploymentModeOptions = useMemo(() => {
		switch (watchKind) {
			case "netlab":
			case "c9s_netlab":
			case "containerlab":
			case "c9s_containerlab":
				return [
					{ value: "in_cluster", label: "In cluster" },
					{ value: "byos", label: "BYOS" },
				] as Array<{ value: DeploymentMode; label: string }>;
			case "eve_ng":
				return [{ value: "byos", label: "BYOS" }] as Array<{
					value: DeploymentMode;
					label: string;
				}>;
			default:
				return [{ value: "in_cluster", label: "In cluster" }] as Array<{
					value: DeploymentMode;
					label: string;
				}>;
		}
	}, [watchKind]);
	const selectedTemplateEstimate = templateEstimateQ.data?.estimate;

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Create deployment</CardTitle>
							<CardDescription>
								Configure and launch a new infrastructure deployment.
							</CardDescription>
						</div>
						<Button
							variant="outline"
							onClick={() =>
								navigate({
									to: "/dashboard/deployments",
									search: { userId: watchUserScopeId },
								})
							}
						>
							Cancel
						</Button>
					</div>
				</CardHeader>
			</Card>

			{byosEveEnabled && watchKind === "eve_ng" && (
				<Card>
					<CardHeader>
						<CardTitle>Import from EVE-NG</CardTitle>
						<CardDescription>
							Register an existing EVE-NG lab as a deployment or convert it into
							a Containerlab template.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap items-center justify-between gap-3">
						<div className="text-sm text-muted-foreground">
							Select an EVE-NG lab and import it into Skyforge without
							rebuilding the topology.
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => setImportOpen(true)}
						>
							<Download className="mr-2 h-4 w-4" />
							Import EVE-NG lab
						</Button>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardContent className="pt-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
							<div className="grid gap-6 md:grid-cols-2">
								<FormField
									control={form.control}
									name="kind"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Provider</FormLabel>
											<Select
												onValueChange={(val) => {
													field.onChange(val);
													form.setValue("template", "");
												}}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select provider" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="c9s_netlab">Netlab</SelectItem>
													{byosNetlabEnabled && (
														<SelectItem value="netlab">
															Netlab (BYOS)
														</SelectItem>
													)}
													{byosEveEnabled && (
														<SelectItem value="eve_ng">EVE-NG</SelectItem>
													)}
													{byosContainerlabEnabled && (
														<SelectItem value="containerlab">
															Containerlab (BYOS)
														</SelectItem>
													)}
													<SelectItem value="c9s_containerlab">
														Containerlab
													</SelectItem>
													<SelectItem value="terraform">Terraform</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="deploymentMode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Deployment mode</FormLabel>
											<Select
												value={String(
													field.value ?? deploymentModeFromKind(watchKind),
												)}
												onValueChange={(value) => {
													const selectedMode = value as DeploymentMode;
													field.onChange(selectedMode);
													const adjustedKind = applyDeploymentModeToKind(
														form.getValues("kind"),
														selectedMode,
													);
													if (adjustedKind !== form.getValues("kind")) {
														form.setValue("kind", adjustedKind, {
															shouldDirty: true,
															shouldTouch: true,
															shouldValidate: true,
														});
														form.setValue("template", "", {
															shouldDirty: true,
															shouldTouch: true,
															shouldValidate: true,
														});
													}
												}}
												disabled={deploymentModeOptions.length <= 1}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select mode" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{deploymentModeOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												{driverSummary}. Family: {watchSpec.family} • Engine:{" "}
												{watchSpec.engine}.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="labLifetime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Lab lifetime</FormLabel>
											<Select
												value={String(field.value ?? "")}
												onValueChange={field.onChange}
												disabled={!lifetimeManaged || !lifetimeCanEdit}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select lifetime" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{lifetimeManaged ? (
														lifetimeOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))
													) : (
														<SelectItem value="not_managed">
															Not managed for this provider
														</SelectItem>
													)}
												</SelectContent>
											</Select>
											<FormDescription>
												{lifetimeManaged
													? `Expiry action: ${expiryAction}. ${
															lifetimeCanEdit
																? "Admin can override before create."
																: `Applied by policy (${lifetimeDefaultHours}h).`
														}`
													: "Lifetime policy does not apply to this provider family."}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{["c9s_netlab", "c9s_containerlab", "terraform"].includes(
									watchKind,
								) && (
									<FormField
										control={form.control}
										name="forwardCollectorId"
										render={({ field }) => (
											<FormItem className="rounded-md border p-3 md:col-span-2 space-y-2">
												<FormLabel>Forward collector</FormLabel>
												<FormDescription>
													Optional. Select a per-user in-cluster Collector.
													Configure collectors under{" "}
													<code className="font-mono">Dashboard → Forward</code>
													.
												</FormDescription>
												{forwardCollectorsQ.isError ? (
													<div className="text-xs text-destructive">
														Failed to load collectors.
													</div>
												) : null}
												{forwardCollectorsQ.data &&
												selectableCollectors.length === 0 ? (
													<div className="text-xs text-destructive">
														No collectors configured yet.
													</div>
												) : null}
												<Select
													value={String(field.value ?? "none")}
													onValueChange={(v) => field.onChange(v)}
													disabled={forwardCollectorsQ.isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select a collector (or None)" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">None</SelectItem>
														{selectableCollectors.map((c: any) => (
															<SelectItem
																key={String(c.id)}
																value={String(c.id)}
															>
																{String(c.name)}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>
								)}

								<FormField
									control={form.control}
									name="source"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												Template source
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Info className="h-4 w-4 text-muted-foreground" />
														</TooltipTrigger>
														<TooltipContent>
															<p>
																Git repository or URL containing deployment
																templates
															</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</FormLabel>
											<Select
												onValueChange={(val) => {
													field.onChange(val);
													form.setValue("templateRepoId", "");
													form.setValue("template", "");
												}}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select source" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={USER_REPO_SOURCE}>
														User repo
													</SelectItem>
													<SelectItem value="blueprints">Blueprints</SelectItem>
													<SelectItem
														value="external"
														disabled={
															!externalAllowed ||
															(watchKind !== "containerlab" &&
																watchKind !== "c9s_containerlab" &&
																watchKind !== "terraform")
														}
													>
														External repo
													</SelectItem>
													<SelectItem
														value="custom"
														disabled={
															watchKind !== "netlab" &&
															watchKind !== "c9s_netlab" &&
															watchKind !== "containerlab" &&
															watchKind !== "c9s_containerlab"
														}
													>
														One-shot repo URL
													</SelectItem>
												</SelectContent>
											</Select>
											{!externalAllowed &&
												(watchKind === "containerlab" ||
													watchKind === "c9s_containerlab" ||
													watchKind === "terraform") && (
													<FormDescription>
														No external repos configured in My Settings.
													</FormDescription>
												)}
											<FormMessage />
										</FormItem>
									)}
								/>

								{effectiveSource === "external" && (
									<FormField
										control={form.control}
										name="templateRepoId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>External repo</FormLabel>
												<Select
													onValueChange={(val) => {
														field.onChange(val);
														form.setValue("template", "");
													}}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select repo…" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{externalRepos.map((r: ExternalTemplateRepo) => (
															<SelectItem key={r.id} value={r.id}>
																{r.name} ({r.repo})
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								{effectiveSource === "custom" && (
									<FormField
										control={form.control}
										name="templateRepoId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>One-shot repo URL</FormLabel>
												<FormControl>
													<Input
														placeholder="https://github.com/org/repo.git (or owner/repo)"
														value={field.value ?? ""}
														onChange={(e) => {
															field.onChange(e.target.value);
															form.setValue("template", "");
														}}
													/>
												</FormControl>
												<FormDescription>
													Used once for this deployment flow. Not saved in My
													Settings.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{(watchKind === "netlab" || watchKind === "containerlab") && (
									<FormField
										control={form.control}
										name="netlabServer"
										render={({ field }) => (
											<FormItem>
												<FormLabel>BYOS server</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value || ""}
													value={field.value || ""}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select server…" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{byosServerRefs.map((s) => (
															<SelectItem key={s.value} value={s.value}>
																{s.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{(userNetlabServersQ.isLoading ||
													userContainerlabServersQ.isLoading) && (
													<FormDescription>Loading servers…</FormDescription>
												)}
												<FormDescription>
													Configure servers under{" "}
													<code className="font-mono">
														Dashboard → Settings
													</code>
													.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{watchKind === "eve_ng" && (
									<FormField
										control={form.control}
										name="eveServer"
										render={({ field }) => (
											<FormItem>
												<FormLabel>EVE-NG server</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value || ""}
													value={field.value || ""}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select server…" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{eveOptions.map((s) => (
															<SelectItem key={s.id} value={`user:${s.id}`}>
																{hostLabelFromURL(s.apiUrl) || s.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{userEveServersQ.isLoading && (
													<FormDescription>Loading servers…</FormDescription>
												)}
												<FormDescription>
													Configure servers under{" "}
													<code className="font-mono">
														Dashboard → Settings
													</code>
													.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								<FormField
									control={form.control}
									name="template"
									render={({ field }) => (
										<FormItem>
											<div className="flex items-center justify-between gap-3">
												<FormLabel>Template</FormLabel>
												{(watchKind === "netlab" ||
													watchKind === "c9s_netlab" ||
													watchKind === "containerlab" ||
													watchKind === "c9s_containerlab") && (
													<div className="flex items-center gap-2">
														<Button
															type="button"
															variant="outline"
															size="sm"
															disabled={!watchTemplate}
															onClick={() => setTemplatePreviewOpen(true)}
														>
															View
														</Button>
														{watchKind === "netlab" ||
														watchKind === "c9s_netlab" ? (
															<Button
																type="button"
																variant="outline"
																size="sm"
																disabled={
																	!watchTemplate ||
																	validateNetlabTemplate.isPending
																}
																onClick={() => validateNetlabTemplate.mutate()}
															>
																{validateNetlabTemplate.isPending ? (
																	<>
																		<Loader2 className="mr-2 h-3 w-3 animate-spin" />{" "}
																		Validating…
																	</>
																) : (
																	"Validate"
																)}
															</Button>
														) : null}
													</div>
												)}
											</div>
											{watchKind === "terraform" ? (
												<div className="grid gap-2 rounded-md border p-3">
													<div className="text-xs text-muted-foreground">
														Terraform templates are grouped by provider (folder
														name). Select a provider to filter the template
														list.
													</div>
													<Select
														value={terraformProviderFilter}
														onValueChange={(v) => setTerraformProviderFilter(v)}
														disabled={
															templatesQ.isLoading ||
															(terraformProviders.length === 0 &&
																templates.length === 0)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Provider filter" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="all">All providers</SelectItem>
															{terraformProviders.map((p) => (
																<SelectItem key={p} value={p}>
																	{p}
																</SelectItem>
															))}
															<SelectItem value="ibm" disabled>
																ibm (coming soon)
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											) : null}
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													void templateEstimateQ.refetch();
												}}
												defaultValue={field.value}
												disabled={
													templatesQ.isLoading || templates.length === 0
												}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={
																templatesQ.isLoading
																	? "Loading…"
																	: templates.length
																		? "Select template…"
																		: "No templates"
															}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{templates.map((t) => (
														<SelectItem key={t} value={t}>
															{t}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{templatesQ.isError && (
												<div className="text-xs text-destructive">
													Failed to load templates.
												</div>
											)}
											{watchTemplate ? (
												<div className="rounded-md border p-3 text-xs space-y-1">
													<div className="font-medium text-foreground">
														{templateEstimateQ.isLoading
															? "Estimating resources…"
															: formatResourceEstimate(
																	selectedTemplateEstimate,
																)}
													</div>
													{selectedTemplateEstimate?.reason ? (
														<div className="text-muted-foreground">
															{selectedTemplateEstimate.reason}
														</div>
													) : null}
												</div>
											) : null}
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Deployment name</FormLabel>
											<FormControl>
												<Input placeholder="My Deployment" {...field} />
											</FormControl>
											<FormDescription>
												Custom name for this specific deployment instance.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

								<div className="rounded-md border p-4 space-y-4">
									<div className="flex items-center justify-between">
										<FormLabel>Environment Variables</FormLabel>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => append({ key: "", value: "" })}
										>
											<Plus className="mr-2 h-3 w-3" /> Add Variable
										</Button>
									</div>
								</div>

									<div className="grid gap-6 md:grid-cols-2">
										{watchKind === "c9s_netlab" && (
											<FormField
												control={form.control}
												name="netlabInitialDebug"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs text-muted-foreground">
															Netlab debug flags
														</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="Example: cli,external,template"
																className="font-mono text-xs"
															/>
														</FormControl>
														<FormDescription>
															Optional, per-deployment runtime debug for{" "}
															<code className="font-mono">netlab initial</code>.
															Use comma-separated modules.
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										)}
										<FormField
											control={form.control}
											name="variableGroupId"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs text-muted-foreground">
													Variable Group
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value || "none"}
													value={field.value || "none"}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="None" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">None</SelectItem>
														{variableGroups.map((g) => (
															<SelectItem key={g.id} value={String(g.id)}>
																{g.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>
								</div>

								{fields.length > 0 && (
									<div className="space-y-2">
										{fields.map((field, index) => (
											<div key={field.id} className="flex gap-2 items-start">
												<FormField
													control={form.control}
													name={`env.${index}.key`}
													render={({ field }) => (
														<FormItem className="flex-1">
															<FormControl>
																<Input
																	{...field}
																	placeholder="KEY"
																	className="font-mono text-xs"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name={`env.${index}.value`}
													render={({ field }) => (
														<FormItem className="flex-1">
															<FormControl>
																<Input
																	{...field}
																	placeholder="VALUE"
																	className="font-mono text-xs"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => remove(index)}
													className="shrink-0"
												>
													<Trash2 className="h-4 w-4 text-muted-foreground" />
												</Button>
											</div>
										))}
									</div>
								)}
							</div>
							{mutation.isError && (
								<div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
									{(mutation.error as Error)?.message || "Create failed."}
								</div>
							)}

							<div className="flex gap-3">
								<Button type="submit" disabled={mutation.isPending}>
									{mutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{mutation.isPending ? "Creating…" : "Create Deployment"}
								</Button>
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										navigate({
											to: "/dashboard/deployments",
											search: { userId: watchUserScopeId },
										});
									}}
									disabled={mutation.isPending}
								>
									Back
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			<Dialog open={importOpen} onOpenChange={setImportOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Import EVE-NG lab</DialogTitle>
						<DialogDescription>
							Pull an existing EVE-NG lab into Skyforge or convert it into a
							Containerlab template.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="grid gap-2">
							<FormLabel>EVE-NG server</FormLabel>
							<Select value={importServer} onValueChange={setImportServer}>
								<SelectTrigger>
									<SelectValue placeholder="Select EVE-NG server" />
								</SelectTrigger>
								<SelectContent>
									{eveOptions.map((s) => (
										<SelectItem key={s.id} value={`user:${s.id}`}>
											{hostLabelFromURL(s.apiUrl) || s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>
								Configure EVE-NG servers in Settings if none appear.
							</FormDescription>
						</div>

						<div className="grid gap-2">
							<FormLabel>EVE-NG lab</FormLabel>
							<Select value={importLabPath} onValueChange={setImportLabPath}>
								<SelectTrigger>
									<SelectValue placeholder="Select lab" />
								</SelectTrigger>
								<SelectContent>
									{eveLabsQ.isLoading && (
										<div className="px-3 py-2 text-xs text-muted-foreground">
											Loading labs…
										</div>
									)}
									{!eveLabsQ.isLoading && eveLabOptions.length === 0 && (
										<div className="px-3 py-2 text-xs text-muted-foreground">
											No labs found.
										</div>
									)}
									{eveLabOptions.map((lab) => (
										<SelectItem key={lab.value} value={lab.value}>
											{lab.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{eveLabsQ.isError && (
								<div className="text-xs text-destructive">
									Failed to load labs.
								</div>
							)}
						</div>

						<div className="grid gap-2">
							<FormLabel>Deployment name</FormLabel>
							<Input
								value={importDeploymentName}
								onChange={(e) => setImportDeploymentName(e.target.value)}
								placeholder="Optional override"
							/>
							<FormDescription>
								Defaults to the EVE-NG lab name if left empty.
							</FormDescription>
						</div>

						<div className="flex items-start justify-between gap-3 rounded-md border p-3">
							<div className="space-y-1">
								<FormLabel className="text-sm">
									Create Containerlab deployment
								</FormLabel>
								<FormDescription>
									Generate a Containerlab template and optionally create a
									deployment.
								</FormDescription>
							</div>
							<Switch
								checked={importCreateContainerlab}
								onCheckedChange={setImportCreateContainerlab}
							/>
						</div>

						{importCreateContainerlab && (
							<div className="grid gap-2">
								<FormLabel>Containerlab server</FormLabel>
								<Select
									value={importContainerlabServer}
									onValueChange={setImportContainerlabServer}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select Containerlab server" />
									</SelectTrigger>
									<SelectContent>
										{byosContainerlabServerRefs.map((s) => (
											<SelectItem key={s.value} value={s.value}>
												{s.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									Required to create a Containerlab deployment.
								</FormDescription>
							</div>
						)}
					</div>

					<div className="flex flex-wrap justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setImportOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={() => importEveLab.mutate()}
							disabled={importEveLab.isPending || convertEveLab.isPending}
						>
							{importEveLab.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Import EVE-NG
						</Button>
						<Button
							type="button"
							onClick={() => convertEveLab.mutate()}
							disabled={importEveLab.isPending || convertEveLab.isPending}
						>
							{convertEveLab.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Convert to Containerlab
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={templatePreviewOpen} onOpenChange={setTemplatePreviewOpen}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Template</DialogTitle>
						<DialogDescription className="font-mono text-xs truncate">
							{String((templatePreviewQ.data as any)?.path ?? watchTemplate)}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						{templatePreviewQ.isError && (
							<div className="text-sm text-destructive">
								Failed to load template.
							</div>
						)}
						<Textarea
							readOnly
							value={String((templatePreviewQ.data as any)?.yaml ?? "")}
							className="h-[60vh] font-mono text-xs"
							placeholder={
								templatePreviewQ.isLoading ? "Loading…" : "No template loaded."
							}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
