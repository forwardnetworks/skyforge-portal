import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadDelay: 50,
  context: {
    // Provided at runtime by <RouterProvider />
    queryClient: undefined!
  }
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
