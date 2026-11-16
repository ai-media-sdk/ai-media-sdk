import type { ComponentType } from "react";
import { z } from "zod";

import { DOC_GROUPS } from "@/content/docs/manifest";
import type { MdxComponents } from "@/lib/docs/mdx-types";
import { isSupportedLang, type SiteLang, SUPPORTED_LANGS } from "@/lib/locale";

/**
 * Docs content loading: eager-collects all per-language MDX modules with a
 * single glob, splits them by the first path segment (the language directory),
 * derives slugs from the remaining path, and validates frontmatter with zod
 * at module init so invalid docs fail the build/tests instead of rendering.
 * Adding a language only requires a new `content/docs/<lang>/` tree plus the
 * `SUPPORTED_LANGS` entry in site-config.
 */

export const docFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  draft: z.boolean().optional(),
});

export type DocFrontmatter = z.infer<typeof docFrontmatterSchema>;

export interface LoadedDoc {
  readonly lang: SiteLang;
  readonly slug: string;
  readonly frontmatter: DocFrontmatter;
  readonly Content: ComponentType<{ components?: MdxComponents }>;
}

interface RawDocModule {
  default: ComponentType<{ components?: MdxComponents }>;
  frontmatter?: unknown;
}

const MODULES = import.meta.glob("../../../content/docs/**/*.mdx", {
  eager: true,
});

const CONTENT_PREFIX = "../../../content/docs/";

function parseFrontmatter(path: string, raw: unknown): DocFrontmatter {
  const parsed = docFrontmatterSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid doc frontmatter in ${path}: ${issues}`);
  }
  return parsed.data;
}

function loadAll(): ReadonlyMap<SiteLang, ReadonlyMap<string, LoadedDoc>> {
  const byLang = new Map<SiteLang, Map<string, LoadedDoc>>();
  for (const lang of SUPPORTED_LANGS) byLang.set(lang, new Map());

  for (const [path, mod] of Object.entries(MODULES)) {
    if (!path.startsWith(CONTENT_PREFIX)) {
      throw new Error(`Unexpected docs content path: ${path}`);
    }
    const relative = path.slice(CONTENT_PREFIX.length);
    const slash = relative.indexOf("/");
    const lang = slash === -1 ? "" : relative.slice(0, slash);
    if (!isSupportedLang(lang)) {
      throw new Error(
        `Docs content language directory "${lang}" is not in SUPPORTED_LANGS (${path}); add it to site-config or move the file.`
      );
    }
    const slug = relative.slice(slash + 1).replace(/\.mdx?$/, "");
    const raw = mod as RawDocModule;
    byLang.get(lang)?.set(slug, {
      lang,
      slug,
      frontmatter: parseFrontmatter(path, raw.frontmatter),
      Content: raw.default,
    });
  }
  return byLang;
}

const DOCS_BY_LANG = loadAll();

export function getDoc(lang: SiteLang, slug: string): LoadedDoc | undefined {
  return DOCS_BY_LANG.get(lang)?.get(slug);
}

export function docExists(lang: SiteLang, slug: string): boolean {
  return DOCS_BY_LANG.get(lang)?.has(slug) === true;
}

/** Loaded slugs for a language, sorted; test/consistency checks use this. */
export function listDocSlugs(lang: SiteLang): readonly string[] {
  return [...(DOCS_BY_LANG.get(lang)?.keys() ?? [])].sort();
}

/** Slugs declared in the manifest, in navigation order. */
export function listManifestSlugs(): readonly string[] {
  return DOC_GROUPS.flatMap((group) => [...group.slugs]);
}
