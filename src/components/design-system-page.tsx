import { DesignSystemPageBadgeCardSection } from "./design-system-page-badge-card-section";
import { DesignSystemPageBentoSection } from "./design-system-page-bento-section";
import { DesignSystemPageBreadcrumbSection } from "./design-system-page-breadcrumb-section";
import { DesignSystemPageButtonSection } from "./design-system-page-button-section";
import { DesignSystemPageFeedbackToastSection } from "./design-system-page-feedback-toast-section";
import { DesignSystemPageFormTabsSection } from "./design-system-page-form-tabs-section";
import { DesignSystemPageHeader } from "./design-system-page-header";

export function DesignSystemPage() {
	return (
		<div className="space-y-10 p-6 pb-20">
			<DesignSystemPageHeader />
			<DesignSystemPageButtonSection />
			<DesignSystemPageBadgeCardSection />
			<DesignSystemPageBentoSection />
			<DesignSystemPageFormTabsSection />
			<DesignSystemPageFeedbackToastSection />
			<DesignSystemPageBreadcrumbSection />
		</div>
	);
}
