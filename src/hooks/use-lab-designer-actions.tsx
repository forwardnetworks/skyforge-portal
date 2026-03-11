import type { LabDesignerActionsOptions } from "./lab-designer-action-types";
import { createLabDesignerDndActions } from "./use-lab-designer-dnd-actions";
import { createLabDesignerPersistenceActions } from "./use-lab-designer-persistence-actions";
import { createLabDesignerTopologyActions } from "./use-lab-designer-topology-actions";

export function createLabDesignerActions(opts: LabDesignerActionsOptions) {
	return {
		...createLabDesignerTopologyActions(opts),
		...createLabDesignerPersistenceActions(opts),
		...createLabDesignerDndActions(opts),
	};
}
