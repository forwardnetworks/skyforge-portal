import type { RootLayoutState } from "@/hooks/use-root-layout";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "./ui/breadcrumb";

export function RootBreadcrumbs(props: {
	segments: RootLayoutState["breadcrumbSegments"];
}) {
	return (
		<div className="mb-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
					</BreadcrumbItem>
					{props.segments.map((segment) => (
						<>
							<BreadcrumbSeparator key={`${segment.path}:sep`} />
							<BreadcrumbItem key={segment.path}>
								{segment.isLast ? (
									<BreadcrumbPage className="capitalize">
										{segment.segment}
									</BreadcrumbPage>
								) : (
									<BreadcrumbLink href={segment.path} className="capitalize">
										{segment.segment}
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</>
					))}
				</BreadcrumbList>
			</Breadcrumb>
		</div>
	);
}
