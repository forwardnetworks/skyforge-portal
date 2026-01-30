import { useNavigate } from "@tanstack/react-router";
import {
	Activity,
	Bell,
	FolderKanban,
	Inbox,
	LayoutDashboard,
	Server,
	ShieldCheck,
	Webhook,
} from "lucide-react";
import * as React from "react";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

export function CommandMenu() {
	const [open, setOpen] = React.useState(false);
	const navigate = useNavigate();

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const runCommand = React.useCallback((command: () => void) => {
		setOpen(false);
		command();
	}, []);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Suggestions">
					<CommandItem
						onSelect={() => runCommand(() => navigate({ to: "/status" }))}
					>
						<LayoutDashboard className="mr-2 h-4 w-4" />
						<span>Dashboard</span>
					</CommandItem>
					<CommandItem
						onSelect={() =>
							runCommand(() => navigate({ to: "/dashboard/deployments" }))
						}
					>
						<FolderKanban className="mr-2 h-4 w-4" />
						<span>Deployments</span>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => navigate({ to: "/status" }))}
					>
						<Activity className="mr-2 h-4 w-4" />
						<span>Platform Status</span>
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Infrastructure">
					<CommandItem
						onSelect={() => runCommand(() => navigate({ to: "/dashboard/s3" }))}
					>
						<Server className="mr-2 h-4 w-4" />
						<span>S3 Storage</span>
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Events & Monitoring">
					<CommandItem
						onSelect={() =>
							runCommand(() => navigate({ to: "/notifications" }))
						}
					>
						<Bell className="mr-2 h-4 w-4" />
						<span>Notifications</span>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => navigate({ to: "/webhooks" }))}
					>
						<Webhook className="mr-2 h-4 w-4" />
						<span>Webhooks</span>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => navigate({ to: "/syslog" }))}
					>
						<Inbox className="mr-2 h-4 w-4" />
						<span>Syslog</span>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => navigate({ to: "/snmp" }))}
					>
						<ShieldCheck className="mr-2 h-4 w-4" />
						<span>SNMP Traps</span>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
