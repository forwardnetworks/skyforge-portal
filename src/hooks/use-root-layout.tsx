import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	adminImpersonateStop,
	buildLocalLoginUrl,
	buildLoginUrl,
	getSession,
	getUIConfig,
	getUserNotifications,
	logout,
	refreshSession,
} from "../lib/api-client";
import { loginWithPopup } from "../lib/auth-popup";
import {
	type NotificationsSnapshot,
	useNotificationsEvents,
} from "../lib/notifications-events";
import { queryKeys } from "../lib/query-keys";
import { sessionIsAdmin } from "../lib/rbac";
import { getSessionExpiryWarning } from "../lib/session-expiry";
import type { SkyforgeAuthMode } from "../lib/skyforge-config";
import { useUIExperienceMode } from "./use-ui-experience-mode";

export function useRootLayout() {
	const location = useRouterState({ select: (state) => state.location });
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [loggingOut, setLoggingOut] = useState(false);
	const [loggingIn, setLoggingIn] = useState(false);
	const [navCollapsed, setNavCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [expiryNowMs, setExpiryNowMs] = useState(() => Date.now());

	const isLabDesignerRoute = useMemo(
		() => location.pathname === "/dashboard/labs/designer",
		[location.pathname],
	);
	const isFullBleedRoute = useMemo(
		() => isLabDesignerRoute || location.pathname === "/dashboard/labs/map",
		[isLabDesignerRoute, location.pathname],
	);

	useEffect(() => {
		if (!isLabDesignerRoute) return;
		setNavCollapsed(true);
	}, [isLabDesignerRoute]);

	useEffect(() => {
		if (window.location.pathname === "/index.html") {
			void navigate({ to: "/", replace: true });
		}
	}, [navigate]);

	const session = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		retry: false,
		staleTime: 30_000,
	});
	const uiExperience = useUIExperienceMode({
		enabled: session.data?.authenticated === true,
	});

	const uiConfig = useQuery({
		queryKey: queryKeys.uiConfig(),
		queryFn: getUIConfig,
		staleTime: 5 * 60_000,
	});

	const productName = uiConfig.data?.productName || "Skyforge";
	const productSubtitle =
		uiConfig.data?.productSubtitle || "Automation Platform";
	const authMode: SkyforgeAuthMode | null =
		uiConfig.data?.auth?.primaryProvider === "local"
			? "local"
			: uiConfig.data?.auth?.primaryProvider === "okta"
				? "oidc"
				: uiConfig.data?.authMode === "local"
					? "local"
					: uiConfig.data?.authMode === "oidc"
						? "oidc"
						: null;
	const authModeReady = authMode !== null;
	const breakGlassEnabled = uiConfig.data?.auth?.breakGlassEnabled === true;
	const breakGlassLabel = String(
		uiConfig.data?.auth?.breakGlassLabel ?? "Emergency local login",
	).trim();

	const next = useMemo(
		() =>
			`${location.pathname}${location.searchStr ?? ""}${location.hash ?? ""}`,
		[location.hash, location.pathname, location.searchStr],
	);
	const loginHref = useMemo(
		() => buildLoginUrl(next, authMode),
		[authMode, next],
	);
	const localLoginHref = useMemo(() => buildLocalLoginUrl(next), [next]);
	const isProtectedRoute = useMemo(() => {
		const protectedPrefixes = [
			"/dashboard",
			"/admin",
			"/webhooks",
			"/syslog",
			"/snmp",
		];
		return protectedPrefixes.some((prefix) =>
			location.pathname.startsWith(prefix),
		);
	}, [location.pathname]);

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [location.pathname]);

	const who = session.data?.displayName || session.data?.username || "";
	const isAdmin = sessionIsAdmin(session.data);
	const isImpersonating = !!session.data?.impersonating;
	const actorUsername = String(session.data?.actorUsername ?? "").trim();
	const effectiveUsername = String(session.data?.username ?? "").trim();
	const sessionExpiryWarning = useMemo(
		() =>
			getSessionExpiryWarning(session.data, {
				nowMs: expiryNowMs,
				warningWindowMs: 15 * 60_000,
			}),
		[expiryNowMs, session.data],
	);
	const suppressLoginGate =
		!session.data?.authenticated &&
		(location.pathname === "/dashboard" ||
			location.pathname.startsWith("/dashboard/"));
	const showLoginGate =
		isProtectedRoute &&
		!session.isLoading &&
		!session.data?.authenticated &&
		!suppressLoginGate;

	useEffect(() => {
		if (!showLoginGate) return;
		void navigate({
			to: "/",
			search: { next },
			replace: true,
		});
	}, [navigate, next, showLoginGate]);

	const username = session.data?.username ?? "";
	const notificationsLimit = "20";
	useNotificationsEvents(!!username, false, notificationsLimit);
	const notifications = useQuery<NotificationsSnapshot>({
		queryKey: queryKeys.notifications(false, notificationsLimit),
		enabled: !!username,
		queryFn: async () => {
			const resp = await getUserNotifications(username, {
				include_read: "false",
				limit: notificationsLimit,
			});
			return { notifications: resp.notifications ?? [] };
		},
		staleTime: Number.POSITIVE_INFINITY,
		initialData: { notifications: [] },
	});
	const unreadCount = useMemo(() => {
		const list = notifications.data?.notifications ?? [];
		return list.filter((notification: any) => !notification.is_read).length;
	}, [notifications.data?.notifications]);

	const stopImpersonation = useMutation({
		mutationFn: async () => adminImpersonateStop(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
			window.location.reload();
		},
		onError: (error) => {
			toast.error("Failed to stop impersonation", {
				description: (error as Error).message,
			});
		},
	});
	const refreshSessionM = useMutation({
		mutationFn: refreshSession,
		onSuccess: (nextSession) => {
			queryClient.setQueryData(queryKeys.session(), nextSession);
		},
		onError: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.session() });
		},
	});

	useEffect(() => {
		if (!session.data?.authenticated || typeof window === "undefined") return;
		const timer = window.setInterval(() => {
			if (document.visibilityState !== "visible") return;
			refreshSessionM.mutate();
		}, 5 * 60_000);
		return () => window.clearInterval(timer);
	}, [refreshSessionM, session.data?.authenticated]);

	useEffect(() => {
		if (!session.data?.authenticated || typeof window === "undefined") return;
		const timer = window.setInterval(() => {
			setExpiryNowMs(Date.now());
		}, 30_000);
		return () => window.clearInterval(timer);
	}, [session.data?.authenticated]);

	const startLogin = async () => {
		if (!authModeReady && !uiConfig.isError) return;
		if (authMode === "local") {
			window.location.href = loginHref;
			return;
		}
		try {
			setLoggingIn(true);
			const ok = await loginWithPopup({ loginHref });
			if (!ok) {
				window.location.href = loginHref;
				return;
			}
			await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
		} finally {
			setLoggingIn(false);
		}
	};

	const triggerCommandMenu = () => {
		const event = new KeyboardEvent("keydown", {
			key: "k",
			metaKey: true,
			bubbles: true,
		});
		document.dispatchEvent(event);
	};

	const breadcrumbSegments = useMemo(() => {
		const raw = location.pathname.split("/").filter(Boolean);
		let segments = raw;
		while (segments[0] === "dashboard") {
			segments = segments.slice(1);
		}
		const prefix = raw[0] === "dashboard" ? "/dashboard" : "";
		return segments.map((segment, index, array) => ({
			path: `${prefix}/${array.slice(0, index + 1).join("/")}`,
			segment,
			isLast: index === array.length - 1,
		}));
	}, [location.pathname]);

	const handleLogout = async () => {
		try {
			setLoggingOut(true);
			await logout();
			window.location.href = "/";
		} finally {
			setLoggingOut(false);
		}
	};

	return {
		location,
		navigate,
		loggingOut,
		loggingIn,
		navCollapsed,
		setNavCollapsed,
		mobileMenuOpen,
		setMobileMenuOpen,
		isFullBleedRoute,
		session,
		uiConfig,
		uiExperienceMode: uiExperience.mode,
		uiExperienceBusy: uiExperience.setModeMutation.isPending,
		setUIExperienceMode: async (nextMode: "simple" | "advanced") => {
			await uiExperience.setMode(nextMode);
		},
		productName,
		productSubtitle,
		authMode,
		authModeReady,
		breakGlassEnabled,
		breakGlassLabel,
		loginHref,
		localLoginHref,
		who,
		isAdmin,
		isImpersonating,
		actorUsername,
		effectiveUsername,
		sessionExpiryWarning,
		showLoginGate,
		unreadCount,
		stopImpersonation,
		startLogin,
		handleLogout,
		triggerCommandMenu,
		breadcrumbSegments,
	};
}

export type RootLayoutState = ReturnType<typeof useRootLayout>;
