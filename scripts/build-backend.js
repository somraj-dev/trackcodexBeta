import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("📦 Bundling Backend...");

esbuild
  .build({
    entryPoints: [path.join(__dirname, "../backend/server.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: path.join(__dirname, "../dist-backend/index.js"),
    // Exclude all node_modules from the bundle (keep them as external dependencies)
    // We will rely on a complete node_modules environment in the container.
    packages: "external",
    sourcemap: true,
    format: "esm",
  })
  .then(() => {
    console.log("✅ Backend bundled successfully to dist-backend/index.js");
  })
  .catch(() => {
    console.error("❌ Backend build failed");
    process.exit(1);
  });
