const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

const clientAliasPlugin = {
  name: "client-shims-and-alias",
  setup(build) {
    // Alias next/link
    build.onResolve({ filter: /^next\/link$/ }, () => {
      return { path: path.join(__dirname, "../src/client/shims/next-link.tsx") };
    });

    // Alias next/navigation
    build.onResolve({ filter: /^next\/navigation$/ }, () => {
      return { path: path.join(__dirname, "../src/client/shims/next-navigation.tsx") };
    });

    // Alias next/font/google
    build.onResolve({ filter: /^next\/font\/google$/ }, () => {
      return {
        path: "next-font-google-mock",
        namespace: "virtual-font",
      };
    });
    build.onLoad({ filter: /.*/, namespace: "virtual-font" }, () => {
      return {
        contents: `export function Inter() { return { className: "font-sans" }; }`,
        loader: "js",
      };
    });

    // Alias @/ to src/
    build.onResolve({ filter: /^@\// }, (args) => {
      const subPath = args.path.replace(/^@\//, "");
      const resolved = path.join(__dirname, "../src", subPath);
      for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"]) {
        const full = resolved + ext;
        if (fs.existsSync(full) && !fs.statSync(full).isDirectory()) {
          return { path: full };
        }
      }
      return { path: resolved };
    });
  },
};

const serverAliasPlugin = {
  name: "server-shims-and-alias",
  setup(build) {
    // Alias next/server
    build.onResolve({ filter: /^next\/server$/ }, () => {
      return { path: path.join(__dirname, "../src/server/shims/next-server.ts") };
    });

    // Alias @/ to src/
    build.onResolve({ filter: /^@\// }, (args) => {
      const subPath = args.path.replace(/^@\//, "");
      const resolved = path.join(__dirname, "../src", subPath);
      for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"]) {
        const full = resolved + ext;
        if (fs.existsSync(full) && !fs.statSync(full).isDirectory()) {
          return { path: full };
        }
      }
      return { path: resolved };
    });
  },
};

async function build() {
  console.log("🚀 Starting build process...");

  if (!fs.existsSync("public")) {
    fs.mkdirSync("public", { recursive: true });
  }
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }

  // 1. Build CSS with Tailwind
  console.log("🎨 Compiling Tailwind CSS...");
  const cssInput = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
  const postcssResult = await postcss([
    tailwindcss(path.join(__dirname, "../tailwind.config.ts")),
    autoprefixer,
  ]).process(cssInput, {
    from: path.join(__dirname, "../src/app/globals.css"),
    to: path.join(__dirname, "../public/styles.css"),
  });
  fs.writeFileSync(path.join(__dirname, "../public/styles.css"), postcssResult.css);
  console.log("✅ CSS generated successfully!");

  // 2. Bundle Client SPA / React App
  console.log("📦 Bundling React client application...");
  await esbuild.build({
    entryPoints: [path.join(__dirname, "../src/client/index.tsx")],
    bundle: true,
    minify: false,
    sourcemap: true,
    outfile: path.join(__dirname, "../public/bundle.js"),
    plugins: [clientAliasPlugin],
    loader: {
      ".png": "dataurl",
      ".svg": "text",
      ".css": "css",
    },
    define: {
      "process.env.NODE_ENV": '"development"',
    },
  });
  console.log("✅ Client bundle created successfully!");

  // 3. Bundle Server Application
  console.log("⚙️ Bundling standalone Node server application...");
  await esbuild.build({
    entryPoints: [path.join(__dirname, "../src/server/app.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    sourcemap: true,
    outfile: path.join(__dirname, "../dist/server.js"),
    plugins: [serverAliasPlugin],
    external: ["@prisma/client"],
  });
  console.log("✅ Server application compiled successfully!");

  // 4. Bundle Load Test Suite
  if (fs.existsSync(path.join(__dirname, "load-test.ts"))) {
    await esbuild.build({
      entryPoints: [path.join(__dirname, "load-test.ts")],
      bundle: true,
      platform: "node",
      target: "node18",
      format: "cjs",
      outfile: path.join(__dirname, "../dist/load-test.js"),
      plugins: [serverAliasPlugin],
    });
    console.log("✅ Load test suite bundled successfully!");
  }
}

build().catch((err) => {
  console.error("❌ Build error:", err);
  process.exit(1);
});
