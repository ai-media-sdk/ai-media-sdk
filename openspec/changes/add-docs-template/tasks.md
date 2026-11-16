# Tasks: add-docs-template

## 1. Workspace 与模板骨架

- [x] 1.1 根 package.json workspaces 增加 `templates/*`
- [x] 1.2 创建 templates/docs/package.json（name: docs-template；dev/build/preview/typecheck/test 脚本；@workspace/ui 与 @workspace/typescript-config 用 workspace:*，其余 semver 与 apps/site 对齐；dev 端口 5175）
- [x] 1.3 创建 tsconfig.json（extend @workspace/typescript-config/base.json，paths 仅 @ 与 @workspace/ui）、postcss.config.mjs、components.json、index.html、src/main.tsx、src/vite-env.d.ts
- [x] 1.4 创建 vite.config.ts（MDX 管线与别名复用站点模式，base 由 VITE_SITE_BASE 驱动默认 /）
- [x] 1.5 bun install 更新 lockfile

## 2. 站点配置与基础 lib

- [x] 2.1 创建 src/lib/site-config.ts（站点名、storage key 前缀、SUPPORTED_LANGS/DEFAULT_LANG/LANG_LABELS）
- [x] 2.2 移植 src/lib/locale.ts（从 site-config 派生语言集，保留检测/持久化纯函数）
- [x] 2.3 移植 src/lib/i18n（DeepStrings 校验）与 src/locales/{zh,en}.json（仅模板所需键：docs.*、common.appName、langSwitcher.aria、meta.title、主题切换键）
- [x] 2.4 移植 src/lib/docs/page-metadata（站点名改由 site-config 驱动）与 src/lib/docs/mdx-types

## 3. 内容加载与导航

- [x] 3.1 移植 src/lib/docs/content-loader：单个 import.meta.glob 按路径首段切分语言，语言目录与配置语言集一致性校验，保留 zod frontmatter 构建期校验
- [x] 3.2 移植 src/lib/docs/navigation 与 src/lib/docs/paths（buildNav/flattenNav/getAdjacentDocs/buildDocPath）
- [x] 3.3 创建示例 src/content/docs/manifest.ts（gettingStarted: introduction/quick-start；resources: faq/roadmap）

## 4. 组件层

- [x] 4.1 移植 src/components/layout/page-container 与 src/components/providers（theme-provider，去掉 sonner/tooltip 等非必需包装或按需保留）
- [x] 4.2 移植 src/components/language-switcher
- [x] 4.3 创建 src/components/docs-header（品牌名来自配置 + 语言切换 + 主题切换，无业务链接）
- [x] 4.4 移植 7 个通用文档组件：docs-layout（增加 header?: ReactNode 插槽，默认 DocsHeader）、docs-sidebar、docs-toc、docs-breadcrumb、docs-pagination、code-block、mdx-components（保留可合并的基础映射导出）

## 5. 路由与文档页

- [x] 5.1 创建 src/app.tsx（LangLayout、basename 推导、/ → /:lang/docs、/docs* 遗留重定向、/:lang/docs 与 /:lang/docs/*）
- [x] 5.2 移植 src/pages/docs（四种状态解析、ScrollReset、元数据注入、MDX_COMPONENTS 合并扩展点）

## 6. 样式与示例内容

- [x] 6.1 移植 src/styles/docs.css（排版 + Shiki 双主题）
- [x] 6.2 编写示例文档 zh/en introduction、zh/en quick-start（覆盖代码块 ts/bash、表格、引用块、内链、多级标题）
- [x] 6.3 编写 zh faq（仅中文，演示未翻译占位）与 zh roadmap（draft，演示草稿占位），正文标注"模板示例，请替换"

## 7. 内容一致性测试

- [x] 7.1 创建 tests/docs-content.test.ts：manifest ↔ zh 双向一致、slug 唯一、en 子集无游离、全部 frontmatter 合法（文件系统级，剔除全部业务断言）

## 8. README 复用指南

- [x] 8.1 编写 templates/docs/README.md：前置依赖（@workspace/ui 随模板复用）、应用步骤、定制点清单（站点名/语言集/主题/页头/MDX 组件）、排除的业务部分与来源说明

## 9. 验证与提交

- [x] 9.1 bun run lint、bun run typecheck、bun run build、bun run test 全部通过
- [x] 9.2 模板 dev 冒烟：双语切换、侧栏/TOC/面包屑/翻页、代码复制与主题切换、draft/未翻译/404 状态、移动端抽屉、/docs 遗留重定向
- [x] 9.3 复查 diff（apps/site 零改动），在 main 提交