/**
 * Single structural source of truth for the docs area: group ids plus doc
 * slugs in reading order. Language-neutral — titles live in each doc's
 * frontmatter, group labels resolve via i18n `docs.groups.<id>`, and the
 * per-language content directories mirror this exact slug set (the source
 * language must be complete; other languages may lag behind).
 *
 * Template sample structure — replace with your own groups and slugs.
 */

export type DocGroupId = "gettingStarted" | "resources";

export interface DocGroup {
  /** i18n key segment: resolved as `docs.groups.<id>`. */
  readonly id: DocGroupId;
  /** Doc slugs (path relative to the language dir) in reading order. */
  readonly slugs: readonly string[];
}

export const DOC_GROUPS: readonly DocGroup[] = [
  { id: "gettingStarted", slugs: ["introduction", "quick-start"] },
  { id: "resources", slugs: ["faq", "roadmap"] },
];
