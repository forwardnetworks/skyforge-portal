import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PublicLandingPageContent } from "./public-landing-page-content";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

describe("PublicLandingPageContent", () => {
	it("shows the reauth prompt when the session must be refreshed", () => {
		render(
			<PublicLandingPageContent
				loginHref="/api/auth/oidc/login?next=%2Fgit%2F"
				localLoginHref="/login/local?next=%2Fgit%2F"
				breakGlassEnabled={false}
				breakGlassLabel="Emergency local login"
				authModeLabel="OIDC"
				reauthRequired
			/>,
		);

		expect(screen.getByText("Session refresh required")).toBeInTheDocument();
		expect(
			screen.getByText(/perform a full reauthentication before returning to Git/i),
		).toBeInTheDocument();
	});
});
