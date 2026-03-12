import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function DesignSystemPageBadgeCardSection() {
	return (
		<section className="space-y-4">
			<h2 className="text-xl font-semibold">Badges</h2>
			<div className="flex flex-wrap gap-4">
				<Badge>Default</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge variant="destructive">Destructive</Badge>
			</div>

			<h2 className="text-xl font-semibold">Cards</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader>
						<CardTitle>Default Card</CardTitle>
						<CardDescription>Standard container style</CardDescription>
					</CardHeader>
					<CardContent>Content goes here</CardContent>
				</Card>
				<Card variant="glass">
					<CardHeader>
						<CardTitle>Glass Card</CardTitle>
						<CardDescription>Backdrop blur effect</CardDescription>
					</CardHeader>
					<CardContent>Popular for headers</CardContent>
				</Card>
				<Card variant="flat">
					<CardHeader>
						<CardTitle>Flat Card</CardTitle>
						<CardDescription>No shadow, border only</CardDescription>
					</CardHeader>
					<CardContent>Clean look</CardContent>
				</Card>
				<Card variant="danger">
					<CardHeader>
						<CardTitle>Danger Card</CardTitle>
						<CardDescription>For error states</CardDescription>
					</CardHeader>
					<CardContent className="text-sm">Something went wrong</CardContent>
				</Card>
			</div>
		</section>
	);
}
