import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsSectionContent } from "../components/settings-page-content";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { useAdminSettingsPage } from "../hooks/use-admin-settings-page";
import { useUserSettingsPage } from "../hooks/use-user-settings-page";
import {
	type SettingsSectionId,
	getAvailableSettingsSections,
	normalizeSettingsSection,
} from "../lib/settings-sections";
import { cn } from "../lib/utils";
import { useCatalogRouteAccess } from "../hooks/use-catalog-route-access";

const settingsSearchSchema = z.object({
	section: z
		.enum([
			"profile",
			"identity",
			"integrations",
			"forward",
			"runtime",
			"users",
			"maintenance",
		])
		.optional(),
});

export const Route = createFileRoute("/settings")({
	validateSearch: (search) => settingsSearchSchema.parse(search),
	component: SettingsPage,
});

function SettingsPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const routeAccess = useCatalogRouteAccess();
	const canAccessAdminSections = routeAccess.canAccessRoute("/admin/");
	const section = normalizeSettingsSection({
		section: search.section as SettingsSectionId | undefined,
		canAccessAdminSections,
	});
	const sections = getAvailableSettingsSections(canAccessAdminSections);

	const onSectionChange = (nextSection: SettingsSectionId) => {
		void navigate({
			to: "/settings",
			search: { section: nextSection },
			replace: true,
		});
	};

	if (!canAccessAdminSections) {
		return (
			<SettingsUserOnlyPage
				section={section}
				sections={sections}
				onSectionChange={onSectionChange}
			/>
		);
	}

	return (
		<SettingsAdminPage
			section={section}
			sections={sections}
			onSectionChange={onSectionChange}
		/>
	);
}

function SettingsUserOnlyPage(props: {
	section: SettingsSectionId;
	sections: ReturnType<typeof getAvailableSettingsSections>;
	onSectionChange: (section: SettingsSectionId) => void;
}) {
	const userPage = useUserSettingsPage();
	const sectionDefinition =
		props.sections.find((entry) => entry.id === props.section) ??
		props.sections[0];

	return (
		<SettingsShell
			section={props.section}
			sections={props.sections}
			onSectionChange={props.onSectionChange}
		>
			<SettingsSectionContent
				section={props.section}
				sectionDefinition={sectionDefinition}
				userPage={userPage}
			/>
		</SettingsShell>
	);
}

function SettingsAdminPage(props: {
	section: SettingsSectionId;
	sections: ReturnType<typeof getAvailableSettingsSections>;
	onSectionChange: (section: SettingsSectionId) => void;
}) {
	const userPage = useUserSettingsPage();
	const adminPage = useAdminSettingsPage();
	const sectionDefinition =
		props.sections.find((entry) => entry.id === props.section) ??
		props.sections[0];
	const adminProps = adminPage;

	return (
		<SettingsShell
			section={props.section}
			sections={props.sections}
			onSectionChange={props.onSectionChange}
		>
			<SettingsSectionContent
				section={props.section}
				sectionDefinition={sectionDefinition}
				userPage={userPage}
				adminProps={adminProps}
			/>
		</SettingsShell>
	);
}

function SettingsShell(props: {
	section: SettingsSectionId;
	sections: ReturnType<typeof getAvailableSettingsSections>;
	onSectionChange: (section: SettingsSectionId) => void;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>Settings</CardTitle>
					<CardDescription>
						One settings surface for personal defaults, platform controls,
						integrations, and maintenance actions.
					</CardDescription>
				</CardHeader>
			</Card>

			<div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
				<Card className="h-fit xl:sticky xl:top-6">
					<CardHeader>
						<CardTitle className="text-base">Sections</CardTitle>
						<CardDescription>
							Settings are grouped by intent instead of by legacy page
							boundaries.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{props.sections.map((entry) => (
							<Button
								key={entry.id}
								type="button"
								variant={props.section === entry.id ? "secondary" : "ghost"}
								className={cn(
									"h-auto w-full items-start justify-start px-3 py-3 text-left",
									props.section === entry.id && "border border-border",
								)}
								onClick={() => props.onSectionChange(entry.id)}
							>
								<div className="space-y-1">
									<div className="font-medium">{entry.label}</div>
									<div className="whitespace-normal text-xs text-muted-foreground">
										{entry.description}
									</div>
								</div>
							</Button>
						))}
					</CardContent>
				</Card>

				<div className="min-w-0">{props.children}</div>
			</div>
		</div>
	);
}
