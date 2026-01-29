import type { SessionResponseEnvelope } from "./skyforge-api";
import { SKYFORGE_PROXY_ROOT } from "./skyforge-config";

type LoginPopupOptions = {
	loginHref: string;
	pollIntervalMs?: number;
	timeoutMs?: number;
};

async function fetchSessionNoRedirect(): Promise<SessionResponseEnvelope | null> {
	try {
		const resp = await fetch(`${SKYFORGE_PROXY_ROOT}/api/session`, {
			credentials: "include",
			headers: { "Content-Type": "application/json" },
		});
		if (!resp.ok) return null;
		return (await resp.json()) as SessionResponseEnvelope;
	} catch {
		return null;
	}
}

export async function loginWithPopup(
	options: LoginPopupOptions,
): Promise<boolean> {
	if (typeof window === "undefined") return false;

	const pollIntervalMs = options.pollIntervalMs ?? 750;
	const timeoutMs = options.timeoutMs ?? 2 * 60_000;

	const existing = await fetchSessionNoRedirect();
	if (existing?.authenticated) return true;

	const width = 520;
	const height = 720;
	const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
	const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
	const features = [
		"popup=yes",
		`width=${width}`,
		`height=${height}`,
		`left=${left}`,
		`top=${top}`,
	].join(",");

	const popup = window.open(options.loginHref, "skyforge_login", features);
	if (!popup) return false;
	try {
		popup.focus();
	} catch {
		// ignore
	}

	return await new Promise<boolean>((resolve) => {
		const start = Date.now();
		const timer = window.setInterval(async () => {
			try {
				if (popup.closed) {
					window.clearInterval(timer);
					resolve(false);
					return;
				}

				if (Date.now() - start > timeoutMs) {
					window.clearInterval(timer);
					try {
						popup.close();
					} catch {
						// ignore
					}
					resolve(false);
					return;
				}

				const sess = await fetchSessionNoRedirect();
				if (sess?.authenticated) {
					window.clearInterval(timer);
					try {
						popup.close();
					} catch {
						// ignore
					}
					resolve(true);
				}
			} catch {
				// ignore and keep polling
			}
		}, pollIntervalMs);
	});
}
