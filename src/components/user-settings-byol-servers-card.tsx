import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsByolServersCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>BYOL Servers</CardTitle>
			</CardHeader>
			<CardContent className="space-y-8">
				<div className="space-y-4">
					<div className="text-sm font-medium">Netlab</div>
					<div className="grid gap-2 md:grid-cols-2">
						<Input
							placeholder="https://netlab.example.com"
							value={page.newNetlabUrl}
							onChange={(e) => page.setNewNetlabUrl(e.target.value)}
						/>
						<Input
							placeholder="API username (optional)"
							value={page.newNetlabUser}
							onChange={(e) => page.setNewNetlabUser(e.target.value)}
						/>
						<Input
							placeholder="API password (optional)"
							type="password"
							value={page.newNetlabPassword}
							onChange={(e) => page.setNewNetlabPassword(e.target.value)}
						/>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={page.newNetlabInsecure}
								onChange={(e) => page.setNewNetlabInsecure(e.target.checked)}
							/>
							<div className="text-sm">Skip TLS verify</div>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => page.saveNetlabServerM.mutate()}
						disabled={
							!page.newNetlabUrl.trim() || page.saveNetlabServerM.isPending
						}
					>
						Add/Update
					</Button>
					<div className="space-y-2">
						{(page.userNetlabServersQ.data?.servers ?? []).map((server) => (
							<div
								key={server.id}
								className="flex items-center justify-between rounded border px-3 py-2"
							>
								<div className="min-w-0">
									<div className="truncate text-sm font-medium">
										{server.name}
									</div>
									<div className="truncate text-xs text-muted-foreground font-mono">
										{server.apiUrl}
									</div>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() =>
										server.id && page.deleteNetlabServerM.mutate(server.id)
									}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				</div>

				<div className="space-y-4">
					<div className="text-sm font-medium">Containerlab</div>
					<div className="grid gap-2 md:grid-cols-2">
						<Input
							placeholder="https://clab.example.com"
							value={page.newContainerlabUrl}
							onChange={(e) => page.setNewContainerlabUrl(e.target.value)}
						/>
						<Input
							placeholder="API username (optional)"
							value={page.newContainerlabUser}
							onChange={(e) => page.setNewContainerlabUser(e.target.value)}
						/>
						<Input
							placeholder="API password (optional)"
							type="password"
							value={page.newContainerlabPassword}
							onChange={(e) => page.setNewContainerlabPassword(e.target.value)}
						/>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={page.newContainerlabInsecure}
								onChange={(e) =>
									page.setNewContainerlabInsecure(e.target.checked)
								}
							/>
							<div className="text-sm">Skip TLS verify</div>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => page.saveContainerlabServerM.mutate()}
						disabled={
							!page.newContainerlabUrl.trim() ||
							page.saveContainerlabServerM.isPending
						}
					>
						Add/Update
					</Button>
					<div className="space-y-2">
						{(page.userContainerlabServersQ.data?.servers ?? []).map(
							(server) => (
								<div
									key={server.id}
									className="flex items-center justify-between rounded border px-3 py-2"
								>
									<div className="min-w-0">
										<div className="truncate text-sm font-medium">
											{server.name}
										</div>
										<div className="truncate text-xs text-muted-foreground font-mono">
											{server.apiUrl}
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() =>
											server.id &&
											page.deleteContainerlabServerM.mutate(server.id)
										}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							),
						)}
					</div>
				</div>

				<div className="space-y-4">
					<div className="text-sm font-medium">EVE-NG</div>
					<div className="grid gap-2 md:grid-cols-2">
						<Input
							placeholder="https://eve.example.com/api"
							value={page.newEveApiUrl}
							onChange={(e) => page.setNewEveApiUrl(e.target.value)}
						/>
						<Input
							placeholder="Web URL (optional)"
							value={page.newEveWebUrl}
							onChange={(e) => page.setNewEveWebUrl(e.target.value)}
						/>
						<Input
							placeholder="API username (optional)"
							value={page.newEveApiUser}
							onChange={(e) => page.setNewEveApiUser(e.target.value)}
						/>
						<Input
							placeholder="API password (optional)"
							type="password"
							value={page.newEveApiPassword}
							onChange={(e) => page.setNewEveApiPassword(e.target.value)}
						/>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={page.newEveSkipTlsVerify}
								onChange={(e) => page.setNewEveSkipTlsVerify(e.target.checked)}
							/>
							<div className="text-sm">Skip TLS verify</div>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => page.saveEveServerM.mutate()}
						disabled={
							!page.newEveApiUrl.trim() || page.saveEveServerM.isPending
						}
					>
						Add/Update
					</Button>
					<div className="space-y-2">
						{(page.userEveServersQ.data?.servers ?? []).map((server) => (
							<div
								key={server.id}
								className="flex items-center justify-between rounded border px-3 py-2"
							>
								<div className="min-w-0">
									<div className="truncate text-sm font-medium">
										{server.name}
									</div>
									<div className="truncate text-xs text-muted-foreground font-mono">
										{server.apiUrl}
									</div>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() =>
										server.id && page.deleteEveServerM.mutate(server.id)
									}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
