import { useState } from "react";
import { useLabDesignerDataMutations } from "./use-lab-designer-data-mutations";
import { useLabDesignerDataQueries } from "./use-lab-designer-data-queries";
import type {
	LabDesignerImportState,
	LabDesignerValidationState,
	UseLabDesignerDataOptions,
} from "./use-lab-designer-data-types";

export function useLabDesignerData(opts: UseLabDesignerDataOptions) {
	const [lastValidation, setLastValidation] =
		useState<LabDesignerValidationState | null>(null);
	const [lastImportResult, setLastImportResult] =
		useState<LabDesignerImportState | null>(null);

	const queries = useLabDesignerDataQueries(opts);
	const mutations = useLabDesignerDataMutations({
		opts,
		setLastValidation,
		setLastImportResult,
	});

	return {
		...queries,
		...mutations,
		lastValidation,
		lastImportResult,
	};
}
