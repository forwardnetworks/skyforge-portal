import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	type NavFeatures,
	type NavItem,
	getNavigationSections,
} from "@/lib/navigation";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

export function CommandMenu(props: {
	isAdmin?: boolean;
	features?: NavFeatures;
}) {
	const [open, setOpen] = React.useState(false);
	const navigate = useNavigate();
	const sections = React.useMemo(
		() =>
			getNavigationSections({
				isAdmin: props.isAdmin,
				features: props.features,
			}),
		[props.isAdmin, props.features],
	);

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const openNavItem = React.useCallback(
		(item: NavItem) => {
			if (item.external || item.newTab) {
				window.open(item.href, "_blank", "noopener,noreferrer");
				return;
			}
			void navigate({ to: item.href as never });
		},
		[navigate],
	);

	const runCommand = React.useCallback(
		(item: NavItem) => {
			setOpen(false);
			openNavItem(item);
		},
		[openNavItem],
	);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				{sections.map((section, idx) => (
					<React.Fragment key={section.id}>
						<CommandGroup heading={section.label}>
							{section.items.map((item) => (
								<CommandItem
									key={item.id}
									value={[item.label, ...(item.searchTerms ?? [])].join(" ")}
									onSelect={() => runCommand(item)}
								>
									<item.icon className="mr-2 h-4 w-4" />
									<span>{item.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
						{idx < sections.length - 1 ? <CommandSeparator /> : null}
					</React.Fragment>
				))}
			</CommandList>
		</CommandDialog>
	);
}
