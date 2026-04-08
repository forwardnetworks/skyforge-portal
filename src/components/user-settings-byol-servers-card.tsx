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
					<div className="text-sm font-medium">KNE</div>
					<div className="grid gap-2 md:grid-cols-2">
						<Input
							placeholder="https://clab.example.com"
							value={page.newKNEUrl}
							onChange={(e) => page.setNewKNEUrl(e.target.value)}
						/>
						<Input
							placeholder="API username (optional)"
							value={page.newKNEUser}
							onChange={(e) => page.setNewKNEUser(e.target.value)}
						/>
						<Input
							placeholder="API password (optional)"
							type="password"
							value={page.newKNEPassword}
							onChange={(e) => page.setNewKNEPassword(e.target.value)}
						/>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={page.newKNEInsecure}
								onChange={(e) =>
									page.setNewKNEInsecure(e.target.checked)
								}
							/>
							<div className="text-sm">Skip TLS verify</div>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => page.saveKNEServerM.mutate()}
						disabled={
							!page.newKNEUrl.trim() ||
							page.saveKNEServerM.isPending
						}
					>
						Add/Update
					</Button>
					<div className="space-y-2">
						{(page.userKNEServersQ.data?.servers ?? []).map(
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
											page.deleteKNEServerM.mutate(server.id)
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
					<div className="text-sm font-medium">Fixia (Baremetal)</div>
					<div className="grid gap-2 md:grid-cols-2">
						<Input
							placeholder="https://fixia.example.com"
							value={page.newFixiaUrl}
							onChange={(e) => page.setNewFixiaUrl(e.target.value)}
						/>
						<Input
							placeholder="API username (optional)"
							value={page.newFixiaUser}
							onChange={(e) => page.setNewFixiaUser(e.target.value)}
						/>
						<Input
							placeholder="API password or token (optional)"
							type="password"
							value={page.newFixiaPassword}
							onChange={(e) => page.setNewFixiaPassword(e.target.value)}
						/>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={page.newFixiaInsecure}
								onChange={(e) => page.setNewFixiaInsecure(e.target.checked)}
							/>
							<div className="text-sm">Skip TLS verify</div>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => page.saveFixiaServerM.mutate()}
						disabled={!page.newFixiaUrl.trim() || page.saveFixiaServerM.isPending}
					>
						Add/Update
					</Button>
					<div className="space-y-2">
						{(page.userFixiaServersQ.data?.servers ?? []).map((server) => (
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
										server.id && page.deleteFixiaServerM.mutate(server.id)
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
