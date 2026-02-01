import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/gemini")({
	component: GeminiPage,
});

function GeminiPage() {
	const navigate = useNavigate();
	useEffect(() => {
		void navigate({ to: "/dashboard/ai", replace: true });
	}, [navigate]);

	return null;
}
