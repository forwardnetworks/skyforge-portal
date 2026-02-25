import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { queryKeys } from "../../../lib/query-keys";
import {
	createUserForwardCollectorConfig,
	createUserScopeDeployment,
	getSession,
	getUserScopeNetlabTemplates,
	listUserForwardCollectorConfigs,
	listUserScopes,
	runDeploymentAction,
	updateDeploymentLease,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/deployments/executive")({
	component: ExecutiveDeployPage,
});

type ForwardTarget = "fwd_app" | "in_cluster_org" | "custom_onprem";

const CURATED_EXEC_TEMPLATES = [
	"_e2e/eos-minimal/topology.yml",
	"_e2e/iol-minimal/topology.yml",
	"_e2e/xrd-control-plane-minimal/topology.yml",
	"_e2e/cumulus-minimal/topology.yml",
	"_e2e/fortios-minimal/topology.yml",
	"_e2e/vjunos-router-minimal/topology.yml",
	"_e2e/vjunos-switch-minimal/topology.yml",
	"_e2e/nxos-minimal/topology.yml",
	"_e2e/asav-minimal/topology.yml",
	"_e2e/vmx-minimal/topology.yml",
	"_e2e/vptx-minimal/topology.yml",
	"_e2e/arubacx-minimal/topology.yml",
];

const FORWARD_FWD_APP = "https://fwd.app";
const FORWARD_IN_CLUSTER_ORG =
	"http://fwd-appserver.forward.svc.cluster.local:8080";

function normalizeBaseURL(target: ForwardTarget, customHost: string): string {
	if (target === "fwd_app") return FORWARD_FWD_APP;
	if (target === "in_cluster_org") return FORWARD_IN_CLUSTER_ORG;
	const raw = customHost.trim();
	if (!raw) return "";
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
}

function stripProtocol(value: string): string {
	return value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function defaultExecName(template: string): string {
	const stem = template.split("/").slice(-2, -1)[0] || "lab";
	const ts = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
	return `exec-${stem}-${ts}`.toLowerCase();
}

function ExecutiveDeployPage() {
	const qc = useQueryClient();
	const navigate = useNavigate();

	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const scopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
		retry: false,
	});
	const userScopes = scopesQ.data ?? [];
	const currentUser = String(sessionQ.data?.username ?? "").trim();
	const effectiveScope = useMemo(() => {
		if (!currentUser) return userScopes[0];
		return (
			userScopes.find(
				(w) => String(w.createdBy ?? "").trim() === currentUser,
			) ??
			userScopes.find((w) => (w.owners ?? []).includes(currentUser)) ??
			userScopes[0]
		);
	}, [userScopes, currentUser]);
	const userId = String(effectiveScope?.id ?? "").trim();

	const templatesQ = useQuery({
		queryKey: ["executive-templates", userId],
		queryFn: async () =>
			userId
				? getUserScopeNetlabTemplates(userId, {
						source: "blueprints",
						dir: "netlab/_e2e",
					})
				: null,
		enabled: !!userId,
		retry: false,
		staleTime: 60_000,
	});

	const collectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 10_000,
		retry: false,
	});

	const templateChoices = useMemo(() => {
		const serverTemplates = templatesQ.data?.templates ?? [];
		const allowed = new Set(CURATED_EXEC_TEMPLATES);
		const filtered = serverTemplates.filter((t) => allowed.has(String(t)));
		return filtered.length > 0 ? filtered : CURATED_EXEC_TEMPLATES;
	}, [templatesQ.data?.templates]);

	const [template, setTemplate] = useState(CURATED_EXEC_TEMPLATES[0]);
	const [name, setName] = useState(defaultExecName(CURATED_EXEC_TEMPLATES[0]));
	const [leaseHours, setLeaseHours] = useState("4");
	const [collectorId, setCollectorId] = useState("");

	const [target, setTarget] = useState<ForwardTarget>("in_cluster_org");
	const [customHost, setCustomHost] = useState("");
	const [skipTlsVerify, setSkipTlsVerify] = useState(true);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const collectorChoices = collectorsQ.data?.collectors ?? [];
	const effectiveSkipTls =
		target === "in_cluster_org"
			? true
			: target === "fwd_app"
				? false
				: skipTlsVerify;

	const createCredsMutation = useMutation({
		mutationFn: async () => {
			const baseUrl = normalizeBaseURL(target, customHost);
			if (!baseUrl) throw new Error("Host is required for custom on-prem");
			if (!username.trim() || !password.trim()) {
				throw new Error("Username/password are required");
			}
			const displayName = `${username.trim()}@${stripProtocol(baseUrl)}`;
			const created = await createUserForwardCollectorConfig({
				name: displayName,
				baseUrl,
				skipTlsVerify: effectiveSkipTls,
				username: username.trim(),
				password,
				setDefault: false,
			});
			return created;
		},
		onSuccess: async (created) => {
			setCollectorId(String(created.id));
			setPassword("");
			toast.success("Credential profile created");
			await qc.invalidateQueries({
				queryKey: queryKeys.userForwardCollectorConfigs(),
			});
		},
		onError: (err) =>
			toast.error("Failed to create credential profile", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deployMutation = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("No user scope available");
			if (!template.trim()) throw new Error("Template is required");
			const chosenCollector = String(collectorId || "").trim();
			if (!chosenCollector) {
				throw new Error("Select a Forward credential profile first");
			}
			const deployment = await createUserScopeDeployment(userId, {
				name: name.trim() || defaultExecName(template),
				type: "netlab-c9s",
				config: {
					templateSource: "blueprints",
					templatesDir: "netlab",
					template,
					forwardEnabled: true,
					forwardCollectorId: chosenCollector,
				},
			});
			const deploymentId = String(deployment.id || "").trim();
			if (!deploymentId)
				throw new Error("Deployment was created without an id");
			await updateDeploymentLease(userId, deploymentId, {
				enabled: true,
				hours: Number.parseInt(leaseHours, 10) || 4,
			});
			await runDeploymentAction(userId, deploymentId, "create");
			return deploymentId;
		},
		onSuccess: async (deploymentId) => {
			toast.success("Executive deployment queued");
			await qc.invalidateQueries({ queryKey: queryKeys.dashboardSnapshot() });
			await navigate({
				to: "/dashboard/deployments/$deploymentId",
				params: { deploymentId },
			});
		},
		onError: (err) =>
			toast.error("Executive deploy failed", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return (
		<div className="mx-auto w-full max-w-4xl space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">Executive Deploy</h1>
				<p className="text-sm text-muted-foreground">
					One-click deployment path for curated Netlab templates on the
					in-cluster runner.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lab Selection</CardTitle>
					<CardDescription>
						Pick a curated template and lease duration.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2 md:col-span-2">
						<Label>Template</Label>
						<Select
							value={template}
							onValueChange={(v) => {
								setTemplate(v);
								setName(defaultExecName(v));
							}}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{templateChoices.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Deployment Name</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="space-y-2">
						<Label>Lease Duration</Label>
						<Select value={leaseHours} onValueChange={setLeaseHours}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="2">2 hours</SelectItem>
								<SelectItem value="4">4 hours</SelectItem>
								<SelectItem value="8">8 hours</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Forward Credential Profile</CardTitle>
					<CardDescription>
						Select an existing profile or create one inline.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Existing Profile</Label>
						<Select value={collectorId} onValueChange={setCollectorId}>
							<SelectTrigger>
								<SelectValue placeholder="Select profile" />
							</SelectTrigger>
							<SelectContent>
								{collectorChoices.map((c) => (
									<SelectItem key={String(c.id)} value={String(c.id)}>
										{String(c.name)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-4 rounded border p-4 md:grid-cols-2">
						<div className="space-y-2 md:col-span-2">
							<Label>Target</Label>
							<Select
								value={target}
								onValueChange={(v) => setTarget(v as ForwardTarget)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fwd_app">fwd.app</SelectItem>
									<SelectItem value="in_cluster_org">
										in-cluster credential org
									</SelectItem>
									<SelectItem value="custom_onprem">custom on-prem</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Host</Label>
							<Input
								value={
									target === "custom_onprem"
										? customHost
										: normalizeBaseURL(target, customHost)
								}
								onChange={(e) => setCustomHost(e.target.value)}
								disabled={target !== "custom_onprem"}
							/>
						</div>
						<div className="space-y-2">
							<Label>Disable TLS Verify</Label>
							<Select
								value={effectiveSkipTls ? "true" : "false"}
								onValueChange={(v) => setSkipTlsVerify(v === "true")}
								disabled={target !== "custom_onprem"}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="false">No</SelectItem>
									<SelectItem value="true">Yes</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Username</Label>
							<Input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Password</Label>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<div className="md:col-span-2">
							<Button
								variant="outline"
								onClick={() => createCredsMutation.mutate()}
								disabled={createCredsMutation.isPending}
							>
								{createCredsMutation.isPending
									? "Creating..."
									: "Create profile and use it"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="flex items-center gap-3">
				<Button
					onClick={() => deployMutation.mutate()}
					disabled={
						deployMutation.isPending ||
						!userId ||
						templatesQ.isLoading ||
						collectorsQ.isLoading
					}
				>
					{deployMutation.isPending ? "Deploying..." : "One-Click Deploy"}
				</Button>
				<Button
					variant="outline"
					onClick={() => navigate({ to: "/dashboard/deployments" })}
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
