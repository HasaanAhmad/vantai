import * as esbuild from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [resolve(__dirname, "src/server.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile: "dist/server.js",
  format: "esm",
  sourcemap: true,
  alias: {
    "@": resolve(__dirname, "src"),
  },
  packages: "external",
  loader: {
    ".ts": "ts",
  },
});
