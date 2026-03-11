import type { ForwardCollectorsPageState } from "@/hooks/use-forward-collectors-page";
import { ForwardCollectorsCreateCard } from "./forward-collectors-create-card";
import { ForwardCollectorsListCard } from "./forward-collectors-list-card";

export function ForwardCollectorsPageContent(props: {
	page: ForwardCollectorsPageState;
}) {
	const { page } = props;

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold">Collector</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Create one or more per-user in-cluster Forward collectors. Select a
						collector per deployment.
					</p>
				</div>
			</div>

			<ForwardCollectorsCreateCard page={page} />
			<ForwardCollectorsListCard page={page} />
		</div>
	);
}
