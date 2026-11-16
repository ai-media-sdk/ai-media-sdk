/**
 * Single place to rebrand and reconfigure the template when applying it to
 * a new project: site name, locale storage namespace, and the supported
 * language set. Routing, content loading, and i18n all derive from these
 * values — no component code needs to change.
 */

/** Appended to document titles and used as the default title. */
export const SITE_NAME = "Docs Template";

/** localStorage key prefix; change per project to avoid collisions. */
export const STORAGE_PREFIX = "docs-template";

/** Supported UI languages; each needs a `src/content/docs/<lang>/` tree. */
export const SUPPORTED_LANGS = ["zh", "en"] as const;

export type SiteLang = (typeof SUPPORTED_LANGS)[number];

/** Default language; fallback for unsupported URL segments. */
export const DEFAULT_LANG: SiteLang = "en";

/**
 * Source language of the docs content: its file set must match the manifest
 * exactly; other languages may lag behind (missing file = untranslated).
 */
export const SOURCE_LANG: SiteLang = "zh";

export const LANG_LABELS: Readonly<Record<SiteLang, string>> = {
  zh: "中文",
  en: "EN",
};
