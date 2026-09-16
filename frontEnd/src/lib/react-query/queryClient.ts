import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 50,
      refetchOnWindowFocus: false,
    },
  },
});

export function refreshConnection() {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.ws,
  });
}
