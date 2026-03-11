import { S3Route } from "@/components/s3-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/s3")({
	component: S3Route,
});
