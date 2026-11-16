import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { DOC_GROUPS } from "@/content/docs/manifest";
import { SOURCE_LANG, SUPPORTED_LANGS } from "@/lib/site-config";

/**
 * Docs content consistency checks. Runs at the file-system level so bun
 * test never has to compile MDX; frontmatter build-time validation is
 * enforced by the content loader's zod schema at module init.
 */

const DOCS_DIR = path.resolve(import.meta.dirname, "../src/content/docs");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  draft: z.boolean().optional(),
});

function listMdxSlugs(lang: string): string[] {
  const root = path.join(DOCS_DIR, lang);
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".mdx")) {
        out.push(path.relative(root, full).replace(/\.mdx$/, ""));
      }
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort();
}

function readDoc(lang: string, slug: string): string {
  return readFileSync(path.join(DOCS_DIR, lang, `${slug}.mdx`), "utf8");
}

/** Minimal YAML-subset parser for the flat frontmatter shape docs use. */
function parseFrontmatter(source: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  if (!match?.[1]) return {};
  const out: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value === "true") out[key] = true;
    else if (value === "false") out[key] = false;
    else out[key] = value;
  }
  return out;
}

const MANIFEST_SLUGS = DOC_GROUPS.flatMap((group) => [...group.slugs]).sort();
const SOURCE_SLUGS = listMdxSlugs(SOURCE_LANG);
const OTHER_LANGS = SUPPORTED_LANGS.filter((lang) => lang !== SOURCE_LANG);

describe(`manifest ↔ ${SOURCE_LANG} file consistency`, () => {
  test("every manifest slug has a source-language file", () => {
    const missing = MANIFEST_SLUGS.filter(
      (slug) => !SOURCE_SLUGS.includes(slug)
    );
    expect(missing).toEqual([]);
  });

  test("every source-language file appears in the manifest", () => {
    const orphan = SOURCE_SLUGS.filter(
      (slug) => !MANIFEST_SLUGS.includes(slug)
    );
    expect(orphan).toEqual([]);
  });

  test("manifest slugs are unique", () => {
    expect(new Set(MANIFEST_SLUGS).size).toBe(MANIFEST_SLUGS.length);
  });
});

describe("multilingual structure", () => {
  for (const lang of OTHER_LANGS) {
    const slugs = listMdxSlugs(lang);

    test(`${lang} files are a subset of the manifest (no orphan files)`, () => {
      const orphan = slugs.filter((slug) => !MANIFEST_SLUGS.includes(slug));
      expect(orphan).toEqual([]);
    });

    test(`every ${lang} slug also exists in ${SOURCE_LANG} (source language)`, () => {
      const missingSource = slugs.filter(
        (slug) => !SOURCE_SLUGS.includes(slug)
      );
      expect(missingSource).toEqual([]);
    });
  }
});

describe("frontmatter validation", () => {
  for (const lang of SUPPORTED_LANGS) {
    for (const slug of listMdxSlugs(lang)) {
      test(`${lang}/${slug} has valid frontmatter`, () => {
        const parsed = frontmatterSchema.safeParse(
          parseFrontmatter(readDoc(lang, slug))
        );
        if (!parsed.success) {
          throw new Error(
            `Invalid frontmatter in ${lang}/${slug}.mdx: ${parsed.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("; ")}`
          );
        }
      });
    }
  }
});
