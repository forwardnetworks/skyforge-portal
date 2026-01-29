export type SSEHandler = (ev: MessageEvent<string>) => void;

export type SSESubscription = {
	close: () => void;
};

type SharedSource = {
	url: string;
	es: EventSource;
	refs: number;
	handlers: Map<string, Set<SSEHandler>>;
	reconnectTimer?: number;
	retryMs: number;
	closed: boolean;
};

const sharedSources = new Map<string, SharedSource>();

function attachAllHandlers(src: SharedSource) {
	for (const [eventName, set] of src.handlers.entries()) {
		for (const handler of set.values()) {
			src.es.addEventListener(eventName, handler as any);
		}
	}
}

function createEventSource(src: SharedSource): EventSource {
	const es = new EventSource(src.url, { withCredentials: true } as any);

	es.onopen = () => {
		src.retryMs = 500;
	};

	es.onerror = () => {
		if (src.closed) return;
		if (src.reconnectTimer) return;

		// EventSource should auto-reconnect, but in practice proxies/browsers can get
		// into a stuck state. If we see errors, force a reconnect with backoff.
		try {
			es.close();
		} catch {
			// ignore
		}

		const delay = src.retryMs;
		src.retryMs = Math.min(src.retryMs * 2, 15_000);
		src.reconnectTimer = window.setTimeout(() => {
			src.reconnectTimer = undefined;
			if (src.closed) return;
			src.es = createEventSource(src);
			attachAllHandlers(src);
		}, delay);
	};

	return es;
}

function getSharedSource(url: string): SharedSource {
	const existing = sharedSources.get(url);
	if (existing) {
		existing.refs += 1;
		return existing;
	}

	const created: SharedSource = {
		url,
		es: undefined as any,
		refs: 1,
		handlers: new Map(),
		retryMs: 500,
		closed: false,
	};
	created.es = createEventSource(created);
	sharedSources.set(url, created);
	return created;
}

function releaseSharedSource(url: string) {
	const src = sharedSources.get(url);
	if (!src) return;
	src.refs -= 1;
	if (src.refs > 0) return;
	sharedSources.delete(url);
	src.closed = true;
	if (src.reconnectTimer) {
		window.clearTimeout(src.reconnectTimer);
		src.reconnectTimer = undefined;
	}
	try {
		src.es.close();
	} catch {
		// ignore
	}
}

export function subscribeSSE(
	url: string,
	handlers: Record<string, SSEHandler>,
): SSESubscription {
	const src = getSharedSource(url);

	for (const [eventName, handler] of Object.entries(handlers)) {
		let set = src.handlers.get(eventName);
		if (!set) {
			set = new Set();
			src.handlers.set(eventName, set);
		}
		set.add(handler);
		src.es.addEventListener(eventName, handler as any);
	}

	return {
		close: () => {
			for (const [eventName, handler] of Object.entries(handlers)) {
				try {
					src.es.removeEventListener(eventName, handler as any);
				} catch {
					// ignore
				}
				const set = src.handlers.get(eventName);
				if (set) {
					set.delete(handler);
					if (set.size === 0) src.handlers.delete(eventName);
				}
			}
			releaseSharedSource(url);
		},
	};
}
