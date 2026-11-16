import { ThemeSwitcher } from "@workspace/ui/components/custom/theme-switcher";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { LanguageSwitcher } from "@/components/language-switcher";
import { PageContainer } from "@/components/layout/page-container";
import type { SiteLang } from "@/lib/locale";
import { SITE_NAME } from "@/lib/site-config";

/**
 * Minimal default docs header: brand (from site-config), language switcher,
 * and theme switcher. No product navigation — pass a custom `header` node
 * to DocsLayout to replace it with your project's own site header.
 */
export function DocsHeader({ lang }: { readonly lang: SiteLang }) {
  const { t } = useTranslation();

  return (
    <header className="border-border border-b bg-card py-3">
      <PageContainer
        wide
        className="flex min-h-10 items-center justify-between gap-4"
      >
        <Link
          to={`/${lang}/docs`}
          className="shrink-0 font-semibold text-foreground text-xs uppercase tracking-[0.24em]"
        >
          {SITE_NAME}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher
            ariaLabel={t("theme.aria")}
            labels={{
              light: t("theme.light"),
              system: t("theme.system"),
              dark: t("theme.dark"),
            }}
          />
        </div>
      </PageContainer>
    </header>
  );
}
