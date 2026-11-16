/**
 * Locale resolution for the docs site. Pure functions only (no i18next
 * import) so detection/persistence can be unit tested and reused by the
 * router before the i18n instance exists. The language set itself lives in
 * `site-config` so the template can be reconfigured in one place.
 */

import {
  DEFAULT_LANG,
  LANG_LABELS,
  type SiteLang,
  STORAGE_PREFIX,
  SUPPORTED_LANGS,
} from "@/lib/site-config";

export { DEFAULT_LANG, LANG_LABELS, type SiteLang, SUPPORTED_LANGS };

const LOCALE_STORAGE_KEY = `${STORAGE_PREFIX}.lang.v1`;

export function isSupportedLang(value: unknown): value is SiteLang {
  return (
    typeof value === "string" &&
    (SUPPORTED_LANGS as readonly string[]).includes(value)
  );
}

export function readStoredLang(): SiteLang | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isSupportedLang(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function storeLang(lang: SiteLang): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  } catch {
    // Storage may be unavailable (private mode/quota); the URL segment still
    // carries the language for the current session.
  }
}

/**
 * Map browser languages to a supported language: the first supported code
 * that matches the primary browser language (exact or prefix, e.g. `zh-CN`
 * → `zh`) wins; otherwise fall back to the default.
 */
export function detectBrowserLang(languages: readonly string[]): SiteLang {
  const primary = languages[0]?.toLowerCase() ?? "";
  for (const lang of SUPPORTED_LANGS) {
    if (primary === lang || primary.startsWith(`${lang}-`)) return lang;
  }
  return DEFAULT_LANG;
}

/**
 * Initial locale for the root redirect and i18n boot: stored choice >
 * browser language > default.
 */
export function detectInitialLang(): SiteLang {
  const stored = readStoredLang();
  if (stored) return stored;
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    return detectBrowserLang(navigator.languages ?? []);
  }
  return DEFAULT_LANG;
}
