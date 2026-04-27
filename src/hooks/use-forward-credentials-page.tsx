import { listAssignableUsers } from "@/lib/api-client-deployment-source-shares";
import {
	type ForwardTenantCredentialResponse,
	type ForwardTenantFeatureFlags,
	type ForwardTenantResetRunsResponse,
	createUserForwardCollectorConfig,
	deleteUserForwardCollectorConfig,
	getCurrentUserForwardCustomerTenantCredential,
	getCurrentUserForwardCustomerTenantFeatures,
	getCurrentUserForwardDemoTenantCredential,
	getCurrentUserForwardTenantCredential,
	getCurrentUserForwardTenantFeatures,
	listCurrentUserForwardCustomerTenantRebuildRuns,
	listCurrentUserForwardDemoTenantRebuildRuns,
	listCurrentUserForwardTenantRebuildRuns,
	listUserForwardCollectorConfigs,
	putCurrentUserForwardCustomerTenantFeatures,
	putCurrentUserForwardTenantFeatures,
	reconcileCurrentUserForwardCustomerBanner,
	requestCurrentUserForwardCustomerTenantRebuild,
	requestCurrentUserForwardDemoTenantRebuild,
	requestCurrentUserForwardTenantRebuild,
	resetCurrentUserForwardCustomerTenantCredential,
	resetCurrentUserForwardDemoTenantCredential,
	resetCurrentUserForwardTenantCredential,
	revealCurrentUserForwardCustomerTenantCredentialPassword,
	revealCurrentUserForwardDemoTenantCredentialPassword,
	revealCurrentUserForwardTenantCredentialPassword,
} from "@/lib/api-client-forward-collectors";
import {
	type ForwardOrgShareTenantKind,
	deleteForwardOrgShare,
	listForwardOrgShares,
	putForwardOrgShare,
} from "@/lib/api-client-forward-org-shares";
import {
	type ForwardPerformanceNetworksResponse,
	type ManagedForwardTenantKind,
	generateManagedForwardTenantPerformance,
	injectManagedForwardTenantSnapshotDataFile,
	listManagedForwardTenantPerformanceNetworks,
} from "@/lib/api-client-forward-performance";
import { queryKeys } from "@/lib/query-keys";
import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ForwardCredentialTarget = "in_cluster_org" | "custom_onprem";
type ManagedTenantState = {
	credentialQ: UseQueryResult<ForwardTenantCredentialResponse, Error>;
	resetRunsQ: UseQueryResult<ForwardTenantResetRunsResponse, Error>;
	performanceNetworksQ: UseQueryResult<
		ForwardPerformanceNetworksResponse,
		Error
	>;
	revealedPassword: string;
	confirmHardReset: boolean;
};
type ForwardFeatureTenant = "primary" | "customer";

const FORWARD_IN_CLUSTER_ORG =
	"https://fwd-appserver.forward.svc.cluster.local";

const MANAGED_TENANT_KEYS: ManagedForwardTenantKind[] = [
	"demo",
	"customer",
	"primary",
];

function normalizeBaseURL(
	target: ForwardCredentialTarget,
	customHost: string,
): string {
	if (target === "in_cluster_org") return FORWARD_IN_CLUSTER_ORG;
	const raw = customHost.trim();
	if (!raw) return "";
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
}

export function stripForwardCredentialProtocol(value: string): string {
	return value.replace(/^https?:\/\//i, "");
}

export function isInClusterCollectorBaseURL(value: string): boolean {
	return (
		stripForwardCredentialProtocol(value).replace(/\/+$/, "").toLowerCase() ===
		stripForwardCredentialProtocol(FORWARD_IN_CLUSTER_ORG).toLowerCase()
	);
}

function tenantKindLabel(kind: ManagedForwardTenantKind): string {
	if (kind === "demo") return "demo org";
	if (kind === "customer") return "customer org";
	return "deployment org";
}

export function useForwardCredentialsPage() {
	const queryClient = useQueryClient();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();
	const tenantFeaturesKey = (tenant: ForwardFeatureTenant) =>
		["forward", "org-features", tenant] as const;

	const collectorsQ = useQuery({
		queryKey: collectorsKey,
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 10_000,
	});
	const primaryTenantFeaturesQ = useQuery({
		queryKey: tenantFeaturesKey("primary"),
		queryFn: getCurrentUserForwardTenantFeatures,
		staleTime: 10_000,
	});
	const customerTenantFeaturesQ = useQuery({
		queryKey: tenantFeaturesKey("customer"),
		queryFn: getCurrentUserForwardCustomerTenantFeatures,
		staleTime: 10_000,
	});
	const assignableUsersQ = useQuery({
		queryKey: ["assignableUsers", "forward-org-shares"],
		queryFn: listAssignableUsers,
		staleTime: 30_000,
	});
	const forwardOrgSharesQ = useQuery({
		queryKey: queryKeys.userForwardOrgShares(),
		queryFn: listForwardOrgShares,
		staleTime: 10_000,
	});

	const demoCredentialQ = useQuery({
		queryKey: queryKeys.userForwardManagedTenantCredential("demo"),
		queryFn: getCurrentUserForwardDemoTenantCredential,
		staleTime: 10_000,
	});
	const primaryCredentialQ = useQuery({
		queryKey: queryKeys.userForwardManagedTenantCredential("primary"),
		queryFn: getCurrentUserForwardTenantCredential,
		staleTime: 10_000,
	});
	const customerCredentialQ = useQuery({
		queryKey: queryKeys.userForwardManagedTenantCredential("customer"),
		queryFn: getCurrentUserForwardCustomerTenantCredential,
		staleTime: 10_000,
	});
	const demoResetRunsQ = useQuery({
		queryKey: queryKeys.userForwardTenantRebuildRunsByKind("demo"),
		queryFn: listCurrentUserForwardDemoTenantRebuildRuns,
		staleTime: 5_000,
	});
	const primaryResetRunsQ = useQuery({
		queryKey: queryKeys.userForwardTenantRebuildRunsByKind("primary"),
		queryFn: listCurrentUserForwardTenantRebuildRuns,
		staleTime: 5_000,
	});
	const customerResetRunsQ = useQuery({
		queryKey: queryKeys.userForwardTenantRebuildRunsByKind("customer"),
		queryFn: listCurrentUserForwardCustomerTenantRebuildRuns,
		staleTime: 5_000,
	});
	const demoPerformanceNetworksQ = useQuery({
		queryKey: queryKeys.userForwardManagedTenantPerformanceNetworks("demo"),
		queryFn: () => listManagedForwardTenantPerformanceNetworks("demo"),
		staleTime: 10_000,
		retry: false,
	});
	const primaryPerformanceNetworksQ = useQuery({
		queryKey: queryKeys.userForwardManagedTenantPerformanceNetworks("primary"),
		queryFn: () => listManagedForwardTenantPerformanceNetworks("primary"),
		staleTime: 10_000,
		retry: false,
	});
	const customerPerformanceNetworksQ = useQuery({
		queryKey: queryKeys.userForwardManagedTenantPerformanceNetworks("customer"),
		queryFn: () => listManagedForwardTenantPerformanceNetworks("customer"),
		staleTime: 10_000,
		retry: false,
	});

	const [customHost, setCustomHost] = useState("");
	const [skipTlsVerify, setSkipTlsVerify] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [revealedPasswords, setRevealedPasswords] = useState<
		Record<ManagedForwardTenantKind, string>
	>({
		demo: "",
		customer: "",
		primary: "",
	});
	const [confirmHardResetByTenant, setConfirmHardResetByTenant] = useState<
		Record<ManagedForwardTenantKind, boolean>
	>({
		demo: false,
		customer: false,
		primary: false,
	});
	const tlsCheckboxDisabled = false;
	const effectiveSkipTlsVerify = skipTlsVerify;

	const credentialSets = useMemo(
		() => collectorsQ.data?.collectors ?? [],
		[collectorsQ.data?.collectors],
	);

	const createMutation = useMutation({
		mutationFn: async () => {
			const baseUrl = normalizeBaseURL("custom_onprem", customHost);
			if (!baseUrl) throw new Error("Host is required for custom on-prem");
			if (!username.trim()) throw new Error("Username is required");
			if (!password.trim()) throw new Error("Password is required");
			const hostKey = stripForwardCredentialProtocol(baseUrl).replace(
				/\/+$/,
				"",
			);
			const displayName = `${username.trim()}@${hostKey}`;
			return createUserForwardCollectorConfig({
				name: displayName,
				baseUrl,
				skipTlsVerify: effectiveSkipTlsVerify,
				username: username.trim(),
				password,
				setDefault: false,
			});
		},
		onSuccess: async () => {
			toast.success("Forward credential set saved");
			setPassword("");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (err) =>
			toast.error("Failed to save credential set", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => deleteUserForwardCollectorConfig(id),
		onSuccess: async () => {
			toast.success("Credential set deleted");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (err) =>
			toast.error("Failed to delete credential set", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const resetTenantCredentialMutation = useMutation({
		mutationFn: async (tenant: ManagedForwardTenantKind) =>
			tenant === "demo"
				? resetCurrentUserForwardDemoTenantCredential()
				: tenant === "customer"
					? resetCurrentUserForwardCustomerTenantCredential()
					: resetCurrentUserForwardTenantCredential(),
		onSuccess: async (_resp, tenant) => {
			toast.success(`Forward ${tenantKindLabel(tenant)} credential reset`);
			setRevealedPasswords((prev) => ({ ...prev, [tenant]: "" }));
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardManagedTenantCredential(tenant),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardManagedTenantPerformanceNetworks(tenant),
			});
			if (tenant === "primary") {
				await queryClient.invalidateQueries({ queryKey: collectorsKey });
			}
		},
		onError: (err, tenant) =>
			toast.error(
				`Failed to reset Forward ${tenantKindLabel(tenant)} credential`,
				{
					description: err instanceof Error ? err.message : String(err),
				},
			),
	});

	const revealTenantCredentialMutation = useMutation({
		mutationFn: async (tenant: ManagedForwardTenantKind) =>
			tenant === "demo"
				? revealCurrentUserForwardDemoTenantCredentialPassword()
				: tenant === "customer"
					? revealCurrentUserForwardCustomerTenantCredentialPassword()
					: revealCurrentUserForwardTenantCredentialPassword(),
		onSuccess: (resp, tenant) => {
			const value = String(resp?.password ?? "").trim();
			if (!value) {
				toast.error("Managed credential password unavailable");
				return;
			}
			setRevealedPasswords((prev) => ({ ...prev, [tenant]: value }));
			toast.success(`Managed ${tenantKindLabel(tenant)} password revealed`);
		},
		onError: (err, tenant) =>
			toast.error(`Failed to reveal ${tenantKindLabel(tenant)} password`, {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const requestTenantResetMutation = useMutation({
		mutationFn: async (input: {
			tenant: ManagedForwardTenantKind;
			mode: "soft-reset" | "hard-reset" | "curated-reset";
		}) =>
			input.tenant === "demo"
				? requestCurrentUserForwardDemoTenantRebuild({
						mode: input.mode,
						reason: "",
						metadata: {},
					})
				: input.tenant === "customer"
					? requestCurrentUserForwardCustomerTenantRebuild({
							mode: input.mode,
							reason: "",
							metadata: {},
						})
					: requestCurrentUserForwardTenantRebuild({
							mode: input.mode,
							reason: "",
							metadata: {},
						}),
		onSuccess: async (_run, input) => {
			toast.success(
				input.mode === "hard-reset"
					? `Forward ${tenantKindLabel(input.tenant)} rebuild queued`
					: input.mode === "curated-reset"
						? `Forward ${tenantKindLabel(input.tenant)} restore queued`
						: `Forward ${tenantKindLabel(input.tenant)} resync queued`,
			);
			if (input.mode === "hard-reset") {
				setConfirmHardResetByTenant((prev) => ({
					...prev,
					[input.tenant]: false,
				}));
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardTenantRebuildRunsByKind(input.tenant),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardManagedTenantCredential(input.tenant),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardManagedTenantPerformanceNetworks(
					input.tenant,
				),
			});
			if (input.tenant === "primary") {
				await queryClient.invalidateQueries({ queryKey: collectorsKey });
			}
		},
		onError: (err, input) =>
			toast.error(
				input.mode === "hard-reset"
					? `Failed to queue Forward ${tenantKindLabel(input.tenant)} rebuild`
					: `Failed to queue Forward ${tenantKindLabel(input.tenant)} reset`,
				{
					description: err instanceof Error ? err.message : String(err),
				},
			),
	});

	const reconcileCustomerBannerMutation = useMutation({
		mutationFn: reconcileCurrentUserForwardCustomerBanner,
		onSuccess: async (resp) => {
			const networkCount = Number(resp.networkCount ?? 0);
			toast.success("Customer org banner reconciled", {
				description:
					networkCount > 0
						? `Applied across ${networkCount} network${networkCount === 1 ? "" : "s"}`
						: "No customer networks found",
			});
		},
		onError: (err) =>
			toast.error("Failed to reconcile customer org banner", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveTenantFeaturesMutation = useMutation({
		mutationFn: async (input: {
			tenant: ForwardFeatureTenant;
			features: ForwardTenantFeatureFlags;
		}) =>
			input.tenant === "customer"
				? putCurrentUserForwardCustomerTenantFeatures({
						features: input.features,
					})
				: putCurrentUserForwardTenantFeatures({ features: input.features }),
		onSuccess: async (_resp, input) => {
			toast.success("Experimental features saved");
			await queryClient.invalidateQueries({
				queryKey: tenantFeaturesKey(input.tenant),
			});
		},
		onError: (err) =>
			toast.error("Failed to save experimental features", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const generateSyntheticPerformanceMutation = useMutation({
		mutationFn: async (input: {
			tenant: ManagedForwardTenantKind;
			networkRef: string;
			snapshotId?: string;
			generationIntervalMins?: number;
			healthyDeviceOdds?: number;
			healthyInterfaceOdds?: number;
		}) =>
			generateManagedForwardTenantPerformance(input.tenant, input.networkRef, {
				snapshotId: input.snapshotId,
				generationIntervalMins: input.generationIntervalMins,
				healthyDeviceOdds: input.healthyDeviceOdds,
				healthyInterfaceOdds: input.healthyInterfaceOdds,
			}),
		onSuccess: async (resp, input) => {
			toast.success("Synthetic performance data generated", {
				description: `snapshot ${resp.snapshotId ?? "latest"}${resp.numDevices ? `, devices ${resp.numDevices}` : ""}`,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardManagedTenantPerformanceNetworks(
					input.tenant,
				),
			});
		},
		onError: (err) =>
			toast.error("Failed to generate synthetic performance data", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const injectSnapshotDataFileMutation = useMutation({
		mutationFn: async (input: {
			tenant: ManagedForwardTenantKind;
			networkRef: string;
			snapshotId?: string;
			pricingSourceUrl?: string;
			dataFileName: string;
			nqeName?: string;
			description?: string;
			storedFileName?: string;
			fileTypeProto?: string;
			schemaFields?: string[];
			content: string;
			snapshotNote?: string;
		}) =>
			injectManagedForwardTenantSnapshotDataFile(
				input.tenant,
				input.networkRef,
				{
					snapshotId: input.snapshotId,
					pricingSourceUrl: input.pricingSourceUrl,
					dataFileName: input.dataFileName,
					nqeName: input.nqeName,
					description: input.description,
					storedFileName: input.storedFileName,
					fileTypeProto: input.fileTypeProto,
					schemaFields: input.schemaFields,
					content: input.content,
					snapshotNote: input.snapshotNote,
				},
			),
		onSuccess: async (resp, input) => {
			toast.success("Snapshot data file injected", {
				description: `new snapshot ${resp.injectedSnapshotId}`,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardManagedTenantPerformanceNetworks(
					input.tenant,
				),
			});
		},
		onError: (err) =>
			toast.error("Failed to inject data file into snapshot", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const grantForwardOrgShareMutation = useMutation({
		mutationFn: async (input: {
			tenantKind: ForwardOrgShareTenantKind;
			username: string;
		}) =>
			putForwardOrgShare({
				tenantKind: input.tenantKind,
				username: input.username,
				access: "impersonate",
			}),
		onSuccess: async (_resp, input) => {
			toast.success("Forward org access granted", {
				description: `${input.username} can now open your ${tenantKindLabel(input.tenantKind)}.`,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardOrgShares(),
			});
		},
		onError: (err) =>
			toast.error("Failed to grant Forward org access", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const revokeForwardOrgShareMutation = useMutation({
		mutationFn: async (input: {
			tenantKind: ForwardOrgShareTenantKind;
			username: string;
		}) => deleteForwardOrgShare(input.tenantKind, input.username),
		onSuccess: async (_resp, input) => {
			toast.success("Forward org access revoked", {
				description: `${input.username} can no longer open your ${tenantKindLabel(input.tenantKind)}.`,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardOrgShares(),
			});
		},
		onError: (err) =>
			toast.error("Failed to revoke Forward org access", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const tenants = useMemo<Record<ManagedForwardTenantKind, ManagedTenantState>>(
		() => ({
			demo: {
				credentialQ: demoCredentialQ,
				resetRunsQ: demoResetRunsQ,
				performanceNetworksQ: demoPerformanceNetworksQ,
				revealedPassword: revealedPasswords.demo,
				confirmHardReset: confirmHardResetByTenant.demo,
			},
			customer: {
				credentialQ: customerCredentialQ,
				resetRunsQ: customerResetRunsQ,
				performanceNetworksQ: customerPerformanceNetworksQ,
				revealedPassword: revealedPasswords.customer,
				confirmHardReset: confirmHardResetByTenant.customer,
			},
			primary: {
				credentialQ: primaryCredentialQ,
				resetRunsQ: primaryResetRunsQ,
				performanceNetworksQ: primaryPerformanceNetworksQ,
				revealedPassword: revealedPasswords.primary,
				confirmHardReset: confirmHardResetByTenant.primary,
			},
		}),
		[
			confirmHardResetByTenant.customer,
			confirmHardResetByTenant.demo,
			confirmHardResetByTenant.primary,
			customerCredentialQ,
			customerPerformanceNetworksQ,
			customerResetRunsQ,
			demoCredentialQ,
			demoPerformanceNetworksQ,
			demoResetRunsQ,
			primaryCredentialQ,
			primaryPerformanceNetworksQ,
			primaryResetRunsQ,
			revealedPasswords.customer,
			revealedPasswords.demo,
			revealedPasswords.primary,
		],
	);

	const tenantFeaturesQueries = useMemo(
		() => ({
			primary: primaryTenantFeaturesQ,
			customer: customerTenantFeaturesQ,
		}),
		[customerTenantFeaturesQ, primaryTenantFeaturesQ],
	);

	return {
		collectorsQ,
		assignableUsersQ,
		forwardOrgSharesQ,
		tenantFeaturesQueries,
		tenants,
		customHost,
		setCustomHost,
		skipTlsVerify,
		setSkipTlsVerify,
		username,
		setUsername,
		password,
		setPassword,
		setRevealedTenantPassword: (
			tenant: ManagedForwardTenantKind,
			value: string,
		) => {
			setRevealedPasswords((prev) => ({ ...prev, [tenant]: value }));
		},
		setConfirmHardReset: (tenant: ManagedForwardTenantKind, value: boolean) => {
			setConfirmHardResetByTenant((prev) => ({ ...prev, [tenant]: value }));
		},
		tlsCheckboxDisabled,
		effectiveSkipTlsVerify,
		credentialSets,
		createMutation,
		deleteMutation,
		resetTenantCredentialMutation,
		revealTenantCredentialMutation,
		requestTenantResetMutation,
		reconcileCustomerBannerMutation,
		saveTenantFeaturesMutation,
		generateSyntheticPerformanceMutation,
		injectSnapshotDataFileMutation,
		grantForwardOrgShareMutation,
		revokeForwardOrgShareMutation,
		managedTenantKeys: MANAGED_TENANT_KEYS,
	};
}
