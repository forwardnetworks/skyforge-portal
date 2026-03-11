import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { getUserSettings, putUserSettings } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export const userSettingsFormSchema = z.object({
	defaultForwardCollectorConfigId: z.string().optional(),
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

export type UserSettingsFormValues = z.infer<typeof userSettingsFormSchema>;

function normalizeExternalTemplateRepos(
	repos: UserSettingsFormValues["externalTemplateRepos"],
) {
	return (repos ?? []).map((repo) => {
		const normalizedRepo = repo.repo.trim();
		const inferredName =
			normalizedRepo
				.split("/")
				.filter(Boolean)
				.at(-1)
				?.replace(/\.git$/, "") ?? "repo";

		return {
			id: repo.id ?? globalThis.crypto?.randomUUID?.() ?? inferredName,
			name: repo.name?.trim() || inferredName,
			repo: normalizedRepo,
			defaultBranch: repo.defaultBranch?.trim() || "main",
		};
	});
}

export function useUserSettingsForm() {
	const queryClient = useQueryClient();

	const settingsQ = useQuery({
		queryKey: queryKeys.userSettings(),
		queryFn: getUserSettings,
		staleTime: 10_000,
	});

	const form = useForm<UserSettingsFormValues>({
		resolver: zodResolver(userSettingsFormSchema),
		values: {
			defaultForwardCollectorConfigId:
				settingsQ.data?.defaultForwardCollectorConfigId || undefined,
			defaultEnv: settingsQ.data?.defaultEnv ?? [],
			externalTemplateRepos: settingsQ.data?.externalTemplateRepos ?? [],
		},
	});

	const reposArray = useFieldArray({
		control: form.control,
		name: "externalTemplateRepos",
	});

	const settingsMutation = useMutation({
		mutationFn: async (values: UserSettingsFormValues) =>
			putUserSettings({
				defaultForwardCollectorConfigId: values.defaultForwardCollectorConfigId,
				defaultEnv: values.defaultEnv ?? [],
				externalTemplateRepos: normalizeExternalTemplateRepos(
					values.externalTemplateRepos,
				),
			}),
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

	return {
		settingsQ,
		form,
		reposArray,
		settingsMutation,
		busy: settingsQ.isLoading || settingsMutation.isPending,
	};
}
