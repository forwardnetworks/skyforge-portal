import { useQuickDeployDeployMutation } from "@/hooks/use-quick-deploy-page-mutations";
import { useQuickDeployPageQueries } from "@/hooks/use-quick-deploy-page-queries";
import { useQuickDeployTemplateSelection } from "@/hooks/use-quick-deploy-page-template-selection";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export { formatQuickDeployEstimate } from "@/hooks/use-quick-deploy-page-estimate";

export function useQuickDeployPage(args?: { mode?: string }) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewTemplate, setPreviewTemplate] = useState("");
	const [previewSource, setPreviewSource] = useState<"blueprints" | "custom">(
		"blueprints",
	);
	const [previewRepo, setPreviewRepo] = useState("");
	const [previewDir, setPreviewDir] = useState("");
	const [leaseHours, setLeaseHours] = useState("24");

	const {
		catalogQ,
		lifetimePolicyQ,
		sessionQ,
		userScopesQ,
		availabilityQ,
		previewUserScopeId,
		previewQ,
	} = useQuickDeployPageQueries({
		previewOpen,
		previewTemplate,
		previewSource,
		previewRepo,
		previewDir,
	});

	const requestedMode = String(args?.mode ?? "")
		.trim()
		.toLowerCase();
	const primaryOperatingMode = String(
		availabilityQ.data?.policy?.primaryOperatingMode ?? "",
	)
		.trim()
		.toLowerCase();
	const allTemplates = catalogQ.data?.templates ?? [];

	const {
		templates,
		recommendedTemplates,
		leaseOptions,
		loadError,
		selectedTags,
		toggleSelectedTag,
		clearSelectedTags,
		availableTags,
	} = useQuickDeployTemplateSelection({
		requestedMode,
		primaryOperatingMode,
		allTemplates,
		lifetimeAllowedHours: lifetimePolicyQ.data?.allowedHours,
		catalogLeaseOptions: catalogQ.data?.leaseOptions,
		catalogError: catalogQ.error,
	});

	const deployMutation = useQuickDeployDeployMutation({
		queryClient,
		navigate,
		leaseHours,
	});

	useEffect(() => {
		const fallback = String(
			lifetimePolicyQ.data?.defaultHours ??
				catalogQ.data?.defaultLeaseHours ??
				24,
		);
		setLeaseHours((current) => current || fallback);
	}, [catalogQ.data?.defaultLeaseHours, lifetimePolicyQ.data?.defaultHours]);

	return {
		catalogQ,
		lifetimePolicyQ,
		previewOpen,
		setPreviewOpen,
		previewTemplate,
		setPreviewTemplate,
		previewSource,
		setPreviewSource,
		previewRepo,
		setPreviewRepo,
		previewDir,
		setPreviewDir,
		leaseHours,
		setLeaseHours,
		deployMutation,
		templates,
		allTemplates,
		recommendedTemplates,
		selectedTags,
		toggleSelectedTag,
		clearSelectedTags,
		availableTags,
		primaryOperatingMode,
		availabilityQ,
		sessionQ,
		userScopesQ,
		leaseOptions,
		loadError,
		previewUserScopeId,
		previewQ,
	};
}
