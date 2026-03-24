import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	cancelUserServiceNowSetup,
	configureForwardServiceNowTicketing,
	getUserServiceNowConfig,
	getUserServiceNowPdiStatus,
	getUserServiceNowSchemaStatus,
	getUserServiceNowSetupStatus,
	installUserServiceNowDemo,
	putUserServiceNowConfig,
	rotateUserServiceNowTenant,
	startUserServiceNowSetup,
	wakeUserServiceNowPdi,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useServiceNowPage() {
	const qc = useQueryClient();
	const cfgKey = queryKeys.userServiceNowConfig();
	const setupKey = queryKeys.userServiceNowSetupStatus();
	const pdiKey = queryKeys.userServiceNowPdiStatus();
	const schemaKey = queryKeys.userServiceNowSchemaStatus();

	const cfgQ = useQuery({
		queryKey: cfgKey,
		queryFn: getUserServiceNowConfig,
		retry: false,
	});
	const cfg = cfgQ.data;

	const setupQ = useQuery({
		queryKey: setupKey,
		queryFn: getUserServiceNowSetupStatus,
		retry: false,
		refetchInterval: (query) =>
			query.state.data?.status === "running" ? 4_000 : 30_000,
	});

	const [instanceUrl, setInstanceUrl] = useState("");

	useEffect(() => {
		if (!cfg) return;
		setInstanceUrl(cfg.instanceUrl ?? "");
	}, [cfg]);

	const pdiQ = useQuery({
		queryKey: pdiKey,
		queryFn: getUserServiceNowPdiStatus,
		enabled: Boolean(cfg?.globalConfigured),
		retry: false,
	});

	const schemaQ = useQuery({
		queryKey: schemaKey,
		queryFn: getUserServiceNowSchemaStatus,
		enabled: Boolean(cfg?.globalConfigured),
		retry: false,
	});

	const saveMutation = useMutation({
		mutationFn: async () => putUserServiceNowConfig({}),
		onSuccess: async () => {
			toast.success("Saved ServiceNow tenant binding");
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: setupKey });
			await qc.invalidateQueries({ queryKey: pdiKey });
			await qc.invalidateQueries({ queryKey: schemaKey });
		},
		onError: (e) =>
			toast.error("Failed to save ServiceNow tenant binding", {
				description: (e as Error).message,
			}),
	});

	const rotateTenantMutation = useMutation({
		mutationFn: async () => rotateUserServiceNowTenant(),
		onSuccess: async () => {
			toast.success("Rotated ServiceNow tenant credentials");
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: setupKey });
			await qc.invalidateQueries({ queryKey: pdiKey });
			await qc.invalidateQueries({ queryKey: schemaKey });
		},
		onError: (e) =>
			toast.error("Failed to rotate tenant credentials", {
				description: (e as Error).message,
			}),
	});

	const setupMutation = useMutation({
		mutationFn: async (resume: boolean) => startUserServiceNowSetup({ resume }),
		onSuccess: async (resp) => {
			if (resp.status === "completed") {
				toast.success("ServiceNow setup completed");
			} else if (resp.status === "needs_manual_step") {
				toast.warning("ServiceNow setup needs manual remediation");
			} else if (resp.status === "running") {
				toast.success("ServiceNow setup started");
			}
			await qc.invalidateQueries({ queryKey: setupKey });
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: schemaKey });
		},
		onError: (e) =>
			toast.error("Failed to run setup", { description: (e as Error).message }),
	});

	const cancelSetupMutation = useMutation({
		mutationFn: async () => cancelUserServiceNowSetup(),
		onSuccess: async (resp) => {
			if (resp.canceled) {
				toast.success("Setup canceled");
			}
			await qc.invalidateQueries({ queryKey: setupKey });
		},
		onError: (e) =>
			toast.error("Failed to cancel setup", {
				description: (e as Error).message,
			}),
	});

	const wakeMutation = useMutation({
		mutationFn: async () => wakeUserServiceNowPdi(),
		onSuccess: async () => {
			toast.success("Wake requested");
			await qc.invalidateQueries({ queryKey: pdiKey });
		},
		onError: (e) =>
			toast.error("Failed to wake PDI", { description: (e as Error).message }),
	});

	const installMutation = useMutation({
		mutationFn: async () => installUserServiceNowDemo(),
		onSuccess: async (resp) => {
			if (resp.installed) {
				toast.success("Demo app installed");
			} else {
				toast.error("Install failed", { description: resp.message });
			}
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: schemaKey });
		},
		onError: (e) =>
			toast.error("Failed to install demo app", {
				description: (e as Error).message,
			}),
	});

	const configureMutation = useMutation({
		mutationFn: async () => configureForwardServiceNowTicketing(),
		onSuccess: (resp) => {
			if (resp.configured) {
				toast.success("Forward ticketing configured");
			} else {
				toast.error("Failed to configure Forward", {
					description: resp.message,
				});
			}
		},
		onError: (e) =>
			toast.error("Failed to configure Forward", {
				description: (e as Error).message,
			}),
	});

	const setupStatus = setupQ.data?.status ?? "idle";
	const canResume = setupStatus === "needs_manual_step";
	const isRunning = setupStatus === "running";

	return {
		cfg,
		cfgQ,
		setupQ,
		pdiQ,
		schemaQ,
		instanceUrl,
		setInstanceUrl,
		saveMutation,
		rotateTenantMutation,
		setupMutation,
		cancelSetupMutation,
		wakeMutation,
		installMutation,
		configureMutation,
		setupStatus,
		canResume,
		isRunning,
	};
}

export type ServiceNowPageData = ReturnType<typeof useServiceNowPage>;
