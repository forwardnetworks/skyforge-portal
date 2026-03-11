import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	deleteUserAWSStaticCredentials,
	getAwsSsoConfig,
	getAwsSsoStatus,
	getUserAWSSSOCredentials,
	getUserAWSStaticCredentials,
	logoutAwsSso,
	pollAwsSso,
	putUserAWSSSOCredentials,
	putUserAWSStaticCredentials,
	startAwsSso,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useUserSettingsAwsCredentials() {
	const queryClient = useQueryClient();

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

	const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
	const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
	const [awsSsoStartUrl, setAwsSsoStartUrl] = useState("");
	const [awsSsoRegion, setAwsSsoRegion] = useState("");
	const [awsSsoSession, setAwsSsoSession] = useState<{
		requestId: string;
		verificationUriComplete: string;
		userCode: string;
		expiresAt: string;
		intervalSeconds: number;
	} | null>(null);
	const [awsSsoPollStatus, setAwsSsoPollStatus] = useState<string>("");

	useEffect(() => {
		const configuredStartUrl =
			userAwsSsoQ.data?.startUrl ?? awsSsoConfigQ.data?.startUrl ?? "";
		const configuredRegion =
			userAwsSsoQ.data?.region ?? awsSsoConfigQ.data?.region ?? "";

		if (!awsSsoStartUrl && configuredStartUrl) {
			setAwsSsoStartUrl(configuredStartUrl);
		}
		if (!awsSsoRegion && configuredRegion) {
			setAwsSsoRegion(configuredRegion);
		}
	}, [
		userAwsSsoQ.data?.startUrl,
		userAwsSsoQ.data?.region,
		awsSsoConfigQ.data?.startUrl,
		awsSsoConfigQ.data?.region,
		awsSsoStartUrl,
		awsSsoRegion,
	]);

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

	const saveAwsSsoConfigM = useMutation({
		mutationFn: async () =>
			putUserAWSSSOCredentials({
				startUrl: awsSsoStartUrl.trim(),
				region: awsSsoRegion.trim(),
				accountId: (
					userAwsSsoQ.data?.accountId ??
					awsSsoConfigQ.data?.accountId ??
					""
				).trim(),
				roleName: (
					userAwsSsoQ.data?.roleName ??
					awsSsoConfigQ.data?.roleName ??
					""
				).trim(),
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAwsSsoCredentials(),
			});
			toast.success("AWS SSO settings saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save AWS SSO settings", {
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
		if (!awsSsoSession?.requestId) return;

		let cancelled = false;
		let timeout: ReturnType<typeof setTimeout> | null = null;

		const pollOnce = async () => {
			try {
				const resp = await pollAwsSso({ requestId: awsSsoSession.requestId });
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

	return {
		awsStaticQ,
		awsSsoConfigQ,
		awsSsoStatusQ,
		userAwsSsoQ,
		awsAccessKeyId,
		setAwsAccessKeyId,
		awsSecretAccessKey,
		setAwsSecretAccessKey,
		awsSsoStartUrl,
		setAwsSsoStartUrl,
		awsSsoRegion,
		setAwsSsoRegion,
		awsSsoSession,
		awsSsoPollStatus,
		saveAwsStaticM,
		deleteAwsStaticM,
		saveAwsSsoConfigM,
		startAwsSsoM,
		logoutAwsSsoM,
	};
}
