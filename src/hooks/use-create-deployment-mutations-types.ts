import type { UseFormReturn } from "react-hook-form";
import type * as z from "zod";
import type { UserVariableGroup } from "../lib/api-client";
import type { formSchema } from "./create-deployment-shared";

export type CreateDeploymentMutationsArgs = {
	navigate: (options: any) => Promise<void> | void;
	queryClient: any;
	form: UseFormReturn<z.infer<typeof formSchema>>;
	watchUserScopeId: string;
	watchKind: z.infer<typeof formSchema>["kind"];
	watchTemplate: string;
	watchTemplateRepoId: string | undefined;
	effectiveSource: z.infer<typeof formSchema>["source"];
	templatesDir?: string;
	allowNoExpiry: boolean;
	managedFamilies: Set<string>;
	lifetimeAllowedHours: number[];
	variableGroups: UserVariableGroup[];
};
