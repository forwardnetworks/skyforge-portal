import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;

export function ForwardCredentialsAddCard(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Add Credential Set</CardTitle>
				<CardDescription>
					Choose the target host, provide username/password, and save.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2 md:col-span-2">
						<Label>Host</Label>
						<Input
							value={page.customHost}
							onChange={(e) => page.setCustomHost(e.target.value)}
							placeholder="https://forward.example.com"
						/>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Checkbox
						checked={page.effectiveSkipTlsVerify}
						onCheckedChange={(v) => page.setSkipTlsVerify(Boolean(v))}
						disabled={page.tlsCheckboxDisabled}
					/>
					<Label className="text-sm">Disable TLS verification</Label>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Username</Label>
						<Input
							value={page.username}
							onChange={(e) => page.setUsername(e.target.value)}
							placeholder="you@example.com"
						/>
					</div>
					<div className="space-y-2">
						<Label>Password</Label>
						<Input
							type="password"
							value={page.password}
							onChange={(e) => page.setPassword(e.target.value)}
							placeholder="••••••••"
						/>
					</div>
				</div>

				<Button
					onClick={() => page.createMutation.mutate()}
					disabled={page.createMutation.isPending}
				>
					{page.createMutation.isPending ? "Saving…" : "Save credential set"}
				</Button>
			</CardContent>
		</Card>
	);
}
