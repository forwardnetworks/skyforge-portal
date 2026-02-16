import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { UserVariableGroups } from "../../components/user-variable-groups";
import {
	NETLAB_ENV_KEYS,
	isNetlabMultilineKey,
	netlabValuePresets,
} from "../../lib/netlab-env";
import { queryKeys } from "../../lib/query-keys";
import {
	createUserApiToken,
	createUserForwardCredentialSet,
	deleteUserAWSStaticCredentials,
	deleteUserAzureCredentials,
	deleteUserContainerlabServer,
	deleteUserEveServer,
	deleteUserForwardCredentialSet,
	deleteUserGCPCredentials,
	deleteUserIBMCredentials,
	deleteUserNetlabServer,
	getAwsSsoConfig,
	getAwsSsoStatus,
	getUserAWSStaticCredentials,
	getUserAzureCredentials,
	getUserGCPCredentials,
	getUserIBMCredentials,
	getUserServiceNowConfig,
	getUserSettings,
	listForwardNetworks,
	listUserApiTokens,
	listUserContainerlabServers,
	listUserEveServers,
	listUserForwardCollectorConfigs,
	listUserForwardCredentialSets,
	listUserNetlabServers,
	logoutAwsSso,
	pollAwsSso,
	putUserAWSStaticCredentials,
	putUserAzureCredentials,
	putUserGCPCredentials,
	putUserIBMCredentials,
	putUserSettings,
	revokeUserApiToken,
	startAwsSso,
	syncUserBlueprintCatalog,
	updateUserForwardCredentialSet,
	upsertUserContainerlabServer,
	upsertUserEveServer,
	upsertUserNetlabServer,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/settings")({
	component: UserSettingsPage,
});

const formSchema = z.object({
	defaultForwardCollectorConfigId: z.string().optional(),
	defaultForwardCredentialId: z.string().optional(),
	defaultForwardNetworkId: z.string().optional(),
	defaultEnv: z
		.array(z.object({ key: z.string().min(1), value: z.string() }))
		.optional(),
	externalTemplateRepos: z
		.array(
			z.object({
				id: z.string().optional(),
				name: z.string().optional(),
				repo: z.string().min(1),
				defaultBranch: z.string().optional(),
			}),
		)
		.optional(),
});

function UserSettingsPage() {
	const queryClient = useQueryClient();

	const collectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 10_000,
	});
	const forwardCredSetsQ = useQuery({
		queryKey: queryKeys.userForwardCredentialSets(),
		queryFn: listUserForwardCredentialSets,
		staleTime: 10_000,
		retry: false,
	});

	const settingsQ = useQuery({
		queryKey: queryKeys.userSettings(),
		queryFn: getUserSettings,
		staleTime: 10_000,
	});

	const collectors = collectorsQ.data?.collectors ?? [];
	const forwardCredentialSets = forwardCredSetsQ.data?.credentialSets ?? [];
	const defaultCollectorId = useMemo(() => {
		const explicit = settingsQ.data?.defaultForwardCollectorConfigId;
		if (explicit) return explicit;
		return (
			collectors.find((c) => c.name === "default")?.id ??
			collectors[0]?.id ??
			""
		);
	}, [collectors, settingsQ.data?.defaultForwardCollectorConfigId]);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		values: {
			defaultForwardCollectorConfigId: defaultCollectorId || undefined,
			defaultForwardCredentialId:
				settingsQ.data?.defaultForwardCredentialId || undefined,
			defaultForwardNetworkId:
				settingsQ.data?.defaultForwardNetworkId || undefined,
			defaultEnv: settingsQ.data?.defaultEnv ?? [],
			externalTemplateRepos: settingsQ.data?.externalTemplateRepos ?? [],
		},
	});

	const envArray = useFieldArray({ control: form.control, name: "defaultEnv" });
	const reposArray = useFieldArray({
		control: form.control,
		name: "externalTemplateRepos",
	});

	const mutation = useMutation({
		mutationFn: async (values: z.infer<typeof formSchema>) => {
			const externalTemplateRepos = (values.externalTemplateRepos ?? []).map(
				(r) => {
					const repo = r.repo.trim();
					const inferredName =
						repo
							.split("/")
							.filter(Boolean)
							.at(-1)
							?.replace(/\.git$/, "") ?? "repo";
					return {
						id: r.id ?? globalThis.crypto?.randomUUID?.() ?? inferredName,
						name: r.name?.trim() || inferredName,
						repo,
						defaultBranch: r.defaultBranch?.trim() || "main",
					};
				},
			);
			return putUserSettings({
				defaultForwardCollectorConfigId: values.defaultForwardCollectorConfigId,
				defaultForwardCredentialId: values.defaultForwardCredentialId,
				defaultForwardNetworkId: values.defaultForwardNetworkId,
				defaultEnv: values.defaultEnv ?? [],
				externalTemplateRepos,
			});
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userSettings(),
			});
			toast.success("Saved");
		},
		onError: (err: unknown) => {
			toast.error(
				err instanceof Error ? err.message : "Failed to save user settings",
			);
		},
	});
	const syncBlueprintsM = useMutation({
		mutationFn: syncUserBlueprintCatalog,
		onSuccess: () => {
			toast.success("Blueprints synced");
		},
		onError: (err: unknown) => {
			toast.error("Failed to sync blueprints", {
				description: err instanceof Error ? err.message : "request failed",
			});
		},
	});

	const busy =
		collectorsQ.isLoading || settingsQ.isLoading || mutation.isPending;

	const selectedForwardCredentialId = String(
		form.watch("defaultForwardCredentialId") ?? "",
	).trim();
	const selectedForwardCredentialSet = useMemo(() => {
		if (!selectedForwardCredentialId) return null;
		return (
			forwardCredentialSets.find(
				(cs: any) => String(cs?.id ?? "") === selectedForwardCredentialId,
			) ?? null
		);
	}, [forwardCredentialSets, selectedForwardCredentialId]);

	const [forwardBaseUrl, setForwardBaseUrl] = useState("https://fwd.app");
	const [forwardSkipTlsVerify, setForwardSkipTlsVerify] = useState(false);
	const [forwardUsername, setForwardUsername] = useState("");
	const [forwardPassword, setForwardPassword] = useState("");
	const [forwardTouched, setForwardTouched] = useState(false);

	useEffect(() => {
		if (forwardTouched) return;
		const cs: any = selectedForwardCredentialSet;
		if (!cs) return;
		const baseUrl = String(cs.baseUrl ?? "").trim() || "https://fwd.app";
		setForwardBaseUrl(baseUrl);
		setForwardSkipTlsVerify(Boolean(cs.skipTlsVerify));
		setForwardUsername(String(cs.username ?? "").trim());
	}, [selectedForwardCredentialSet, forwardTouched]);

	const forwardNetworksQ = useQuery({
		queryKey: ["forwardNetworks", selectedForwardCredentialId],
		queryFn: () =>
			listForwardNetworks({ credentialId: selectedForwardCredentialId }),
		enabled: Boolean(selectedForwardCredentialId),
		staleTime: 30_000,
		retry: false,
	});
	const forwardNetworks = useMemo(() => {
		return (forwardNetworksQ.data?.networks ?? [])
			.filter((n: any) => n && typeof n.id === "string" && n.id.trim())
			.map((n: any) => ({ id: String(n.id), name: String(n.name ?? "") }));
	}, [forwardNetworksQ.data?.networks]);

	const saveForwardAccountM = useMutation({
		mutationFn: async () => {
			const baseUrl = forwardBaseUrl.trim() || "https://fwd.app";
			const username = forwardUsername.trim();
			const password = forwardPassword;
			if (!username) throw new Error("Forward username is required");
			const name =
				String(selectedForwardCredentialSet?.name ?? "My Forward").trim() ||
				"My Forward";

			let credId = selectedForwardCredentialId;
			if (credId) {
				await updateUserForwardCredentialSet(credId, {
					name,
					baseUrl,
					skipTlsVerify: forwardSkipTlsVerify,
					username,
					...(password.trim() ? { password } : {}),
				} as any);
			} else {
				if (!password.trim()) throw new Error("Forward password is required");
				const created = await createUserForwardCredentialSet({
					name,
					baseUrl,
					skipTlsVerify: forwardSkipTlsVerify,
					username,
					password,
				} as any);
				credId = String((created as any)?.id ?? "").trim();
				if (!credId) throw new Error("Failed to create credential set");
				form.setValue("defaultForwardCredentialId", credId, {
					shouldDirty: true,
					shouldTouch: true,
					shouldValidate: true,
				});
			}

			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardCredentialSets(),
			});
			setForwardPassword("");
			setForwardTouched(false);

			// Persist defaultForwardCredentialId/defaultForwardNetworkId via user settings.
			return mutation.mutateAsync(form.getValues());
		},
		onSuccess: async () => {
			toast.success("Forward account saved");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userSettings(),
			});
			await queryClient.invalidateQueries({
				queryKey: ["forwardNetworks", selectedForwardCredentialId],
			});
		},
		onError: (err: any) =>
			toast.error("Failed to save Forward account", {
				description: String(err?.message ?? err),
			}),
	});

	const deleteForwardCredentialSetM = useMutation({
		mutationFn: async (id: string) => deleteUserForwardCredentialSet(id),
		onSuccess: async () => {
			// Clear selection and form defaults; user still needs to hit Save for settings.
			form.setValue("defaultForwardCredentialId", "", {
				shouldDirty: true,
				shouldTouch: true,
				shouldValidate: true,
			});
			form.setValue("defaultForwardNetworkId", "", {
				shouldDirty: true,
				shouldTouch: true,
				shouldValidate: true,
			});
			setForwardBaseUrl("https://fwd.app");
			setForwardSkipTlsVerify(false);
			setForwardUsername("");
			setForwardPassword("");
			setForwardTouched(false);
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardCredentialSets(),
			});
			toast.success("Forward credential set deleted");
		},
		onError: (err: any) =>
			toast.error("Failed to delete Forward credential set", {
				description: String(err?.message ?? err),
			}),
	});

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

	const serviceNowQ = useQuery({
		queryKey: queryKeys.userServiceNowConfig(),
		queryFn: getUserServiceNowConfig,
		staleTime: 10_000,
		retry: false,
	});

	const apiTokensQ = useQuery({
		queryKey: queryKeys.userApiTokens(),
		queryFn: listUserApiTokens,
		staleTime: 10_000,
		retry: false,
	});

	const [newApiTokenName, setNewApiTokenName] = useState("");
	const [createdApiTokenSecret, setCreatedApiTokenSecret] = useState<
		string | null
	>(null);
	const createApiTokenM = useMutation({
		mutationFn: async () =>
			createUserApiToken({ name: newApiTokenName.trim() || undefined }),
		onSuccess: async (res) => {
			setCreatedApiTokenSecret(res.secret ?? "");
			setNewApiTokenName("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userApiTokens(),
			});
			toast.success("API token created", {
				description: "Secret shown once. Copy it now.",
			});
		},
		onError: (err) => {
			toast.error("Failed to create API token", {
				description: err instanceof Error ? err.message : String(err),
			});
		},
	});
	const revokeApiTokenM = useMutation({
		mutationFn: async (id: string) => revokeUserApiToken(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userApiTokens(),
			});
			toast.success("API token revoked");
		},
		onError: (err) => {
			toast.error("Failed to revoke API token", {
				description: err instanceof Error ? err.message : String(err),
			});
		},
	});

	const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
	const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");

	const [azureTenantId, setAzureTenantId] = useState("");
	const [azureClientId, setAzureClientId] = useState("");
	const [azureClientSecret, setAzureClientSecret] = useState("");
	const [azureSubscriptionId, setAzureSubscriptionId] = useState("");

	const [gcpProjectId, setGcpProjectId] = useState("");
	const [gcpServiceAccountJson, setGcpServiceAccountJson] = useState("");

	const [ibmApiKey, setIbmApiKey] = useState("");
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
				projectId: gcpProjectId.trim(),
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
					Defaults that pre-fill new deployments. These do not change existing
					deployments.
				</p>
			</div>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
					className="space-y-6"
				>
					<Card>
						<CardHeader>
							<CardTitle>Integrations</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<div className="text-sm font-medium">Forward collector</div>
									<div className="text-sm text-muted-foreground">
										{collectors.length
											? `${collectors.length} configured`
											: "None configured"}
									</div>
								</div>
								<Button asChild variant="outline">
									<Link to="/dashboard/fwd/collector">Open</Link>
								</Button>
							</div>
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<div className="text-sm font-medium">Forward credentials</div>
									<div className="text-sm text-muted-foreground">
										{forwardCredSetsQ.isLoading
											? "Loading…"
											: forwardCredentialSets.length
												? `${forwardCredentialSets.length} credential set(s)`
												: "None configured"}
									</div>
								</div>
								<Button asChild variant="outline">
									<Link to="/dashboard/settings" hash="forward-account">
										Manage
									</Link>
								</Button>
							</div>

							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<div className="text-sm font-medium">ServiceNow</div>
									<div className="text-sm text-muted-foreground">
										{serviceNowQ.data?.configured
											? "Configured"
											: "Not configured"}
									</div>
								</div>
								<Button asChild variant="outline">
									<Link to="/dashboard/servicenow">Open</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card id="forward-account">
						<CardHeader>
							<CardTitle>Forward account</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="text-sm text-muted-foreground">
								Configure Forward once here, then reuse it across Capacity,
								Assurance, and collectors. Network selection is used as a
								default for demos and views.
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between gap-3">
									<div className="text-sm font-medium">Credential set</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={
											!selectedForwardCredentialId ||
											deleteForwardCredentialSetM.isPending
										}
										onClick={() => {
											if (!selectedForwardCredentialId) return;
											const cs: any = selectedForwardCredentialSet;
											const name = String(
												cs?.name ?? selectedForwardCredentialId,
											);
											if (
												!confirm(
													`Delete Forward credential set "${name}"? This cannot be undone.`,
												)
											) {
												return;
											}
											deleteForwardCredentialSetM.mutate(
												selectedForwardCredentialId,
											);
										}}
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete
									</Button>
								</div>
								<Select
									value={selectedForwardCredentialId || "none"}
									onValueChange={(v) => {
										form.setValue(
											"defaultForwardCredentialId",
											v === "none" ? "" : v,
											{
												shouldDirty: true,
												shouldTouch: true,
												shouldValidate: true,
											},
										);
										setForwardPassword("");
										setForwardTouched(false);
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select or create" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Create new</SelectItem>
										{forwardCredentialSets.map((cs: any) => (
											<SelectItem key={String(cs.id)} value={String(cs.id)}>
												{String(cs.name ?? cs.id)}
												{cs.username ? ` (${cs.username})` : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{selectedForwardCredentialSet &&
								!(selectedForwardCredentialSet as any).hasPassword ? (
									<div className="text-xs text-destructive">
										Selected credential set has no stored password.
									</div>
								) : null}
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<div className="text-sm font-medium">Forward URL</div>
									<Input
										value={forwardBaseUrl}
										onChange={(e) => {
											setForwardTouched(true);
											setForwardBaseUrl(e.target.value);
										}}
										placeholder="https://fwd.app"
									/>
								</div>
								<div className="space-y-2">
									<div className="text-sm font-medium">Username</div>
									<Input
										value={forwardUsername}
										onChange={(e) => {
											setForwardTouched(true);
											setForwardUsername(e.target.value);
										}}
										placeholder="you@company.com"
									/>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<div className="text-sm font-medium">Password</div>
									<Input
										type="password"
										value={forwardPassword}
										onChange={(e) => {
											setForwardTouched(true);
											setForwardPassword(e.target.value);
										}}
										placeholder={
											selectedForwardCredentialId
												? "Leave blank to keep existing"
												: ""
										}
									/>
								</div>
								<div className="flex items-center gap-2 mt-6">
									<Checkbox
										checked={forwardSkipTlsVerify}
										onCheckedChange={(v) => {
											setForwardTouched(true);
											setForwardSkipTlsVerify(Boolean(v));
										}}
										id="forward-skip-tls-verify"
									/>
									<label
										htmlFor="forward-skip-tls-verify"
										className="text-sm leading-tight cursor-pointer"
									>
										Skip TLS verification
									</label>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between gap-3">
									<div className="text-sm font-medium">
										Default Forward network
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => void forwardNetworksQ.refetch()}
										disabled={
											!selectedForwardCredentialId ||
											forwardNetworksQ.isFetching
										}
									>
										{forwardNetworksQ.isFetching
											? "Refreshing…"
											: "Refresh list"}
									</Button>
								</div>
								<Select
									value={
										String(form.watch("defaultForwardNetworkId") ?? "") ||
										"none"
									}
									onValueChange={(v) =>
										form.setValue(
											"defaultForwardNetworkId",
											v === "none" ? "" : v,
											{
												shouldDirty: true,
												shouldTouch: true,
												shouldValidate: true,
											},
										)
									}
									disabled={!selectedForwardCredentialId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select a network" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None</SelectItem>
										{forwardNetworks.map((n) => (
											<SelectItem key={n.id} value={n.id}>
												{n.name ? `${n.name} (${n.id})` : n.id}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{forwardNetworksQ.isError ? (
									<div className="text-xs text-destructive">
										Failed to load networks:{" "}
										{(forwardNetworksQ.error as Error).message}
									</div>
								) : null}
							</div>

							<div className="flex items-center justify-end gap-2 pt-2">
								<Button
									type="button"
									onClick={() => saveForwardAccountM.mutate()}
									disabled={saveForwardAccountM.isPending || mutation.isPending}
								>
									{saveForwardAccountM.isPending
										? "Saving…"
										: "Save Forward account"}
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>API Tokens</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="text-muted-foreground">
								For MCP clients and scripts. Token secrets are shown once at
								creation time.
							</div>

							<div className="flex flex-col gap-2 md:flex-row md:items-center">
								<Input
									placeholder="Token name (optional)"
									value={newApiTokenName}
									onChange={(e) => setNewApiTokenName(e.target.value)}
								/>
								<Button
									onClick={() => createApiTokenM.mutate()}
									disabled={createApiTokenM.isPending}
								>
									{createApiTokenM.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Creating…
										</>
									) : (
										"Create token"
									)}
								</Button>
							</div>

							{createdApiTokenSecret ? (
								<div className="rounded-md border p-3">
									<div className="text-xs font-medium">New token secret</div>
									<div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
										<Input readOnly value={createdApiTokenSecret} />
										<Button
											variant="secondary"
											onClick={async () => {
												try {
													await navigator.clipboard.writeText(
														createdApiTokenSecret,
													);
													toast.success("Copied token secret");
												} catch (e) {
													toast.error("Copy failed", {
														description:
															e instanceof Error ? e.message : String(e),
													});
												}
											}}
										>
											Copy
										</Button>
										<Button
											variant="outline"
											onClick={() => setCreatedApiTokenSecret(null)}
										>
											Dismiss
										</Button>
									</div>
								</div>
							) : null}

							<div className="space-y-2">
								<div className="text-xs font-medium">Your tokens</div>
								{apiTokensQ.isLoading ? (
									<div className="text-xs text-muted-foreground">Loading…</div>
								) : apiTokensQ.isError ? (
									<div className="text-xs text-destructive">
										Failed to load API tokens.
									</div>
								) : (apiTokensQ.data?.tokens ?? []).length === 0 ? (
									<div className="text-xs text-muted-foreground">
										No tokens yet.
									</div>
								) : (
									<div className="divide-y rounded-md border">
										{(apiTokensQ.data?.tokens ?? []).map((t) => (
											<div
												key={t.id}
												className="flex items-center justify-between gap-3 px-3 py-2"
											>
												<div className="min-w-0">
													<div className="truncate text-sm font-medium">
														{t.name || "API token"}
													</div>
													<div className="text-xs text-muted-foreground">
														<span className="font-mono">{t.prefix}</span>
													</div>
												</div>
												<Button
													variant="outline"
													disabled={revokeApiTokenM.isPending}
													onClick={() => revokeApiTokenM.mutate(t.id)}
												>
													Revoke
												</Button>
											</div>
										))}
									</div>
								)}
							</div>

							<div className="text-xs text-muted-foreground">
								MCP endpoint: <span className="font-mono">/api/mcp/rpc</span> or{" "}
								<span className="font-mono">
									/api/mcp/forward/&lt;networkId&gt;/rpc
								</span>
								.
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Defaults</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<FormField
								control={form.control}
								name="defaultForwardCollectorConfigId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Default Forward collector</FormLabel>
										<Select
											value={field.value ?? ""}
											onValueChange={(v) => field.onChange(v)}
											disabled={collectors.length === 0}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={
														collectors.length
															? "Select collector"
															: "No collectors"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{collectors
													.slice()
													.sort((a, b) =>
														a.name === "default"
															? -1
															: b.name === "default"
																? 1
																: 0,
													)
													.map((c) => (
														<SelectItem key={c.id} value={c.id}>
															{c.name}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm font-medium">
											Default environment variables
										</div>
										<div className="text-sm text-muted-foreground">
											Used for Netlab/Clabernetes generator env overrides.
										</div>
									</div>
									<Button
										type="button"
										variant="outline"
										onClick={() =>
											envArray.append({ key: "NETLAB_DEVICE", value: "" })
										}
									>
										Add variable
									</Button>
								</div>

								{envArray.fields.length === 0 ? (
									<div className="rounded border p-4 text-sm text-muted-foreground">
										No default variables.
									</div>
								) : (
									<div className="space-y-3">
										{envArray.fields.map((f, idx) => {
											const keyPath = `defaultEnv.${idx}.key` as const;
											const valuePath = `defaultEnv.${idx}.value` as const;
											const key = form.watch(keyPath) || f.key;
											const presets = netlabValuePresets(key);
											const multiline = isNetlabMultilineKey(key);
											return (
												<div key={f.id} className="flex gap-2">
													<FormField
														control={form.control}
														name={keyPath}
														render={({ field }) => (
															<FormItem className="w-1/2">
																<FormLabel className="sr-only">Key</FormLabel>
																<Select
																	value={field.value}
																	onValueChange={(v) => field.onChange(v)}
																>
																	<SelectTrigger>
																		<SelectValue placeholder="Select key" />
																	</SelectTrigger>
																	<SelectContent>
																		{NETLAB_ENV_KEYS.map((k) => (
																			<SelectItem key={k.key} value={k.key}>
																				{k.label}
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
														name={valuePath}
														render={({ field }) => (
															<FormItem className="w-1/2">
																<FormLabel className="sr-only">Value</FormLabel>
																{presets ? (
																	<Select
																		value={field.value}
																		onValueChange={(v) => field.onChange(v)}
																	>
																		<SelectTrigger>
																			<SelectValue placeholder="Select value" />
																		</SelectTrigger>
																		<SelectContent>
																			{presets.map((p) => (
																				<SelectItem
																					key={p.value}
																					value={p.value}
																				>
																					{p.label}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																) : (
																	<Input
																		{...field}
																		placeholder={
																			multiline ? "Enter value" : "Value"
																		}
																	/>
																)}
																<FormMessage />
															</FormItem>
														)}
													/>

													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => envArray.remove(idx)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center justify-between gap-3">
								<CardTitle>External Template Repos</CardTitle>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => syncBlueprintsM.mutate()}
									disabled={syncBlueprintsM.isPending}
								>
									<RefreshCw
										className={`mr-2 h-4 w-4 ${syncBlueprintsM.isPending ? "animate-spin" : ""}`}
									/>
									Sync default blueprints
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between gap-4">
								<div className="text-sm text-muted-foreground">
									IDs referenced when selecting template source = External.
								</div>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										reposArray.append({
											name: "",
											repo: "",
											defaultBranch: "",
										})
									}
								>
									Add repo
								</Button>
							</div>

							{reposArray.fields.length === 0 ? (
								<div className="rounded border p-4 text-sm text-muted-foreground">
									No external repos configured.
								</div>
							) : (
								<div className="space-y-3">
									{reposArray.fields.map((f, idx) => {
										const idPath = `externalTemplateRepos.${idx}.id` as const;
										const namePath =
											`externalTemplateRepos.${idx}.name` as const;
										const repoPath =
											`externalTemplateRepos.${idx}.repo` as const;
										const branchPath =
											`externalTemplateRepos.${idx}.defaultBranch` as const;
										const currentId = form.watch(idPath) || f.id || "";
										return (
											<div key={f.id} className="grid gap-2 rounded border p-3">
												<div className="flex items-center justify-between gap-2">
													<div className="text-xs text-muted-foreground">
														ID:{" "}
														<span className="font-mono">
															{currentId || "(new)"}
														</span>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => reposArray.remove(idx)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>

												<FormField
													control={form.control}
													name={idPath}
													render={({ field }) => (
														<FormItem className="hidden">
															<FormLabel className="sr-only">ID</FormLabel>
															<Input {...field} />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={namePath}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Name (optional)</FormLabel>
															<Input {...field} placeholder="My repo" />
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={repoPath}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Repo</FormLabel>
															<Input
																{...field}
																placeholder="owner/repo or git URL"
															/>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={branchPath}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Default branch (optional)</FormLabel>
															<Input {...field} placeholder="main" />
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>

					<div className="flex items-center justify-end gap-2">
						<Button type="submit" disabled={busy || !form.formState.isDirty}>
							{mutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving…
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Save
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>

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
									{awsSsoConfigQ.data?.configured
										? awsSsoStatusQ.data?.connected
											? "Connected"
											: "Not connected"
										: "Not configured"}
								</div>
							</div>
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
									onClick={() => startAwsSsoM.mutate()}
									disabled={
										!awsSsoConfigQ.data?.configured ||
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
