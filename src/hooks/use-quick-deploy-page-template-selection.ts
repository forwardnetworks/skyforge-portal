import type { QuickDeployTemplate } from "@/lib/api-client";
import { useEffect, useMemo, useState } from "react";

const FALLBACK_LEASE_OPTIONS = [4, 8, 24, 72];

function sameStringList(left: string[], right: string[]): boolean {
	if (left.length !== right.length) return false;
	return left.every((value, index) => value === right[index]);
}

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

	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const taggedTemplates = useMemo(() => {
		return allTemplates.filter((entry) =>
			(entry.tags ?? []).some((tag) => String(tag).trim() !== ""),
		);
	}, [allTemplates]);

	useEffect(() => {
		const initial = requestedMode || primaryOperatingMode;
		if (!initial) {
			setSelectedTags((current) => (current.length === 0 ? current : []));
			return;
		}
		if (initial === "all") {
			setSelectedTags((current) => (current.length === 0 ? current : []));
			return;
		}
		const tag = initial === "curated-demo" ? "curated" : initial;
		setSelectedTags((current) =>
			sameStringList(current, [tag]) ? current : [tag],
		);
	}, [requestedMode, primaryOperatingMode]);

	const availableTags = useMemo(() => {
		const tags = new Set<string>();
		for (const entry of taggedTemplates) {
			for (const tag of entry.tags ?? []) {
				const normalized = String(tag).trim().toLowerCase();
				if (normalized) tags.add(normalized);
			}
		}
		return Array.from(tags).sort((a, b) => a.localeCompare(b));
	}, [taggedTemplates]);

	useEffect(() => {
		setSelectedTags((current) => {
			const filtered = current.filter((tag) => availableTags.includes(tag));
			return sameStringList(current, filtered) ? current : filtered;
		});
	}, [availableTags]);

	const toggleSelectedTag = (tag: string) => {
		const normalized = String(tag).trim().toLowerCase();
		if (!normalized) return;
		setSelectedTags((current) =>
			current.includes(normalized)
				? current.filter((item) => item !== normalized)
				: [...current, normalized].sort((a, b) => a.localeCompare(b)),
		);
	};

	const clearSelectedTags = () =>
		setSelectedTags((current) => (current.length === 0 ? current : []));

	const templates = useMemo(() => {
		if (selectedTags.length === 0) {
			return taggedTemplates;
		}
		return taggedTemplates.filter((entry) => {
			const tags = (entry.tags ?? []).map((tag) =>
				String(tag).trim().toLowerCase(),
			);
			return selectedTags.some((tag) => tags.includes(tag));
		});
	}, [taggedTemplates, selectedTags]);

	const recommendedTemplates = useMemo(() => {
		const recommendationTags =
			selectedTags.length > 0
				? selectedTags
				: [
						(primaryOperatingMode || "curated-demo") === "training"
							? "training"
							: "curated",
					];
		return taggedTemplates.filter((entry) => {
			const tags = (entry.tags ?? []).map((tag) =>
				String(tag).trim().toLowerCase(),
			);
			return recommendationTags.some((tag) => tags.includes(tag));
		});
	}, [primaryOperatingMode, selectedTags, taggedTemplates]);

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
		selectedTags,
		toggleSelectedTag,
		clearSelectedTags,
		availableTags,
		templates,
		recommendedTemplates,
		leaseOptions,
		loadError,
	};
}
