import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { Router } from "wouter";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import App from "./App";

export async function render(url: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })] });
  const q = url.indexOf("?"); const path = q === -1 ? url : url.slice(0, q); const search = q === -1 ? "" : url.slice(q + 1);
  const html = renderToString(<trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><Router ssrPath={path} ssrSearch={search}><App /></Router></QueryClientProvider></trpc.Provider>);
  return { html, state: queryClient.getQueryData([]) };
}
