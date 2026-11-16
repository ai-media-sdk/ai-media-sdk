# Proposal: add-docs-template（从 apps/site 抽取可复用文档站子应用模板）

## Why

`apps/site` 的文档子系统（MDX 编译管线、manifest 驱动导航、双语内容加载与校验、文档布局组件）是一套通用文档站骨架，但目前与站点业务耦合（SiteHeader、Provider 模型表、playground registry、业务 MDX 内容）。后续为其他项目搭建文档站时，只能从 `apps/site` 拷贝再手工剥离业务代码，易错且低效。需要将其沉淀为一个可直接复用的子应用模板。

## What Changes

- 新增 `templates/docs/` 最小双语文档站子应用模板（Vite + React + MDX）：文档布局（侧边栏/TOC/面包屑/翻页/代码块/MDX 元素映射）、manifest 驱动的内容加载与导航、`/:lang` 双语路由与 i18n、示例内容与内容一致性测试，可独立 dev/build/typecheck/test。
- 相对 `apps/site` 实现的通用化改造：`DocsLayout` 的 `SiteHeader` 硬编码改为 header 插槽 + 配置驱动的极简默认头；站点名、localStorage key 前缀、支持语言集收敛到 `site-config`；content-loader 由 zh/en 两个写死 glob 改为单个 glob 按路径首段切分语言。
- 业务部分不进模板：`provider-model-table`、`capability-badges`、`model-projection`、`SiteHeader`、playground/landing、真实业务 MDX 与 SDK 相关测试断言全部排除；README 说明自定义 MDX 组件的注入方式。
- 模板保留 `@workspace/ui` 依赖（workspace:*），复用到其他项目时需连同 `packages/ui` 一起带走，README 写明该前置条件。
- 根 `package.json` workspaces 增加 `templates/*`，模板纳入 turbo lint/typecheck/build/test 持续验证。
- `apps/site` 保持不动：一次性抽取，模板与站点后续各自演进。

## Capabilities

### New Capabilities

- `docs-template`: 可复用文档站子应用模板——模板结构与独立运行要求、通用文档布局与导航、MDX 管线与 frontmatter 元数据自动化、可配置双语机制与内容一致性校验、示例内容、业务扩展点与复用指南。

### Modified Capabilities

（无。`apps/site` 不改动，`site-docs` 等现有能力的需求不变。）

## Impact

- **代码**：新增 `templates/docs/`（组件、lib、content、locales、styles、tests、构建配置、README）；根 `package.json` workspaces 增加 `templates/*`。
- **依赖**：模板依赖 `@workspace/ui`（workspace:*）与 `@workspace/typescript-config`；自身 package.json 声明 MDX 工具链（`@mdx-js/rollup`、remark/rehype 插件、shiki）、react-router-dom、i18next/react-i18next、zod、next-themes、lucide-react 等，版本与 `apps/site` 对齐。
- **构建**：turbo 现有 task 定义不变，模板自动纳入；模板 dev 端口 5175（避开 site 的 5174）。
- **不影响**：`apps/site`、`apps/web`、`packages/*`、examples、SDK 运行时行为。