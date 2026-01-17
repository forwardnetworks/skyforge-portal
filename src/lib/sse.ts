export type SSEHandler = (ev: MessageEvent<string>) => void;

export type SSESubscription = {
  close: () => void;
};

type SharedSource = {
  url: string;
  es: EventSource;
  refs: number;
};

const sharedSources = new Map<string, SharedSource>();

function getSharedSource(url: string): SharedSource {
  const existing = sharedSources.get(url);
  if (existing) {
    existing.refs += 1;
    return existing;
  }

  const es = new EventSource(url, { withCredentials: true } as any);
  es.onerror = () => {
    // Browser auto-reconnects; no-op.
  };

  const created: SharedSource = { url, es, refs: 1 };
  sharedSources.set(url, created);
  return created;
}

function releaseSharedSource(url: string) {
  const src = sharedSources.get(url);
  if (!src) return;
  src.refs -= 1;
  if (src.refs > 0) return;
  sharedSources.delete(url);
  src.es.close();
}

export function subscribeSSE(url: string, handlers: Record<string, SSEHandler>): SSESubscription {
  const src = getSharedSource(url);
  const es = src.es;

  for (const [eventName, handler] of Object.entries(handlers)) {
    es.addEventListener(eventName, handler as any);
  }

  return {
    close: () => {
      for (const [eventName, handler] of Object.entries(handlers)) {
        es.removeEventListener(eventName, handler as any);
      }
      releaseSharedSource(url);
    }
  };
}
