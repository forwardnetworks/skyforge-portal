import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getUserSettings,
	putUserSettings,
	type UIExperienceMode,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	DEFAULT_UI_EXPERIENCE_MODE,
	normalizeUIExperienceMode,
} from "../lib/ui-experience";

type Options = {
	enabled?: boolean;
};

export function useUIExperienceMode(options?: Options) {
	const queryClient = useQueryClient();
	const settingsQ = useQuery({
		queryKey: queryKeys.userSettings(),
		queryFn: getUserSettings,
		staleTime: 10_000,
		enabled: options?.enabled ?? true,
	});

	const mode = normalizeUIExperienceMode(settingsQ.data?.uiExperienceMode);

	const setModeMutation = useMutation({
		mutationFn: async (nextMode: UIExperienceMode) => {
			const current =
				queryClient.getQueryData<Awaited<ReturnType<typeof getUserSettings>>>(
					queryKeys.userSettings(),
				) ?? (await getUserSettings());
			return putUserSettings({
				defaultForwardCollectorConfigId:
					current.defaultForwardCollectorConfigId,
				defaultEnv: current.defaultEnv ?? [],
				externalTemplateRepos: current.externalTemplateRepos ?? [],
				uiExperienceMode: nextMode,
			});
		},
		onSuccess: (next) => {
			queryClient.setQueryData(queryKeys.userSettings(), next);
			void queryClient.invalidateQueries({ queryKey: queryKeys.toolCatalog() });
		},
	});

	return {
		settingsQ,
		mode,
		isSimple: mode === "simple",
		isAdvanced: mode === "advanced",
		setMode: setModeMutation.mutateAsync,
		setModeMutation,
		defaultMode: DEFAULT_UI_EXPERIENCE_MODE,
	};
}
