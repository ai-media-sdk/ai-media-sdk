# Design: add-docs-template

## Context

动机见 proposal.md。`apps/site` 文档区由六层组成：7 个通用文档组件、2 个业务组件（provider-model-table/capability-badges）、`lib/docs` 逻辑层（content-loader/navigation/paths/mdx-types/page-metadata + 业务的 model-projection）、MDX 构建管线（vite.config.ts + styles/docs.css）、内容与路由（manifest、zh/en MDX、`/:lang` 路由、i18n）、内容一致性测试。约束：保留 `@workspace/ui` 依赖（用户决策）；`apps/site` 零改动；TypeScript 7（tsgo）+ Biome + turbo 的仓库工具链；shadcn 组件统一留在 `packages/ui`。

## Goals / Non-Goals

**Goals:**

- 模板目录拷入采用相同共享 UI 体系的仓库后，改配置与内容即可运行。
- 通用骨架与业务代码的边界在代码层面清晰（扩展点而非硬编码）。
- 模板随根级 turbo 任务持续验证，不腐坏。

**Non-Goals:**

- 不做完全自包含（不 vendor shadcn 组件）；不做共享包让 `apps/site` 反向消费。
- 不迁移 `apps/site` 现有代码；不追求模板与站点长期同步。
- 不提供 SSR/SSG、搜索、版本化文档等高级文档站特性。

## Decisions

### D1: 模板形态 —— workspaces 内的标准子应用

`templates/docs` 作为 workspace 成员（根 workspaces 增加 `templates/*`），package.json 除 `@workspace/ui`、`@workspace/typescript-config` 用 `workspace:*` 外全部 semver。turbo 现有 task 定义不变即自动覆盖模板。备选：完全自包含拷贝模板（用户否决，维护两套 UI）；`packages/docs-kit` 共享库（版本化与 API 设计成本高，且站点不消费，收益低）。

### D2: UI 与构建配置复用站点模式

vite.config.ts 沿用 `apps/site` 的别名模式（`@` → src，`@workspace/ui/*` → `../../packages/ui/src/*`）与 MDX 插件挂接方式（`enforce: "pre"`，remark-gfm/frontmatter/mdx-frontmatter + rehype-slug/pretty-code，shiki 双主题）。tsconfig extend `@workspace/typescript-config/base.json`，paths 只保留 `@` 与 `@workspace/ui`。components.json 与站点一致指向 `packages/ui`（遵守仓库 shadcn 规则）。postcss 配置同站点。备选：模板内联全部编译选项与组件（与"保留 @workspace/ui"决策矛盾）。

### D3: 页头解耦 —— 插槽 + 极简默认头

`DocsLayout` 增加 `header?: ReactNode` 属性，默认渲染模板自带的 `DocsHeader`（品牌名来自站点配置 + LanguageSwitcher + ThemeSwitcher，样式沿用 SiteHeader 的边框条形态，但去掉 playground/landing/GitHub 业务链接）。LanguageSwitcher 从站点拷贝（其逻辑已是纯语言段替换，无业务耦合）。PageContainer 随模板拷贝（含 wide 变体，文档区用 wide）。备选：保留 SiteHeader（带入业务导航，违背隔离要求）。

### D4: 站点配置收敛与语言集可配置

新增 `lib/site-config.ts`：站点名（page-metadata 后缀与默认标题）、localStorage key 前缀、`SUPPORTED_LANGS`/`DEFAULT_LANG`/`LANG_LABELS`。`lib/locale.ts` 改为从配置派生（保留纯函数与检测/持久化逻辑）。content-loader 由 zh/en 两个写死 glob 改为单个 `import.meta.glob("../../content/docs/**/*.mdx")`，按路径首段切分语言，语言目录与配置语言集一致性在加载时校验。`SiteLang` 类型由配置的语言集派生。备选：保持双 glob（加语言要改加载器代码，违背可配置要求）。

### D5: 路由与部署形态沿用站点成熟模式

保留 LangLayout（语言校验、i18n 同步、document.lang、非法语言段重定向）、basename 由 `import.meta.env.BASE_URL` 推导（含自定义域名根路径回退）、`/docs*` 遗留重定向、ScrollReset。根路径重定向到 `/:lang/docs`（模板无 landing）。base 环境变量默认 `/`（不像站点写死 `/ai-media-sdk/`），子路径部署时显式设置。备选：简化掉 basename 推导（损失 GH Pages 深链能力，spec 要求保留）。

### D6: 示例内容覆盖全部渲染状态

manifest 两组四篇：gettingStarted（introduction、quick-start，zh/en 齐全）、resources（faq 仅 zh → 演示未翻译占位；roadmap zh 且 draft → 演示草稿占位）。quick-start 覆盖代码块（ts/bash）、表格、引用块、内链；introduction 覆盖标题层级（TOC）。示例内容为模板自身说明文字，不含任何 SDK 业务内容。备选：只放两篇双语文档（draft/未翻译状态无示例，复用者难以验证）。

### D7: i18n 与测试裁剪

locales 只保留模板用到的键：`docs.*` 全量、`common.appName`、`langSwitcher.aria`、`meta.title`、主题切换相关键；保留 zh 为源、en 经 `DeepStrings` 结构校验的模式。测试移植 `docs-content.test.ts` 的文件系统级通用断言（manifest ↔ zh 双向一致、en 子集、frontmatter 校验），剔除 SDK 导出快照、Provider 七段式、音频内容等业务断言。frontmatter 构建期校验仍由 content-loader 的 zod 在模块初始化抛错实现。

### D8: MDX 扩展点

`mdx-components` 保留 `DocsLangProvider`/`useDocsLang` 与基础映射导出；文档页渲染处以 `{ ...MDX_COMPONENTS, ...customComponents }` 形式合并（模板内 custom 为空对象并注释指引），README 写明业务组件（如站点 ProviderModelTable 一类）的注入方式。备选：context 注入自定义映射（多一层间接，当前无必要）。

### D9: TOC 滚动高亮（交付后测试反馈补充）

站点原 DocsToc 无 scroll spy，交付测试发现滚动时右侧目录不跟随高亮。模板补充：rAF 节流的 passive scroll/resize 监听，按 `getBoundingClientRect().top <= 96px`（对齐文章 `scroll-margin-top: 4rem` 加页头余量）取最后一个越线标题为当前章节；页底（scrollHeight - 2 容差）回退最后一节；顶部未越线时高亮第一节。点击条目立即 setActive 并加"程序化滚动锁"，平滑滚动期间高亮锁定目标（避免途经章节闪烁），到达/页底/用户 wheel·touch·keydown 打断/1.5s 超时后释放；`aria-current="location"` 标注。备选：IntersectionObserver（快滚/超高标题的边界处理更繁琐）；不修复（违背 TOC 可用性预期）。仅改模板，`apps/site` 不动。

## Risks / Trade-offs

- [模板与站点代码漂移] → 一次性抽取为既定决策；README 记录来源（apps/site 对应目录），后续改进各自独立提交。
- [复用到无 @workspace/ui 的仓库不可直接运行] → README 将"随模板带走 packages/ui（及 typescript-config）或目标仓库采用相同布局"列为前置条件。
- [content-loader 单 glob 误收非语言目录文件] → 加载时校验首段必须属于配置语言集，否则抛错指明文件。
- [模板被根级任务拖累或拖累根级任务] → 模板依赖面与站点文档区一致（无 SDK 依赖），构建轻量；端口 5175 避免与站点 dev 冲突。
- [示例内容被误当业务文档拷贝] → 示例文档正文明确标注"模板示例，请替换"。

## Implementation Notes（实施记录，2026-11-16）

相对设计的微调与抽取时修复的站点 inherited 问题：

1. **LangLayout 标题 effect 移除**：站点 LangLayout 在语言切换时会以 `meta.title` 覆盖文档标题（effect 顺序：子先父后）。模板所有页面均经 `usePageMetadata` 注入标题，故移除该 effect 与 `meta.title` 字典键，语言切换后文档标题保持正确。
2. **锚点深链解码**：`location.hash` 对中文标题 id 为百分号编码，站点 ScrollReset 直接 `getElementById(hash.slice(1))` 导致 CJK 锚点深链定位失败。模板改为 `decodeURIComponent`（含 malformed 回退）。
3. **shiki 预载语言**：示例 quick-start 使用 ```mdx 围栏，`langs` 列表增加 `mdx`。
4. **postbuild 严格类型**：模板 tsconfig 将 `scripts/` 纳入 typecheck（站点未纳入），`match[1]` 在 `noUncheckedIndexedAccess` 下补 `?? ""`。
5. 冒烟验证（chrome-devtools，dev 5175）：根/语言索引重定向、双语切换保持 slug、侧边栏 draft/未翻译排除、TOC/锚点深链、代码复制反馈、暗色 Shiki 配色、移动端抽屉、/docs 遗留重定向、四种状态页元数据——全部通过；控制台无错误/警告。

## Migration Plan

纯新增：创建 `templates/docs/`、根 workspaces 增加 `templates/*`、`bun install` 更新 lockfile。验证顺序：`bun run lint` → `typecheck` → `build` → `test`，再模板 dev 冒烟（双语切换、侧栏/TOC/翻页、代码复制、draft/未翻译/404 状态、移动端抽屉）。回滚：删除模板目录与 workspace 条目即可，无其他影响。