import { Mail, Settings } from "lucide-react";

import { Button } from "./ui/button";

export function DesignSystemPageButtonSection() {
	return (
		<section className="space-y-4">
			<h2 className="text-xl font-semibold">Buttons</h2>
			<div className="flex flex-wrap gap-4">
				<Button variant="default">Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="link">Link</Button>
				<Button size="sm">Small</Button>
				<Button size="lg">Large</Button>
				<Button size="icon">
					<Settings className="h-4 w-4" />
				</Button>
				<Button disabled>Disabled</Button>
				<Button variant="outline" className="gap-2">
					<Mail className="h-4 w-4" /> With Icon
				</Button>
			</div>
		</section>
	);
}
