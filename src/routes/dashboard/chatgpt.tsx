import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/chatgpt")({
	component: ChatGPTPage,
});

function ChatGPTPage() {
	return (
		<div className="mx-auto w-full max-w-3xl space-y-4 p-4">
			<div>
				<h1 className="text-2xl font-bold">ChatGPT</h1>
				<p className="text-sm text-muted-foreground">
					Connector placeholder. This will support bringing your own OpenAI API
					key for template generation workflows.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Status</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Not configured yet.
				</CardContent>
			</Card>
		</div>
	);
}

