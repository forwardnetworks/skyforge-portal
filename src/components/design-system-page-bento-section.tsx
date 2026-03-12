import { Cloud, CreditCard, User } from "lucide-react";

import { BentoGrid, BentoItem, BentoStatCard } from "./ui/bento-grid";

export function DesignSystemPageBentoSection() {
	return (
		<section className="space-y-4">
			<h2 className="text-xl font-semibold">Bento Grid</h2>
			<BentoGrid>
				<BentoStatCard
					title="Total Revenue"
					value="$45,231.89"
					icon={<CreditCard className="h-4 w-4" />}
					gradient="blue"
				/>
				<BentoStatCard
					title="Active Users"
					value="+2350"
					icon={<User className="h-4 w-4" />}
					gradient="green"
				/>
				<BentoItem gradient="purple" className="md:col-span-2">
					<div className="flex items-center gap-4">
						<div className="p-2 bg-background/20 rounded-full">
							<Cloud className="h-6 w-6" />
						</div>
						<div>
							<h3 className="font-semibold text-lg">Cloud Infrastructure</h3>
							<p className="text-sm text-muted-foreground/80">
								Manage your cloud resources and deployments from a single dashboard.
							</p>
						</div>
					</div>
				</BentoItem>
			</BentoGrid>
		</section>
	);
}
