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
import { useDashboardEvents } from "../../../lib/dashboard-events";
import {
	NETLAB_ENV_KEYS,
	isNetlabMultilineKey,
	netlabValuePresets,
} from "../../../lib/netlab-env";
import { queryKeys } from "../../../lib/query-keys";
import {
	type CreateWorkspaceDeploymentRequest,
	type DashboardSnapshot,
	type ExternalTemplateRepo,
	type SkyforgeWorkspace,
	type WorkspaceTemplatesResponse,
	type UserVariableGroup,
	createWorkspaceDeployment,
	getDashboardSnapshot,
	getUserSettings,
	getWorkspaceContainerlabTemplate,
	getWorkspaceContainerlabTemplates,
	getWorkspaceEveNgTemplates,
	getWorkspaceNetlabTemplate,
	getWorkspaceNetlabTemplates,
	getWorkspaceTerraformTemplates,
	getWorkspaces,
	listUserContainerlabServers,
	listUserEveServers,
	listUserForwardCollectorConfigs,
	listUserNetlabServers,
	listUserVariableGroups,
	listWorkspaceEveLabs,
	importWorkspaceEveLab,
	convertWorkspaceEveLab,
	validateWorkspaceNetlabTemplate,
} from "../../../lib/skyforge-api";

const deploymentsSearchSchema = z.object({
	workspace: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/new")({
	validateSearch: (search) => deploymentsSearchSchema.parse(search),
	component: CreateDeploymentPage,
});

type DeploymentKind =
	| "netlab-c9s"
	| "netlab"
	| "eve_ng"
	| "containerlab"
	| "clabernetes"
	| "terraform";
type TemplateSource = "workspace" | "blueprints" | "external";

const formSchema = z.object({
	workspaceId: z.string().min(1, "Workspace is required"),
	name: z.string().min(1, "Deployment name is required").max(100),
	kind: z.enum([
		"netlab-c9s",
		"netlab",
		"containerlab",
		"clabernetes",
		"terraform",
		"eve_ng",
	]),
	source: z.enum(["workspace", "blueprints", "external"]),
	templateRepoId: z.string().optional(),
	template: z.string().min(1, "Template is required"),
	netlabServer: z.string().optional(),
	eveServer: z.string().optional(),
	forwardCollectorId: z.string().optional(),
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

function CreateDeploymentPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { workspace } = Route.useSearch();
	const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
	const [netlabHelpOpen, setNetlabHelpOpen] = useState(false);
	const [terraformProviderFilter, setTerraformProviderFilter] =
		useState<string>("all");
	const [step, setStep] = useState<0 | 1 | 2>(0);
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

	const workspacesQ = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
		staleTime: 30_000,
	});
	const workspaces = (workspacesQ.data?.workspaces ??
		[]) as SkyforgeWorkspace[];

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			workspaceId: workspace || "",
			name: "",
			kind: "netlab-c9s",
			source: "blueprints",
			templateRepoId: "",
			template: "",
			netlabServer: "",
			eveServer: "",
			forwardCollectorId: "none",
			variableGroupId: "none",
			env: [],
		},
	});

	const { watch, setValue, control } = form;
	const { fields, append, remove } = useFieldArray({
		control,
		name: "env",
	});

	useEffect(() => {
		const id =
			step === 0
				? "deploy-step-template"
				: step === 1
					? "deploy-step-params"
					: "deploy-step-review";
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [step]);

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

	const watchWorkspaceId = watch("workspaceId");
	const watchKind = watch("kind");
	const watchSource = watch("source");
	const watchTemplateRepoId = watch("templateRepoId");
	const watchTemplate = watch("template");
	const watchName = watch("name");
	const watchForwardCollectorId = watch("forwardCollectorId");
	const watchEnv = watch("env");
	const templatesUpdatedAt = dash.data?.templatesIndexUpdatedAt ?? "";

	const lastWorkspaceKey = "skyforge.lastWorkspaceId.deployments";

	// Sync workspaceId when workspaces load if not already set or passed via URL
	useEffect(() => {
		if (watchWorkspaceId || workspaces.length === 0) return;
		const urlWs = String(workspace ?? "").trim();
		if (urlWs && workspaces.some((w) => w.id === urlWs)) {
			setValue("workspaceId", urlWs);
			return;
		}
		const stored =
			typeof window !== "undefined"
				? (window.localStorage.getItem(lastWorkspaceKey) ?? "")
				: "";
		if (stored && workspaces.some((w) => w.id === stored)) {
			setValue("workspaceId", stored);
			return;
		}
		setValue("workspaceId", workspaces[0].id);
	}, [watchWorkspaceId, workspaces, setValue]);

	// Persist last-selected workspace for Create Deployment.
	useEffect(() => {
		if (!watchWorkspaceId) return;
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem(lastWorkspaceKey, watchWorkspaceId);
		} catch {
			// ignore
		}
	}, [watchWorkspaceId]);

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
		queryKey: queryKeys.workspaceEveLabs(
			watchWorkspaceId,
			importServer,
			"",
			true,
		),
		queryFn: () =>
			listWorkspaceEveLabs(watchWorkspaceId, {
				server: importServer,
				recursive: true,
			}),
		enabled: Boolean(importOpen && watchWorkspaceId && importServer),
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
		enabled: ["netlab-c9s", "clabernetes", "terraform"].includes(watchKind),
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
		if (!["netlab-c9s", "clabernetes", "terraform"].includes(watchKind)) {
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
		if (watchKind === "netlab" || watchKind === "netlab-c9s")
			return watchSource === "workspace" ? "workspace" : "blueprints";
		if (watchKind === "eve_ng") return "blueprints";
		if (watchKind === "containerlab" || watchKind === "clabernetes")
			return watchSource;
		if (watchKind === "terraform") return watchSource;
		return "workspace";
	}, [watchKind, watchSource]);

	const templatesQ = useQuery<WorkspaceTemplatesResponse>({
		queryKey: queryKeys.workspaceTemplates(
			watchWorkspaceId,
			watchKind,
			effectiveSource,
			watchTemplateRepoId || undefined,
			undefined,
		),
		enabled: !!watchWorkspaceId,
		queryFn: async () => {
			const query: { source?: string; repo?: string } = {
				source: effectiveSource,
			};
			if (effectiveSource === "external" && watchTemplateRepoId)
				query.repo = watchTemplateRepoId;

			switch (watchKind) {
				case "netlab":
				case "netlab-c9s":
					return getWorkspaceNetlabTemplates(watchWorkspaceId, query);
				case "eve_ng":
					return getWorkspaceEveNgTemplates(watchWorkspaceId, query);
				case "containerlab":
				case "clabernetes":
					return getWorkspaceContainerlabTemplates(watchWorkspaceId, query);
				case "terraform":
					return getWorkspaceTerraformTemplates(watchWorkspaceId, query);
				default:
					return getWorkspaceNetlabTemplates(watchWorkspaceId, query);
			}
		},
		staleTime: 5 * 60_000,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (!templatesUpdatedAt) return;
		void queryClient.invalidateQueries({ queryKey: ["workspaceTemplates"] });
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
			"workspaceTemplate",
			watchKind,
			watchWorkspaceId,
			effectiveSource,
			watchTemplateRepoId,
			templatesQ.data?.dir,
			watchTemplate,
		],
		queryFn: async () => {
			if (!watchWorkspaceId) throw new Error("workspaceId is required");
			if (!watchTemplate) throw new Error("template is required");
			const query: any = { source: effectiveSource };
			if (effectiveSource === "external" && watchTemplateRepoId)
				query.repo = watchTemplateRepoId;
			if (templatesQ.data?.dir) query.dir = templatesQ.data.dir;
			if (watchKind === "containerlab" || watchKind === "clabernetes") {
				return getWorkspaceContainerlabTemplate(watchWorkspaceId, {
					...query,
					file: watchTemplate,
				});
			}
			// Default: treat as netlab-like.
			return getWorkspaceNetlabTemplate(watchWorkspaceId, {
				...query,
				template: watchTemplate,
			});
		},
		enabled:
			templatePreviewOpen &&
			Boolean(watchWorkspaceId) &&
			Boolean(watchTemplate) &&
			(watchKind === "netlab" ||
				watchKind === "netlab-c9s" ||
				watchKind === "containerlab" ||
				watchKind === "clabernetes"),
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

			if (["netlab-c9s", "clabernetes", "terraform"].includes(values.kind)) {
				const cid = String(values.forwardCollectorId ?? "none").trim();
				if (cid && cid !== "none") {
					config.forwardEnabled = true;
					(config as any).forwardCollectorId = cid;
				}
			}

			if (values.kind === "netlab" || values.kind === "containerlab") {
				const v = (values.netlabServer || "").trim();
				if (!v) throw new Error("BYOS server is required");
				config.netlabServer = v;
				config.templateSource = effectiveSource;
				if (effectiveSource === "external" && values.templateRepoId)
					config.templateRepo = values.templateRepoId;
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
			}

			if (values.kind === "netlab-c9s") {
				config.templateSource = effectiveSource;
				if (effectiveSource === "external" && values.templateRepoId)
					config.templateRepo = values.templateRepoId;
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
			}

			if (values.kind === "clabernetes") {
				config.templateSource = effectiveSource;
				if (effectiveSource === "external" && values.templateRepoId)
					config.templateRepo = values.templateRepoId;
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
			}

			if (values.kind === "terraform") {
				config.templateSource = effectiveSource;
				if (effectiveSource === "external" && values.templateRepoId)
					config.templateRepo = values.templateRepoId;
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
			}

			if (values.kind === "eve_ng") {
				config.templateSource = "blueprints";
				if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
				const eve = (values.eveServer || "").trim();
				if (!eve) throw new Error("EVE-NG server is required");
				config.eveServer = eve;
			}

			const body: CreateWorkspaceDeploymentRequest = {
				name: values.name,
				type: values.kind,
				config: config as any,
			};
			return createWorkspaceDeployment(values.workspaceId, body);
		},
		onSuccess: async (_, variables) => {
			toast.success("Deployment created successfully", {
				description: `${variables.name} is now queued for provisioning.`,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			await navigate({
				to: "/dashboard/deployments",
				search: { workspace: variables.workspaceId },
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
			if (!watchWorkspaceId) throw new Error("Select a workspace first.");
			const server = importServer.trim();
			if (!server) throw new Error("Select an EVE-NG server.");
			const labPath = importLabPath.trim();
			if (!labPath) throw new Error("Select an EVE-NG lab.");
			return importWorkspaceEveLab(watchWorkspaceId, {
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
				search: { workspace: watchWorkspaceId },
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
			if (!watchWorkspaceId) throw new Error("Select a workspace first.");
			const server = importServer.trim();
			if (!server) throw new Error("Select an EVE-NG server.");
			const labPath = importLabPath.trim();
			if (!labPath) throw new Error("Select an EVE-NG lab.");
			const createDeployment = importCreateContainerlab;
			const containerlabServer = importContainerlabServer.trim();
			if (createDeployment && !containerlabServer) {
				throw new Error("Select a Containerlab server.");
			}
			return convertWorkspaceEveLab(watchWorkspaceId, {
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
					search: { workspace: watchWorkspaceId },
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
			if (!watchWorkspaceId) throw new Error("Select a workspace first.");
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
				source: effectiveSource,
				template: watchTemplate,
				environment: env,
			};
			if (effectiveSource === "external" && watchTemplateRepoId)
				body.repo = watchTemplateRepoId;
			if (templatesQ.data?.dir) body.dir = templatesQ.data.dir;
			return validateWorkspaceNetlabTemplate(watchWorkspaceId, body);
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
									search: { workspace: watchWorkspaceId },
								})
							}
						>
							Cancel
						</Button>
					</div>
				</CardHeader>
			</Card>

			{byosEveEnabled && (
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
						<Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
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
							<div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-2">
								<Button
									type="button"
									variant={step === 0 ? "default" : "ghost"}
									size="sm"
									onClick={() => setStep(0)}
								>
									1. Template
								</Button>
								<Button
									type="button"
									variant={step === 1 ? "default" : "ghost"}
									size="sm"
									onClick={() => setStep(1)}
								>
									2. Parameters
								</Button>
								<Button
									type="button"
									variant={step === 2 ? "default" : "ghost"}
									size="sm"
									onClick={() => setStep(2)}
								>
									3. Review
								</Button>
							</div>

							<div id="deploy-step-template" className="scroll-mt-24" />
							<div className="grid gap-6 md:grid-cols-2">
								<FormField
									control={form.control}
									name="workspaceId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Workspace</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select workspace" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{workspaces.map((w) => (
														<SelectItem key={w.id} value={w.id}>
															{w.name} ({w.slug})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

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
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select provider" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="netlab-c9s">Netlab</SelectItem>
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
													<SelectItem value="clabernetes">
														Containerlab
													</SelectItem>
													<SelectItem value="terraform">Terraform</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								{["netlab-c9s", "clabernetes", "terraform"].includes(
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
													<SelectItem value="workspace">
														Workspace repo
													</SelectItem>
													<SelectItem value="blueprints">Blueprints</SelectItem>
													<SelectItem
														value="external"
														disabled={
															!externalAllowed ||
															(watchKind !== "containerlab" &&
																watchKind !== "clabernetes" &&
																watchKind !== "terraform")
														}
													>
														External repo
													</SelectItem>
												</SelectContent>
											</Select>
											{!externalAllowed &&
												(watchKind === "containerlab" ||
													watchKind === "clabernetes" ||
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
													watchKind === "netlab-c9s" ||
													watchKind === "containerlab" ||
													watchKind === "clabernetes") && (
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
														watchKind === "netlab-c9s" ? (
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
												onValueChange={field.onChange}
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

							<div id="deploy-step-params" className="scroll-mt-24" />
							<div className="rounded-md border p-4 space-y-4">
								<div className="flex items-center justify-between">
									<FormLabel>Environment Variables</FormLabel>
									<div className="flex items-center gap-2">
										{(watchKind === "netlab-c9s" || watchKind === "netlab") && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setNetlabHelpOpen(true)}
											>
												Supported NETLAB_ vars
											</Button>
										)}
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
												{watchKind === "netlab-c9s" ||
												watchKind === "netlab" ? (
													<FormField
														control={form.control}
														name={`env.${index}.key`}
														render={({ field }) => {
															const currentKey = String(
																field.value ?? "",
															).trim();
															const isKnown = NETLAB_ENV_KEYS.some(
																(k) => k.key === currentKey,
															);
															const selectValue = isKnown
																? currentKey
																: "__custom__";
															return (
																<FormItem className="flex-1 space-y-2">
																	<FormControl>
																		<Select
																			value={selectValue}
																			onValueChange={(v) => {
																				if (v === "__custom__") {
																					field.onChange("");
																				} else {
																					field.onChange(v);
																				}
																			}}
																		>
																			<SelectTrigger>
																				<SelectValue placeholder="Select env var…" />
																			</SelectTrigger>
																			<SelectContent>
																				{NETLAB_ENV_KEYS.map((k) => (
																					<SelectItem key={k.key} value={k.key}>
																						{k.label}
																					</SelectItem>
																				))}
																				<SelectItem value="__custom__">
																					Custom…
																				</SelectItem>
																			</SelectContent>
																		</Select>
																	</FormControl>
																	{selectValue === "__custom__" && (
																		<FormControl>
																			<Input
																				{...field}
																				placeholder="KEY"
																				className="font-mono text-xs"
																			/>
																		</FormControl>
																	)}
																	<FormMessage />
																</FormItem>
															);
														}}
													/>
												) : (
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
												)}
												<FormField
													control={form.control}
													name={`env.${index}.value`}
													render={({ field }) => (
														<FormItem className="flex-1">
															<FormControl>
																{(() => {
																	const key = String(
																		form.getValues(`env.${index}.key`) ?? "",
																	).trim();
																	if (isNetlabMultilineKey(key)) {
																		return (
																			<Textarea
																				{...field}
																				placeholder={
																					"One `key=value` per line.\nExample:\naddressing.p2p.ipv4=198.18.0.0/16"
																				}
																				className="font-mono text-xs min-h-[120px]"
																			/>
																		);
																	}
																	const presets = netlabValuePresets(key);
																	if (!presets)
																		return (
																			<Input
																				{...field}
																				placeholder="VALUE"
																				className="font-mono text-xs"
																			/>
																		);

																	const currentValue = String(
																		field.value ?? "",
																	).trim();
																	const isPreset = presets.some(
																		(p) => p.value === currentValue,
																	);
																	const selectValue = currentValue
																		? isPreset
																			? currentValue
																			: "__custom__"
																		: "none";

																	return (
																		<div className="space-y-2">
																			<Select
																				value={selectValue}
																				onValueChange={(v) => {
																					if (v === "none") field.onChange("");
																					else if (v === "__custom__")
																						field.onChange(
																							currentValue && !isPreset
																								? currentValue
																								: "",
																						);
																					else field.onChange(v);
																				}}
																			>
																				<SelectTrigger>
																					<SelectValue placeholder="Select value…" />
																				</SelectTrigger>
																				<SelectContent>
																					<SelectItem value="none">
																						None
																					</SelectItem>
																					{presets.map((p) => (
																						<SelectItem
																							key={p.value}
																							value={p.value}
																						>
																							{p.label}
																						</SelectItem>
																					))}
																					<SelectItem value="__custom__">
																						Custom…
																					</SelectItem>
																				</SelectContent>
																			</Select>
																			{selectValue === "__custom__" && (
																				<Input
																					{...field}
																					placeholder="VALUE"
																					className="font-mono text-xs"
																				/>
																			)}
																		</div>
																	);
																})()}
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
							<Dialog open={netlabHelpOpen} onOpenChange={setNetlabHelpOpen}>
								<DialogContent className="max-w-2xl">
									<DialogHeader>
										<DialogTitle>Supported Netlab overrides</DialogTitle>
										<DialogDescription>
											These variables are passed into the Netlab generator. Use{" "}
											<span className="font-mono">NETLAB_*</span> for native
											Netlab defaults, and{" "}
											<span className="font-mono">
												SKYFORGE_NETLAB_SET_OVERRIDES
											</span>{" "}
											for generator-only{" "}
											<span className="font-mono">netlab --set</span> overrides.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-2 text-sm">
										{NETLAB_ENV_KEYS.map((k) => (
											<div
												key={k.key}
												className="flex items-start justify-between gap-3 rounded-md border p-3"
											>
												<div className="min-w-0">
													<div className="font-medium">{k.label}</div>
													<div className="text-xs text-muted-foreground font-mono break-all">
														{k.key}
													</div>
												</div>
											</div>
										))}
									</div>
								</DialogContent>
							</Dialog>

							<div id="deploy-step-review" className="scroll-mt-24" />
							<Card variant="glass">
								<CardHeader>
									<CardTitle className="text-base">Review</CardTitle>
									<CardDescription>
										Confirm your selections before creating the deployment.
									</CardDescription>
								</CardHeader>
								<CardContent className="grid gap-2 text-sm">
									<div className="flex items-center justify-between gap-3">
										<div className="text-muted-foreground">Workspace</div>
										<div className="font-mono text-xs">
											{watchWorkspaceId || "—"}
										</div>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="text-muted-foreground">Provider</div>
										<div className="font-mono text-xs">{watchKind}</div>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="text-muted-foreground">Template source</div>
										<div className="font-mono text-xs">{effectiveSource}</div>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="text-muted-foreground">Template</div>
										<div className="font-mono text-xs">
											{watchTemplate || "—"}
										</div>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="text-muted-foreground">Name</div>
										<div className="font-mono text-xs">{watchName || "—"}</div>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="text-muted-foreground">Env vars</div>
										<div className="font-mono text-xs">
											{(form.getValues("env") ?? []).filter((e) =>
												e.key?.trim(),
											).length || 0}
										</div>
									</div>
								</CardContent>
							</Card>

							{mutation.isError && (
								<div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
									{(mutation.error as Error)?.message || "Create failed."}
								</div>
							)}

							<div className="flex gap-3">
								{step === 2 ? (
									<Button type="submit" disabled={mutation.isPending}>
										{mutation.isPending && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										{mutation.isPending ? "Creating…" : "Create Deployment"}
									</Button>
								) : (
									<Button
										type="button"
										onClick={async () => {
											if (step === 0) {
												const ok = await form.trigger([
													"workspaceId",
													"kind",
													"source",
													"template",
													"name",
												]);
												if (!ok) return;
											}
											setStep((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : s));
										}}
										disabled={mutation.isPending}
									>
										Next
									</Button>
								)}
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										if (step > 0) {
											setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2) : s));
											return;
										}
										navigate({
											to: "/dashboard/deployments",
											search: { workspace: watchWorkspaceId },
										});
									}}
									disabled={mutation.isPending}
								>
									Back
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setStep(2)}
									disabled={mutation.isPending}
								>
									Review
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
								<FormLabel className="text-sm">Create Containerlab deployment</FormLabel>
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
