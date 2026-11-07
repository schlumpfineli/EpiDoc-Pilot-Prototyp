import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ch.epidoc.pilot",
  appName: "EpiDoc",
  webDir: "native/www",
  server: {
    url: "https://epi-doc-pilot-prototyp.vercel.app",
    hostname: "epi-doc-pilot-prototyp.vercel.app",
    androidScheme: "https",
    allowNavigation: [
      "epi-doc-pilot-prototyp.vercel.app",
      "epidoc-pilot-prototyp-production.up.railway.app",
    ],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
