export type SSEHandler = (ev: MessageEvent<string>) => void;

export type SSESubscription = {
  close: () => void;
};

export function subscribeSSE(url: string, handlers: Record<string, SSEHandler>): SSESubscription {
  const es = new EventSource(url, { withCredentials: true } as any);

  for (const [eventName, handler] of Object.entries(handlers)) {
    es.addEventListener(eventName, handler as any);
  }

  es.onerror = () => {
    // Browser auto-reconnects; no-op.
  };

  return {
    close: () => {
      for (const [eventName, handler] of Object.entries(handlers)) {
        es.removeEventListener(eventName, handler as any);
      }
      es.close();
    }
  };
}

