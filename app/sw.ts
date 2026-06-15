/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, ExpirationPlugin } from "serwist";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const supabaseRead: RuntimeCaching = {
  matcher: ({ url, request }) =>
    url.hostname.endsWith(".supabase.co") &&
    url.pathname.startsWith("/rest/v1/") &&
    request.method === "GET",
  handler: new NetworkFirst({
    cacheName: "supabase-read",
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 })],
  }),
};

const runtimeCaching: RuntimeCaching[] = [supabaseRead, ...defaultCache];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "CIMO";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
