import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const clientEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith("VITE_") || key.startsWith("REACT_APP_"))
  );
  clientEnv.NODE_ENV = mode;
  return {
    plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
    envPrefix: ["VITE_", "REACT_APP_"],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
    },
    define: {
      "process.env": clientEnv,
    },
  };
});
