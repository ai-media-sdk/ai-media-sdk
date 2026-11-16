# Docs Template

可复用的双语文档站子应用模板，抽取自 `apps/site` 的文档区（通用骨架，
不含任何业务代码）。Vite + React + MDX：manifest 驱动导航、frontmatter
元数据自动化、侧边栏/TOC/面包屑/翻页、代码高亮与一键复制、明暗主题、
`/:lang` 双语路由与 GitHub Pages 深链兼容。

## 前置依赖

模板依赖本仓库的共享 UI 体系，**不能单独拷走运行**：

- `packages/ui`（`@workspace/ui`：shadcn 组件、`cn`、Tailwind v4 主题 tokens）
- `packages/typescript-config`（`@workspace/typescript-config`）

应用到其他项目时，需将这两个包随模板一并拷贝，或目标仓库已采用相同的
workspace 布局与别名约定。模板自身不含 SDK/Provider 等业务依赖。

## 应用到新项目

1. **拷贝**：将 `templates/docs/` 拷入目标仓库（如 `apps/docs/`），连同
   `packages/ui` 与 `packages/typescript-config`（若目标仓库尚无）。
2. **改名与配置**：修改 `package.json` 的 `name`；在
   `src/lib/site-config.ts` 中设置站点名、localStorage key 前缀、语言集
   与源语言；同步 `index.html` 的 `<title>`。
3. **替换内容**：重写 `src/content/docs/manifest.ts` 的分组与 slug，
   替换 `src/content/docs/<lang>/` 下的示例 MDX，更新
   `src/locales/*.json` 的 `docs.groups.<id>` 分组文案。
4. **校验与构建**：`bun install` 后运行 typecheck/test/build（见下）。
5. **部署**：产物在 `dist/`（含 `404.html` SPA 深链回退）。根路径部署无需
   配置；GitHub Pages 项目站设置 `VITE_SITE_BASE=/<repo>/` 后构建，
   资源 base 与 Router basename 由同一变量驱动，不会漂移。

## 本地命令

```bash
bun run --cwd templates/docs dev        # http://localhost:5175
bun run --cwd templates/docs typecheck
bun run --cwd templates/docs test
bun run --cwd templates/docs build
bun run --cwd templates/docs preview
```

模板已纳入根 workspaces 与 turbo：根级 `bun run lint / typecheck / build /
test` 会一并验证模板。

## 定制点

| 定制点 | 位置 |
| --- | --- |
| 站点名 / 存储 key / 语言集 / 源语言 | `src/lib/site-config.ts` |
| 文档分组与阅读顺序 | `src/content/docs/manifest.ts` |
| 界面文案（含分组标签） | `src/locales/*.json` |
| 主题 tokens | `packages/ui/src/styles/globals.css` |
| 文章排版 / 代码高亮配色 | `src/styles/docs.css` |
| 页头 | `DocsLayout` 的 `header` 属性（默认 `DocsHeader`） |
| MDX 元素映射 | `src/components/docs/mdx-components/` |
| shadcn 组件增补 | `bunx shadcn@latest add <component>`（装入 `packages/ui`） |

### 语言集

默认 zh/en，中文为源语言（文件必须与 manifest 双向一致）；其他语言允许
缺失，缺失即"未翻译"：排除出该语言导航，直接访问渲染占位页。新增语言：
`SUPPORTED_LANGS` 加语言代码 → 建 `content/docs/<lang>/` 目录 → 加
`locales/<lang>.json` 并在 `src/lib/i18n/` 注册字典。内容加载器按路径首段
自动切分语言，无需改动。

### 扩展点：自定义页头

```tsx
<DocsLayout lang={lang} slug={slug} header={<MySiteHeader lang={lang} />}>
  {children}
</DocsLayout>
```

### 扩展点：自定义 MDX 组件

在 `src/pages/docs/index.tsx` 的映射处合并业务组件：

```tsx
const mdxComponents: MdxComponents = { ...MDX_COMPONENTS, MyWidget };
```

之后即可在 MDX 正文中直接使用 `<MyWidget />`。`apps/site` 的
`ProviderModelTable`（数据驱动模型表）即通过该方式接入，未进入模板。

## 示例内容说明

示例文档（introduction / quick-start / faq / roadmap）仅用于演示渲染
路径，应用到新项目时全部替换：

- `faq` 刻意只有中文版本 → 演示英文"未翻译"占位页；
- `roadmap` 标记 `draft: true` → 演示草稿占位页与导航排除。

## 来源与边界

一次性抽取自 `apps/site`（组件 `src/components/docs/`、逻辑
`src/lib/docs/`、MDX 管线 `vite.config.ts`、样式 `src/styles/docs.css`、
测试 `tests/docs-content.test.ts` 的通用部分）。明确排除：
`provider-model-table`、`capability-badges`、`model-projection`、
`SiteHeader`、playground/landing、业务 MDX 与 SDK 相关测试断言。
模板与 `apps/site` 后续各自演进，不做自动同步。