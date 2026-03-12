import { useEffect, useMemo, useState } from "react";
import type { QuickDeployTemplate } from "@/lib/api-client";

const FALLBACK_LEASE_OPTIONS = [4, 8, 24, 72];

export function useQuickDeployTemplateSelection(args: {
	requestedMode: string;
	primaryOperatingMode: string;
	allTemplates: QuickDeployTemplate[];
	lifetimeAllowedHours: number[] | undefined;
	catalogLeaseOptions: number[] | undefined;
	catalogError: unknown;
}) {
	const {
		requestedMode,
		primaryOperatingMode,
		allTemplates,
		lifetimeAllowedHours,
		catalogLeaseOptions,
		catalogError,
	} = args;

	const [selectedMode, setSelectedMode] = useState("curated-demo");
	useEffect(() => {
		setSelectedMode(requestedMode || primaryOperatingMode || "curated-demo");
	}, [requestedMode, primaryOperatingMode]);

	const templates = useMemo(() => {
		return allTemplates.filter((entry) => {
			const modes = (entry.operatingModes ?? []).map((mode) =>
				String(mode).trim().toLowerCase(),
			);
			if (selectedMode === "all" || modes.length === 0) {
				return true;
			}
			return modes.includes(selectedMode);
		});
	}, [allTemplates, selectedMode]);

	const recommendedTemplates = useMemo(() => {
		return allTemplates.filter((entry) => {
			const modes = (entry.operatingModes ?? []).map((mode) =>
				String(mode).trim().toLowerCase(),
			);
			return modes.includes(primaryOperatingMode || "curated-demo");
		});
	}, [allTemplates, primaryOperatingMode]);

	const leaseOptions = useMemo(() => {
		return lifetimeAllowedHours && lifetimeAllowedHours.length > 0
			? lifetimeAllowedHours
			: catalogLeaseOptions && catalogLeaseOptions.length > 0
				? catalogLeaseOptions
				: FALLBACK_LEASE_OPTIONS;
	}, [lifetimeAllowedHours, catalogLeaseOptions]);

	const loadError =
		catalogError instanceof Error
			? catalogError.message
			: catalogError
				? String(catalogError)
				: "";

	return {
		selectedMode,
		setSelectedMode,
		templates,
		recommendedTemplates,
		leaseOptions,
		loadError,
	};
}
