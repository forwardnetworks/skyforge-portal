import type { QuickDeployTemplate } from "@/lib/api-client";
import { useEffect, useMemo, useState } from "react";

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
	const [selectedTag, setSelectedTag] = useState("all");
	useEffect(() => {
		setSelectedMode(requestedMode || primaryOperatingMode || "curated-demo");
	}, [requestedMode, primaryOperatingMode]);

	const availableTags = useMemo(() => {
		const tags = new Set<string>();
		for (const entry of allTemplates) {
			for (const tag of entry.tags ?? []) {
				const normalized = String(tag).trim().toLowerCase();
				if (normalized) tags.add(normalized);
			}
		}
		return Array.from(tags).sort((a, b) => a.localeCompare(b));
	}, [allTemplates]);

	useEffect(() => {
		if (selectedTag === "all") return;
		if (!availableTags.includes(selectedTag)) setSelectedTag("all");
	}, [availableTags, selectedTag]);

	const templates = useMemo(() => {
		return allTemplates.filter((entry) => {
			const modes = (entry.operatingModes ?? []).map((mode) =>
				String(mode).trim().toLowerCase(),
			);
			if (
				selectedMode !== "all" &&
				modes.length > 0 &&
				!modes.includes(selectedMode)
			) {
				return false;
			}
			if (selectedTag === "all") {
				return true;
			}
			const tags = (entry.tags ?? []).map((tag) =>
				String(tag).trim().toLowerCase(),
			);
			return tags.includes(selectedTag);
		});
	}, [allTemplates, selectedMode, selectedTag]);

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
		selectedTag,
		setSelectedTag,
		availableTags,
		templates,
		recommendedTemplates,
		leaseOptions,
		loadError,
	};
}
