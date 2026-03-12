import type { ForwardAnalyticsPageData } from "../hooks/use-forward-analytics-page";
import { ForwardAnalyticsPageAddCard } from "./forward-analytics-page-add-card";
import { ForwardAnalyticsPageHeader } from "./forward-analytics-page-header";
import { ForwardAnalyticsPagePortfolioCard } from "./forward-analytics-page-portfolio-card";
import { ForwardAnalyticsPageSavedCard } from "./forward-analytics-page-saved-card";

export function ForwardAnalyticsPageContent({
	page,
}: {
	page: ForwardAnalyticsPageData;
}) {
	return (
		<div className="space-y-6 p-6">
			<ForwardAnalyticsPageHeader page={page} />
			<ForwardAnalyticsPageAddCard page={page} />
			<ForwardAnalyticsPageSavedCard page={page} />
			<ForwardAnalyticsPagePortfolioCard page={page} />
		</div>
	);
}
