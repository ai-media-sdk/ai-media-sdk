import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useParams,
} from "react-router-dom";

import { AppProviders } from "@/components/providers";
import "@/lib/i18n";
import {
  DEFAULT_LANG,
  detectInitialLang,
  isSupportedLang,
  storeLang,
} from "@/lib/locale";
import { DocsIndexPage, DocsPage, LegacyDocsRedirect } from "@/pages/docs";

/**
 * Derive the Router basename from the Vite asset base so the two can never
 * drift (GitHub Pages serves the site under `/<repo>/`). A custom domain
 * mounts the same artifact at the root path, so the basename collapses to an
 * empty string whenever the current pathname is not under the asset base.
 * Root deployments yield an empty basename. The language segment lives inside
 * the basename.
 */
function deriveBasename(): string {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");
  if (base === "") return "";
  const { pathname } = window.location;
  return pathname === base || pathname.startsWith(`${base}/`) ? base : "";
}

/**
 * Root redirect: resolve the visitor language (stored choice > browser
 * language > default) and land on the matching locale docs area.
 */
function RootRedirect() {
  return <Navigate to={`/${detectInitialLang()}/docs`} replace />;
}

/**
 * Language layout: validates the `:lang` segment, applies it to i18n and
 * the document language attribute. Unsupported segments redirect to the
 * default language while keeping the remaining path. Page titles are owned
 * by usePageMetadata (every page calls it), so no title effect here — it
 * would clobber the doc title on language switches.
 */
function LangLayout() {
  const params = useParams();
  const location = useLocation();
  const { i18n } = useTranslation();
  const lang = params.lang;
  const valid = isSupportedLang(lang);

  useEffect(() => {
    if (!valid) return;
    void i18n.changeLanguage(lang);
    storeLang(lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  }, [valid, lang, i18n]);

  if (!valid) {
    const rest = location.pathname.slice(`/${lang ?? ""}`.length);
    return <Navigate to={`/${DEFAULT_LANG}${rest}`} replace />;
  }
  return <Outlet />;
}

const router = createBrowserRouter(
  [
    { path: "/", element: <RootRedirect /> },
    { path: "/docs", element: <LegacyDocsRedirect /> },
    { path: "/docs/*", element: <LegacyDocsRedirect /> },
    {
      path: "/:lang",
      element: <LangLayout />,
      children: [
        { index: true, element: <DocsIndexPage /> },
        { path: "docs", element: <DocsIndexPage /> },
        { path: "docs/*", element: <DocsPage /> },
      ],
    },
    { path: "*", element: <RootRedirect /> },
  ],
  { basename: deriveBasename() }
);

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
