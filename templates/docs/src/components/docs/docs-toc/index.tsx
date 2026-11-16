import { ScrollArea } from "@workspace/ui/components/shadcn/scroll-area";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface TocItem {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
}

/**
 * Active-section threshold: aligned with the article's `scroll-margin-top`
 * (4rem) plus a small allowance for the sticky header area.
 */
const ACTIVE_OFFSET = 96;

/** Safety release for the click lock if the smooth scroll never settles. */
const LOCK_TIMEOUT_MS = 1500;

/**
 * Right-hand table of contents: collects `h2[id]`/`h3[id]` anchors (added
 * by rehype-slug at build time) from the rendered article on mount, and
 * tracks the section currently at the top of the viewport while scrolling
 * (rAF-throttled scroll spy). Clicking an item locks the highlight to the
 * target during the programmatic smooth scroll so intermediate sections
 * don't flash; the lock releases on arrival, user input, or a timeout.
 * The parent keys this component by `lang/slug`, so it remounts per doc
 * and re-collects without stale state.
 */
export function DocsToc() {
  const [items, setItems] = useState<readonly TocItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const lockRef = useRef<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const article = document.querySelector("article.docs-article");
    if (!article) return;
    const headings = [
      ...article.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]"),
    ];
    setItems(
      headings.map((el) => ({
        id: el.id,
        text: el.textContent ?? "",
        level: el.tagName === "H2" ? 2 : 3,
      }))
    );

    function update() {
      const locked = lockRef.current;
      if (locked) {
        const target = document.getElementById(locked);
        const arrived =
          !target || target.getBoundingClientRect().top <= ACTIVE_OFFSET;
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
        if (arrived || atBottom) {
          lockRef.current = null;
        } else {
          setActiveId(locked);
          return;
        }
      }
      let current = "";
      for (const el of headings) {
        if (el.getBoundingClientRect().top <= ACTIVE_OFFSET) {
          current = el.id;
        } else {
          break;
        }
      }
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom && headings.length > 0) {
        current = headings[headings.length - 1]?.id ?? current;
      }
      setActiveId(current || (headings[0]?.id ?? ""));
    }

    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    }
    function releaseLock() {
      lockRef.current = null;
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // User-initiated scrolling interrupts a programmatic smooth scroll.
    window.addEventListener("wheel", releaseLock, { passive: true });
    window.addEventListener("touchmove", releaseLock, { passive: true });
    window.addEventListener("keydown", releaseLock);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", releaseLock);
      window.removeEventListener("touchmove", releaseLock);
      window.removeEventListener("keydown", releaseLock);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (items.length === 0) return null;

  function handleClick(item: TocItem) {
    lockRef.current = item.id;
    setActiveId(item.id);
    window.setTimeout(() => {
      if (lockRef.current === item.id) lockRef.current = null;
    }, LOCK_TIMEOUT_MS);
    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav aria-label={t("docs.toc")}>
      <p className="px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("docs.toc")}
      </p>
      <ScrollArea className="mt-2 max-h-[calc(100svh-10rem)]">
        <ul className="flex flex-col gap-1 border-border border-l pb-4">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={active ? "location" : undefined}
                  onClick={() => handleClick(item)}
                  className={cn(
                    "block w-full border-l-2 py-0.5 pl-3 text-left text-xs leading-5 transition",
                    item.level === 3 && "pl-6",
                    active
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {item.text}
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </nav>
  );
}
