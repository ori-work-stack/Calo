import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export const clearAllQueries = () => {
  queryClient.clear();
  console.log("✅ TanStack Query cache cleared");
};
