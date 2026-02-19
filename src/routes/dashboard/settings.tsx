import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { UserVariableGroups } from "../../components/user-variable-groups";
import { queryKeys } from "../../lib/query-keys";
import {
	deleteUserAWSSSOCredentials,
	deleteUserAWSStaticCredentials,
	deleteUserAzureCredentials,
	deleteUserContainerlabServer,
	deleteUserEveServer,
	deleteUserForwardCredentialProfile,
	deleteUserGCPCredentials,
	deleteUserIBMCredentials,
	deleteUserNetlabServer,
	getAwsSsoConfig,
	getAwsSsoStatus,
	getUserAWSSSOCredentials,
	getUserAWSStaticCredentials,
	getUserAzureCredentials,
	getUserGCPCredentials,
	getUserIBMCredentials,
	listUserContainerlabServers,
	listUserEveServers,
	listUserForwardCollectorConfigs,
	listUserForwardCredentialProfiles,
	listUserNetlabServers,
	logoutAwsSso,
	pollAwsSso,
	putUserAWSSSOCredentials,
	putUserAWSStaticCredentials,
	putUserAzureCredentials,
	putUserGCPCredentials,
	putUserIBMCredentials,
	startAwsSso,
	upsertUserContainerlabServer,
	upsertUserEveServer,
	upsertUserForwardCredentialProfile,
	upsertUserNetlabServer,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/settings")({
	component: UserSettingsPage,
});

const DEFAULT_AWS_SSO_START_URL = "https://d-9067d98db1.awsapps.com/start/#";

function UserSettingsPage() {
	const queryClient = useQueryClient();

	const collectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 10_000,
	});
	const forwardProfilesKey = ["user", "forward", "credentialProfiles"] as const;
	const forwardProfilesQ = useQuery({
		queryKey: forwardProfilesKey,
		queryFn: listUserForwardCredentialProfiles,
		staleTime: 10_000,
		retry: false,
	});

	const collectors = collectorsQ.data?.collectors ?? [];

	const awsStaticQ = useQuery({
		queryKey: queryKeys.userAwsStaticCredentials(),
		queryFn: getUserAWSStaticCredentials,
		staleTime: 10_000,
		retry: false,
	});
	const awsSsoConfigQ = useQuery({
		queryKey: queryKeys.awsSsoConfig(),
		queryFn: getAwsSsoConfig,
		staleTime: 10_000,
		retry: false,
	});
	const awsSsoStatusQ = useQuery({
		queryKey: queryKeys.awsSsoStatus(),
		queryFn: getAwsSsoStatus,
		staleTime: 10_000,
		retry: false,
	});
	const userAwsSsoQ = useQuery({
		queryKey: queryKeys.userAwsSsoCredentials(),
		queryFn: getUserAWSSSOCredentials,
		staleTime: 10_000,
		retry: false,
	});
	const azureQ = useQuery({
		queryKey: queryKeys.userAzureCredentials(),
		queryFn: getUserAzureCredentials,
		staleTime: 10_000,
		retry: false,
	});
	const gcpQ = useQuery({
		queryKey: queryKeys.userGcpCredentials(),
		queryFn: getUserGCPCredentials,
		staleTime: 10_000,
		retry: false,
	});
	const ibmQ = useQuery({
		queryKey: queryKeys.userIbmCredentials(),
		queryFn: getUserIBMCredentials,
		staleTime: 10_000,
		retry: false,
	});

	const userNetlabServersQ = useQuery({
		queryKey: queryKeys.userNetlabServers(),
		queryFn: listUserNetlabServers,
		staleTime: 10_000,
		retry: false,
	});
	const userEveServersQ = useQuery({
		queryKey: queryKeys.userEveServers(),
		queryFn: listUserEveServers,
		staleTime: 10_000,
		retry: false,
	});
	const userContainerlabServersQ = useQuery({
		queryKey: queryKeys.userContainerlabServers(),
		queryFn: listUserContainerlabServers,
		staleTime: 10_000,
		retry: false,
	});

	const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
	const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
	const [awsSsoStartUrl, setAwsSsoStartUrl] = useState("");
	const [awsSsoRegion, setAwsSsoRegion] = useState("");

	const [azureTenantId, setAzureTenantId] = useState("");
	const [azureClientId, setAzureClientId] = useState("");
	const [azureClientSecret, setAzureClientSecret] = useState("");
	const [azureSubscriptionId, setAzureSubscriptionId] = useState("");

	const [gcpProjectId, setGcpProjectId] = useState("");
	const [gcpServiceAccountJson, setGcpServiceAccountJson] = useState("");

	const [ibmApiKey, setIbmApiKey] = useState("");
	const [forwardProfileHost, setForwardProfileHost] = useState("");
	const [forwardProfileVerifyTLS, setForwardProfileVerifyTLS] = useState(true);
	const [forwardProfileUsername, setForwardProfileUsername] = useState("");
	const [forwardProfilePassword, setForwardProfilePassword] = useState("");
	const [ibmRegion, setIbmRegion] = useState("");
	const [ibmResourceGroupId, setIbmResourceGroupId] = useState("");

	const [newNetlabUrl, setNewNetlabUrl] = useState("");
	const [newNetlabInsecure, setNewNetlabInsecure] = useState(true);
	const [newNetlabUser, setNewNetlabUser] = useState("");
	const [newNetlabPassword, setNewNetlabPassword] = useState("");

	const [newContainerlabUrl, setNewContainerlabUrl] = useState("");
	const [newContainerlabInsecure, setNewContainerlabInsecure] = useState(true);
	const [newContainerlabUser, setNewContainerlabUser] = useState("");
	const [newContainerlabPassword, setNewContainerlabPassword] = useState("");

	const [newEveApiUrl, setNewEveApiUrl] = useState("");
	const [newEveWebUrl, setNewEveWebUrl] = useState("");
	const [newEveSkipTlsVerify, setNewEveSkipTlsVerify] = useState(true);
	const [newEveApiUser, setNewEveApiUser] = useState("");
	const [newEveApiPassword, setNewEveApiPassword] = useState("");

	const nameFromURL = (value: string) => {
		try {
			return new URL(value).hostname || value;
		} catch {
			return value;
		}
	};

	const forwardHostLabel = (value: string) => {
		const raw = value.trim() || "https://fwd.app";
		const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
		try {
			return new URL(withScheme).host || "fwd.app";
		} catch {
			return raw.replace(/^https?:\/\//i, "").split("/")[0] || "fwd.app";
		}
	};

	const saveAwsStaticM = useMutation({
		mutationFn: async () =>
			putUserAWSStaticCredentials({
				accessKeyId: awsAccessKeyId.trim(),
				secretAccessKey: awsSecretAccessKey,
			}),
		onSuccess: async () => {
			setAwsSecretAccessKey("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAwsStaticCredentials(),
			});
			toast.success("AWS static credentials saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save AWS static credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteAwsStaticM = useMutation({
		mutationFn: async () => deleteUserAWSStaticCredentials(),
		onSuccess: async () => {
			setAwsAccessKeyId("");
			setAwsSecretAccessKey("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAwsStaticCredentials(),
			});
			toast.success("AWS static credentials deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete AWS static credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const [awsSsoSession, setAwsSsoSession] = useState<{
		requestId: string;
		verificationUriComplete: string;
		userCode: string;
		expiresAt: string;
		intervalSeconds: number;
	} | null>(null);
	const [awsSsoPollStatus, setAwsSsoPollStatus] = useState<string>("");
	const awsSsoConfigured = Boolean(
		awsSsoStartUrl.trim() && awsSsoRegion.trim(),
	);

	useEffect(() => {
		const userStart = (userAwsSsoQ.data?.startUrl ?? "").trim();
		const userRegion = (userAwsSsoQ.data?.region ?? "").trim();
		const defaultStart = (awsSsoConfigQ.data?.startUrl ?? "").trim();
		const defaultRegion = (awsSsoConfigQ.data?.region ?? "").trim();
		setAwsSsoStartUrl(userStart || defaultStart || DEFAULT_AWS_SSO_START_URL);
		setAwsSsoRegion(userRegion || defaultRegion);
	}, [
		userAwsSsoQ.data?.startUrl,
		userAwsSsoQ.data?.region,
		awsSsoConfigQ.data?.startUrl,
		awsSsoConfigQ.data?.region,
	]);

	const saveAwsSsoConfigM = useMutation({
		mutationFn: async () => {
			const ssoAccountId = (
				userAwsSsoQ.data?.accountId ??
				awsSsoConfigQ.data?.accountId ??
				""
			).trim();
			const roleName = (
				userAwsSsoQ.data?.roleName ??
				awsSsoConfigQ.data?.roleName ??
				""
			).trim();
			return putUserAWSSSOCredentials({
				startUrl: awsSsoStartUrl.trim(),
				region: awsSsoRegion.trim(),
				accountId: ssoAccountId,
				roleName,
			});
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAwsSsoCredentials(),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.awsSsoConfig(),
			});
			toast.success("AWS SSO settings saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save AWS SSO settings", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteAwsSsoConfigM = useMutation({
		mutationFn: async () => deleteUserAWSSSOCredentials(),
		onSuccess: async () => {
			setAwsSsoStartUrl(
				(awsSsoConfigQ.data?.startUrl ?? "").trim() ||
					DEFAULT_AWS_SSO_START_URL,
			);
			setAwsSsoRegion((awsSsoConfigQ.data?.region ?? "").trim());
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAwsSsoCredentials(),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.awsSsoConfig(),
			});
			toast.success("AWS SSO settings reset");
		},
		onError: (err: unknown) =>
			toast.error("Failed to reset AWS SSO settings", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const startAwsSsoM = useMutation({
		mutationFn: startAwsSso,
		onSuccess: (resp) => {
			setAwsSsoSession(resp);
			setAwsSsoPollStatus("pending");
			window.open(
				resp.verificationUriComplete,
				"_blank",
				"noopener,noreferrer",
			);
		},
		onError: (err: unknown) =>
			toast.error("Failed to start AWS SSO", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const logoutAwsSsoM = useMutation({
		mutationFn: logoutAwsSso,
		onSuccess: async () => {
			setAwsSsoSession(null);
			setAwsSsoPollStatus("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.awsSsoStatus(),
			});
			toast.success("AWS SSO disconnected");
		},
		onError: (err: unknown) =>
			toast.error("Failed to disconnect AWS SSO", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	useEffect(() => {
		if (!awsSsoSession || !awsSsoSession.requestId) return;
		let cancelled = false;
		let timeout: ReturnType<typeof setTimeout> | null = null;

		const pollOnce = async () => {
			try {
				const resp = await pollAwsSso({
					requestId: awsSsoSession.requestId,
				});
				if (cancelled) return;
				setAwsSsoPollStatus(resp.status);
				if (resp.status === "ok") {
					setAwsSsoSession(null);
					await queryClient.invalidateQueries({
						queryKey: queryKeys.awsSsoStatus(),
					});
					toast.success("AWS SSO connected");
					return;
				}
				if (resp.status === "pending") {
					timeout = setTimeout(
						pollOnce,
						Math.max(1, awsSsoSession.intervalSeconds) * 1000,
					);
					return;
				}
				setAwsSsoSession(null);
				toast.error("AWS SSO authorization did not complete", {
					description: resp.status,
				});
			} catch (err) {
				if (cancelled) return;
				setAwsSsoSession(null);
				toast.error("AWS SSO polling failed", {
					description: err instanceof Error ? err.message : String(err),
				});
			}
		};

		timeout = setTimeout(
			pollOnce,
			Math.max(1, awsSsoSession.intervalSeconds) * 1000,
		);

		return () => {
			cancelled = true;
			if (timeout) clearTimeout(timeout);
		};
	}, [awsSsoSession, queryClient]);

	const saveAzureM = useMutation({
		mutationFn: async () =>
			putUserAzureCredentials({
				tenantId: azureTenantId.trim(),
				clientId: azureClientId.trim(),
				clientSecret: azureClientSecret,
				subscriptionId: azureSubscriptionId.trim() || undefined,
			}),
		onSuccess: async () => {
			setAzureClientSecret("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAzureCredentials(),
			});
			toast.success("Azure credentials saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save Azure credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteAzureM = useMutation({
		mutationFn: async () => deleteUserAzureCredentials(),
		onSuccess: async () => {
			setAzureTenantId("");
			setAzureClientId("");
			setAzureClientSecret("");
			setAzureSubscriptionId("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAzureCredentials(),
			});
			toast.success("Azure credentials deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete Azure credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveGcpM = useMutation({
		mutationFn: async () =>
			putUserGCPCredentials({
				projectIdOverride: gcpProjectId.trim() || undefined,
				serviceAccountJSON: gcpServiceAccountJson,
			}),
		onSuccess: async () => {
			setGcpServiceAccountJson("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userGcpCredentials(),
			});
			toast.success("GCP credentials saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save GCP credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteGcpM = useMutation({
		mutationFn: async () => deleteUserGCPCredentials(),
		onSuccess: async () => {
			setGcpProjectId("");
			setGcpServiceAccountJson("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userGcpCredentials(),
			});
			toast.success("GCP credentials deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete GCP credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveIbmM = useMutation({
		mutationFn: async () =>
			putUserIBMCredentials({
				apiKey: ibmApiKey,
				region: ibmRegion.trim(),
				resourceGroupId: ibmResourceGroupId.trim() || undefined,
			}),
		onSuccess: async () => {
			setIbmApiKey("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userIbmCredentials(),
			});
			toast.success("IBM Cloud credentials saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save IBM Cloud credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveForwardProfileM = useMutation({
		mutationFn: async () => {
			const username = forwardProfileUsername.trim();
			const password = forwardProfilePassword.trim();
			const host = forwardProfileHost.trim();
			if (!username) throw new Error("Username is required");
			if (!password) throw new Error("Password is required");
			return upsertUserForwardCredentialProfile({
				baseUrl: host || "https://fwd.app",
				skipTlsVerify: !forwardProfileVerifyTLS,
				username,
				password,
			});
		},
		onSuccess: async () => {
			setForwardProfilePassword("");
			await queryClient.invalidateQueries({
				queryKey: forwardProfilesKey,
			});
			toast.success("Forward credential set saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save Forward credential set", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteForwardProfileM = useMutation({
		mutationFn: async (name: string) =>
			deleteUserForwardCredentialProfile(name),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: forwardProfilesKey,
			});
			toast.success("Forward credential set deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete Forward credential set", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteIbmM = useMutation({
		mutationFn: async () => deleteUserIBMCredentials(),
		onSuccess: async () => {
			setIbmApiKey("");
			setIbmRegion("");
			setIbmResourceGroupId("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userIbmCredentials(),
			});
			toast.success("IBM Cloud credentials deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete IBM Cloud credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveNetlabServerM = useMutation({
		mutationFn: async () =>
			upsertUserNetlabServer({
				name: nameFromURL(newNetlabUrl).trim(),
				apiUrl: newNetlabUrl.trim(),
				apiInsecure: newNetlabInsecure,
				apiUser: newNetlabUser.trim() || undefined,
				apiPassword: newNetlabPassword.trim() || undefined,
			}),
		onSuccess: async () => {
			setNewNetlabUrl("");
			setNewNetlabInsecure(true);
			setNewNetlabUser("");
			setNewNetlabPassword("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userNetlabServers(),
			});
			toast.success("Netlab server saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save Netlab server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteNetlabServerM = useMutation({
		mutationFn: async (id: string) => deleteUserNetlabServer(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userNetlabServers(),
			});
			toast.success("Netlab server deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete Netlab server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveContainerlabServerM = useMutation({
		mutationFn: async () =>
			upsertUserContainerlabServer({
				name: nameFromURL(newContainerlabUrl).trim(),
				apiUrl: newContainerlabUrl.trim(),
				apiInsecure: newContainerlabInsecure,
				apiUser: newContainerlabUser.trim() || undefined,
				apiPassword: newContainerlabPassword.trim() || undefined,
			}),
		onSuccess: async () => {
			setNewContainerlabUrl("");
			setNewContainerlabInsecure(true);
			setNewContainerlabUser("");
			setNewContainerlabPassword("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userContainerlabServers(),
			});
			toast.success("Containerlab server saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save Containerlab server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteContainerlabServerM = useMutation({
		mutationFn: async (id: string) => deleteUserContainerlabServer(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userContainerlabServers(),
			});
			toast.success("Containerlab server deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete Containerlab server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveEveServerM = useMutation({
		mutationFn: async () =>
			upsertUserEveServer({
				name: nameFromURL(newEveApiUrl).trim(),
				apiUrl: newEveApiUrl.trim(),
				webUrl: newEveWebUrl.trim() || undefined,
				skipTlsVerify: newEveSkipTlsVerify,
				apiUser: newEveApiUser.trim() || undefined,
				apiPassword: newEveApiPassword.trim() || undefined,
			}),
		onSuccess: async () => {
			setNewEveApiUrl("");
			setNewEveWebUrl("");
			setNewEveSkipTlsVerify(true);
			setNewEveApiUser("");
			setNewEveApiPassword("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userEveServers(),
			});
			toast.success("EVE-NG server saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save EVE-NG server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteEveServerM = useMutation({
		mutationFn: async (id: string) => deleteUserEveServer(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userEveServers(),
			});
			toast.success("EVE-NG server deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete EVE-NG server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return (
		<div className="mx-auto w-full max-w-4xl space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">My Settings</h1>
				<p className="text-sm text-muted-foreground">
					User-scoped credentials and integrations.
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Forward Credential Sets</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-3 rounded border p-4">
						<div className="text-xs text-muted-foreground">
							These credentials are reused by collectors and other Forward
							integrations.
						</div>
						<div className="text-xs font-mono text-muted-foreground">
							Identifier:{" "}
							{forwardProfileUsername.trim()
								? `${forwardProfileUsername.trim()}@${forwardHostLabel(
										forwardProfileHost,
									)}`
								: `<username>@${forwardHostLabel(forwardProfileHost)}`}
						</div>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-1">
								<Input
									value={forwardProfileHost}
									onChange={(e) => setForwardProfileHost(e.target.value)}
									placeholder="Host (optional, defaults to https://fwd.app)"
								/>
								<div className="text-xs text-muted-foreground">
									For Skyforge Forward Cluster use:{" "}
									<code>
										http://fwd-appserver.forward.svc.cluster.local:8080
									</code>
								</div>
							</div>
							<Input
								value={forwardProfileUsername}
								onChange={(e) => setForwardProfileUsername(e.target.value)}
								placeholder="Forward username"
							/>
							<Input
								type="password"
								value={forwardProfilePassword}
								onChange={(e) => setForwardProfilePassword(e.target.value)}
								placeholder="Forward password"
							/>
						</div>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={forwardProfileVerifyTLS}
								onChange={(e) => setForwardProfileVerifyTLS(e.target.checked)}
							/>
							Verify TLS certificate
						</label>
						<Button
							type="button"
							variant="outline"
							onClick={() => saveForwardProfileM.mutate()}
							disabled={saveForwardProfileM.isPending}
						>
							Save credential set
						</Button>

						{forwardProfilesQ.isLoading ? (
							<div className="text-sm text-muted-foreground">
								Loading credential sets...
							</div>
						) : null}
						{forwardProfilesQ.isError ? (
							<div className="text-sm text-destructive">
								Failed to load credential sets.
							</div>
						) : null}
						<div className="space-y-2">
							{(forwardProfilesQ.data?.profiles ?? []).map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between gap-3 rounded border p-2"
								>
									<div className="min-w-0 text-sm">
										<div className="font-medium truncate">{p.name}</div>
										<div className="truncate text-muted-foreground">
											{p.username} @ {p.baseUrl}
										</div>
									</div>
									<Button
										type="button"
										size="sm"
										variant="destructive"
										onClick={() => deleteForwardProfileM.mutate(p.name)}
										disabled={deleteForwardProfileM.isPending}
									>
										Delete
									</Button>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			<UserVariableGroups allowEdit={true} />

			<Card>
				<CardHeader>
					<CardTitle>Cloud Credentials</CardTitle>
				</CardHeader>
				<CardContent className="space-y-8">
					<div className="grid gap-6 md:grid-cols-2">
						<div className="rounded border p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium">AWS (static)</div>
								<div className="text-xs text-muted-foreground">
									{awsStaticQ.data?.configured
										? `Configured (…${awsStaticQ.data?.accessKeyLast4 ?? ""})`
										: "Not configured"}
								</div>
							</div>
							<Input
								placeholder="Access key id"
								value={awsAccessKeyId}
								onChange={(e) => setAwsAccessKeyId(e.target.value)}
							/>
							<Input
								placeholder="Secret access key"
								type="password"
								value={awsSecretAccessKey}
								onChange={(e) => setAwsSecretAccessKey(e.target.value)}
							/>
							<div className="flex gap-2">
								<Button
									type="button"
									onClick={() => saveAwsStaticM.mutate()}
									disabled={saveAwsStaticM.isPending}
								>
									Save
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => deleteAwsStaticM.mutate()}
									disabled={deleteAwsStaticM.isPending}
								>
									Delete
								</Button>
							</div>
						</div>

						<div className="rounded border p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium">AWS (SSO)</div>
								<div className="text-xs text-muted-foreground">
									{awsSsoConfigured
										? awsSsoStatusQ.data?.connected
											? "Connected"
											: "Not connected"
										: "Not configured"}
								</div>
							</div>
							<Input
								placeholder="SSO start URL"
								value={awsSsoStartUrl}
								onChange={(e) => setAwsSsoStartUrl(e.target.value)}
							/>
							<Input
								placeholder="Region"
								value={awsSsoRegion}
								onChange={(e) => setAwsSsoRegion(e.target.value)}
							/>
							{awsSsoStatusQ.data?.lastAuthenticatedAt ? (
								<div className="text-xs text-muted-foreground">
									Last authenticated:{" "}
									<span className="font-mono">
										{awsSsoStatusQ.data.lastAuthenticatedAt}
									</span>
								</div>
							) : null}
							{awsSsoStatusQ.data?.expiresAt ? (
								<div className="text-xs text-muted-foreground">
									Expires:{" "}
									<span className="font-mono">
										{awsSsoStatusQ.data.expiresAt}
									</span>
								</div>
							) : null}
							{awsSsoSession ? (
								<div className="rounded border bg-muted/30 p-3 text-xs space-y-1">
									<div className="font-medium">Complete sign-in</div>
									<div>
										Code:{" "}
										<span className="font-mono">{awsSsoSession.userCode}</span>
									</div>
									<div className="text-muted-foreground">
										Open:{" "}
										<span className="font-mono break-all">
											{awsSsoSession.verificationUriComplete}
										</span>
									</div>
									{awsSsoPollStatus ? (
										<div className="text-muted-foreground">
											Status: {awsSsoPollStatus}
										</div>
									) : null}
								</div>
							) : null}
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => saveAwsSsoConfigM.mutate()}
									disabled={saveAwsSsoConfigM.isPending}
								>
									Save
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => deleteAwsSsoConfigM.mutate()}
									disabled={deleteAwsSsoConfigM.isPending}
								>
									Reset
								</Button>
								<Button
									type="button"
									onClick={() => startAwsSsoM.mutate()}
									disabled={
										!awsSsoConfigured ||
										startAwsSsoM.isPending ||
										!!awsSsoSession
									}
								>
									Connect
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => logoutAwsSsoM.mutate()}
									disabled={
										!awsSsoStatusQ.data?.connected || logoutAwsSsoM.isPending
									}
								>
									Disconnect
								</Button>
							</div>
						</div>
					</div>

					<div className="grid gap-6 md:grid-cols-3">
						<div className="rounded border p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium">Azure</div>
								<div className="text-xs text-muted-foreground">
									{azureQ.data?.configured ? "Configured" : "Not configured"}
								</div>
							</div>
							<Input
								placeholder="Tenant ID"
								value={azureTenantId}
								onChange={(e) => setAzureTenantId(e.target.value)}
							/>
							<Input
								placeholder="Client ID"
								value={azureClientId}
								onChange={(e) => setAzureClientId(e.target.value)}
							/>
							<Input
								placeholder="Client secret"
								type="password"
								value={azureClientSecret}
								onChange={(e) => setAzureClientSecret(e.target.value)}
							/>
							<Input
								placeholder="Subscription ID (optional)"
								value={azureSubscriptionId}
								onChange={(e) => setAzureSubscriptionId(e.target.value)}
							/>
							<div className="flex gap-2">
								<Button
									type="button"
									onClick={() => saveAzureM.mutate()}
									disabled={saveAzureM.isPending}
								>
									Save
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => deleteAzureM.mutate()}
									disabled={deleteAzureM.isPending}
								>
									Delete
								</Button>
							</div>
						</div>

						<div className="rounded border p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium">GCP</div>
								<div className="text-xs text-muted-foreground">
									{gcpQ.data?.configured ? "Configured" : "Not configured"}
								</div>
							</div>
							<Input
								placeholder="Project ID"
								value={gcpProjectId}
								onChange={(e) => setGcpProjectId(e.target.value)}
							/>
							<Textarea
								placeholder="Service account JSON"
								className="min-h-[140px] font-mono text-xs"
								value={gcpServiceAccountJson}
								onChange={(e) => setGcpServiceAccountJson(e.target.value)}
							/>
							<div className="flex gap-2">
								<Button
									type="button"
									onClick={() => saveGcpM.mutate()}
									disabled={saveGcpM.isPending}
								>
									Save
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => deleteGcpM.mutate()}
									disabled={deleteGcpM.isPending}
								>
									Delete
								</Button>
							</div>
						</div>

						<div className="rounded border p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium">IBM Cloud</div>
								<div className="text-xs text-muted-foreground">
									{ibmQ.data?.configured ? "Configured" : "Not configured"}
								</div>
							</div>
							<Input
								placeholder="Region"
								value={ibmRegion}
								onChange={(e) => setIbmRegion(e.target.value)}
							/>
							<Input
								placeholder="API key"
								type="password"
								value={ibmApiKey}
								onChange={(e) => setIbmApiKey(e.target.value)}
							/>
							<Input
								placeholder="Resource group ID (optional)"
								value={ibmResourceGroupId}
								onChange={(e) => setIbmResourceGroupId(e.target.value)}
							/>
							<div className="flex gap-2">
								<Button
									type="button"
									onClick={() => saveIbmM.mutate()}
									disabled={saveIbmM.isPending}
								>
									Save
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => deleteIbmM.mutate()}
									disabled={deleteIbmM.isPending}
								>
									Delete
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>BYOL Servers</CardTitle>
				</CardHeader>
				<CardContent className="space-y-8">
					<div className="space-y-4">
						<div className="text-sm font-medium">Netlab</div>
						<div className="grid gap-2 md:grid-cols-2">
							<Input
								placeholder="https://netlab.example.com"
								value={newNetlabUrl}
								onChange={(e) => setNewNetlabUrl(e.target.value)}
							/>
							<Input
								placeholder="API username (optional)"
								value={newNetlabUser}
								onChange={(e) => setNewNetlabUser(e.target.value)}
							/>
							<Input
								placeholder="API password (optional)"
								type="password"
								value={newNetlabPassword}
								onChange={(e) => setNewNetlabPassword(e.target.value)}
							/>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={newNetlabInsecure}
									onChange={(e) => setNewNetlabInsecure(e.target.checked)}
								/>
								<div className="text-sm">Skip TLS verify</div>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => saveNetlabServerM.mutate()}
							disabled={!newNetlabUrl.trim() || saveNetlabServerM.isPending}
						>
							Add/Update
						</Button>
						<div className="space-y-2">
							{(userNetlabServersQ.data?.servers ?? []).map((s) => (
								<div
									key={s.id}
									className="flex items-center justify-between rounded border px-3 py-2"
								>
									<div className="min-w-0">
										<div className="truncate text-sm font-medium">{s.name}</div>
										<div className="truncate text-xs text-muted-foreground font-mono">
											{s.apiUrl}
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => s.id && deleteNetlabServerM.mutate(s.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>

					<div className="space-y-4">
						<div className="text-sm font-medium">Containerlab</div>
						<div className="grid gap-2 md:grid-cols-2">
							<Input
								placeholder="https://clab.example.com"
								value={newContainerlabUrl}
								onChange={(e) => setNewContainerlabUrl(e.target.value)}
							/>
							<Input
								placeholder="API username (optional)"
								value={newContainerlabUser}
								onChange={(e) => setNewContainerlabUser(e.target.value)}
							/>
							<Input
								placeholder="API password (optional)"
								type="password"
								value={newContainerlabPassword}
								onChange={(e) => setNewContainerlabPassword(e.target.value)}
							/>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={newContainerlabInsecure}
									onChange={(e) => setNewContainerlabInsecure(e.target.checked)}
								/>
								<div className="text-sm">Skip TLS verify</div>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => saveContainerlabServerM.mutate()}
							disabled={
								!newContainerlabUrl.trim() || saveContainerlabServerM.isPending
							}
						>
							Add/Update
						</Button>
						<div className="space-y-2">
							{(userContainerlabServersQ.data?.servers ?? []).map((s) => (
								<div
									key={s.id}
									className="flex items-center justify-between rounded border px-3 py-2"
								>
									<div className="min-w-0">
										<div className="truncate text-sm font-medium">{s.name}</div>
										<div className="truncate text-xs text-muted-foreground font-mono">
											{s.apiUrl}
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() =>
											s.id && deleteContainerlabServerM.mutate(s.id)
										}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>

					<div className="space-y-4">
						<div className="text-sm font-medium">EVE-NG</div>
						<div className="grid gap-2 md:grid-cols-2">
							<Input
								placeholder="https://eve.example.com/api"
								value={newEveApiUrl}
								onChange={(e) => setNewEveApiUrl(e.target.value)}
							/>
							<Input
								placeholder="Web URL (optional)"
								value={newEveWebUrl}
								onChange={(e) => setNewEveWebUrl(e.target.value)}
							/>
							<Input
								placeholder="API username (optional)"
								value={newEveApiUser}
								onChange={(e) => setNewEveApiUser(e.target.value)}
							/>
							<Input
								placeholder="API password (optional)"
								type="password"
								value={newEveApiPassword}
								onChange={(e) => setNewEveApiPassword(e.target.value)}
							/>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={newEveSkipTlsVerify}
									onChange={(e) => setNewEveSkipTlsVerify(e.target.checked)}
								/>
								<div className="text-sm">Skip TLS verify</div>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => saveEveServerM.mutate()}
							disabled={!newEveApiUrl.trim() || saveEveServerM.isPending}
						>
							Add/Update
						</Button>
						<div className="space-y-2">
							{(userEveServersQ.data?.servers ?? []).map((s) => (
								<div
									key={s.id}
									className="flex items-center justify-between rounded border px-3 py-2"
								>
									<div className="min-w-0">
										<div className="truncate text-sm font-medium">{s.name}</div>
										<div className="truncate text-xs text-muted-foreground font-mono">
											{s.apiUrl}
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => s.id && deleteEveServerM.mutate(s.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
