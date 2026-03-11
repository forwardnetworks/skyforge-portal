import type { LabDesignerSearch } from "@/components/lab-designer-types";
import { useEffect } from "react";
import { toast } from "sonner";

export function useLabDesignerImportPrefsEffect(props: {
	importOpen: boolean;
	userId: string;
	importSource: "user" | "blueprints";
	importDir: string;
	setImportSource: (value: "user" | "blueprints") => void;
	setImportDir: (value: string) => void;
	userRepoSource: "user";
}) {
	useEffect(() => {
		if (!props.importOpen || !props.userId) return;
		const key = `skyforge.labDesigner.importPrefs.${props.userId}`;
		try {
			const raw = window.localStorage.getItem(key);
			if (!raw) return;
			const parsed = JSON.parse(raw) as any;
			if (parsed?.source === "user") {
				props.setImportSource(props.userRepoSource);
			} else if (
				parsed?.source === props.userRepoSource ||
				parsed?.source === "blueprints"
			) {
				props.setImportSource(parsed.source);
			}
			if (typeof parsed?.dir === "string") props.setImportDir(parsed.dir);
		} catch {
			// ignore
		}
	}, [
		props.importOpen,
		props.setImportDir,
		props.setImportSource,
		props.userId,
		props.userRepoSource,
	]);

	useEffect(() => {
		if (!props.userId) return;
		const key = `skyforge.labDesigner.importPrefs.${props.userId}`;
		try {
			window.localStorage.setItem(
				key,
				JSON.stringify({ source: props.importSource, dir: props.importDir }),
			);
		} catch {
			// ignore
		}
	}, [props.importDir, props.importSource, props.userId]);
}

export function useLabDesignerEscapeKeyEffect(closeMenus: () => void) {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeMenus();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}

export function useLabDesignerImportedDeploymentSyncEffect(props: {
	search: LabDesignerSearch;
	syncImportedDeployment: (search: LabDesignerSearch) => Promise<void>;
}) {
	useEffect(() => {
		const ws = String(props.search.userId ?? "").trim();
		const depId = String(props.search.importDeploymentId ?? "").trim();
		if (!ws || !depId) return;

		let cancelled = false;
		(async () => {
			try {
				await props.syncImportedDeployment(props.search);
			} catch (e) {
				if (cancelled) return;
				toast.error("Failed to import deployment topology", {
					description: (e as Error).message,
				});
			}
		})();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.search.importDeploymentId, props.search.userId]);
}
