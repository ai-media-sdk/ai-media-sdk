import path from "node:path";
import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "src");
const uiSrc = path.resolve(__dirname, "../../packages/ui/src");

/**
 * A single `VITE_SITE_BASE` variable drives both the Vite asset base and
 * (via `import.meta.env.BASE_URL`) the Router basename, so the two can never
 * drift. Defaults to root deployment; set `VITE_SITE_BASE=/<repo>/` for a
 * GitHub Pages project site. Local dev always uses the root path; `vite
 * preview` resolves its config with `command: "serve"` too, so it is
 * distinguished by the production mode and keeps the deployment base.
 */
export default defineConfig(({ command, mode }) => {
  const base =
    command === "serve" && mode !== "production"
      ? "/"
      : (process.env.VITE_SITE_BASE ?? "/");

  return {
    base,
    plugins: [
      {
        enforce: "pre",
        ...mdx({
          include: /src\/content\/docs\/.*\.(md|mdx)$/,
          remarkPlugins: [
            remarkGfm,
            remarkFrontmatter,
            [remarkMdxFrontmatter, { name: "frontmatter" }],
          ],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypePrettyCode,
              {
                theme: { light: "github-light", dark: "github-dark" },
                langs: ["ts", "tsx", "bash", "json", "yaml", "mdx"],
                grid: false,
              },
            ],
          ],
        }),
      },
      react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: srcDir },
        {
          find: "@workspace/ui/globals.css",
          replacement: path.resolve(uiSrc, "styles/globals.css"),
        },
        {
          find: /^@workspace\/ui\/(.+)$/,
          replacement: `${uiSrc}/$1`,
        },
      ],
    },
    build: { outDir: "dist" },
    server: { port: 5175 },
  };
});
