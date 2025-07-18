import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../services/queryClient";

export { queryClient };

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
