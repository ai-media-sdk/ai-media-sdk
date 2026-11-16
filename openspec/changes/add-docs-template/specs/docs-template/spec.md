## Purpose

提供可复用的文档站子应用模板（`templates/docs`）：将 `apps/site` 文档区中通用的 MDX 管线、manifest 驱动导航、双语内容加载与文档布局沉淀为独立可运行的最小文档站，供后续项目拷贝复用；业务组件与业务内容不进入模板，模板通过明确的扩展点接入项目自定义内容。

## ADDED Requirements

### Requirement: 模板独立运行与持续验证

`templates/docs` SHALL 是一个可独立运行的子应用：在模板目录内 SHALL 能完成开发启动、生产构建、类型检查与测试，且 SHALL NOT 依赖 `apps/site` 的任何代码。模板 SHALL 纳入根 workspaces，随根级 lint/typecheck/build/test 一起持续验证；任一模板任务失败 SHALL 使根级对应任务失败。模板对共享 UI 的依赖 SHALL 限于 `@workspace/ui`，SHALL NOT 引入 SDK、Provider、playground 等业务包。

#### Scenario: 根级任务覆盖模板

- **WHEN** 在仓库根目录执行 lint、typecheck、build、test
- **THEN** 模板参与全部四项任务且通过；模板中存在类型错误或测试失败时对应根级任务失败

#### Scenario: 模板独立启动

- **WHEN** 在模板目录执行开发启动命令
- **THEN** 文档站在本地端口可访问，呈现示例文档内容，无需启动 `apps/site` 或其他应用

### Requirement: 文档区路由与导航

模板 SHALL 提供 `/:lang` 语言路由下的文档区：访问 `/:lang/docs` SHALL 重定向到该语言导航中的第一篇文档；`/:lang/docs/<slug>` SHALL 渲染对应语言的文档页。每个文档页 SHALL 提供按 manifest 分组与顺序排列的侧边栏（桌面粘性侧栏、移动端抽屉）、当前页标题锚点目录（TOC）、面包屑与上一篇/下一篇导航。TOC SHALL 随正文滚动自动高亮当前章节（滚动到页底时高亮最后一节），点击条目 SHALL 立即高亮并平滑滚动到对应标题。无语言段的 `/docs` 及其子路径 SHALL 重定向到默认语言的文档区。文档正文中的站内链接 SHALL 携带当前语言段；切换文档 SHALL 滚动到文章顶部，带锚点导航 SHALL 定位到对应标题，切换语言 SHALL 保持当前 slug。

#### Scenario: 进入文档区

- **WHEN** 用户访问 `/:lang/docs`
- **THEN** 重定向到该语言第一篇可用文档，侧边栏高亮当前页

#### Scenario: 未知 slug

- **WHEN** 用户访问 `/:lang/docs/non-existent-page`
- **THEN** 渲染文档区 NotFound 状态页（含返回文档首页链接），不渲染空白页

#### Scenario: 文档内链保持语言

- **WHEN** 用户在英文文档页点击指向另一篇文档的站内链接（内容中写作语言无关路径）
- **THEN** 导航目标仍在 `/en/docs` 下，不丢失或切换语言段

#### Scenario: 移动端导航

- **WHEN** 用户在窄视口打开文档页并点击导航开关
- **THEN** 以抽屉呈现与桌面一致的侧边栏，点击条目后抽屉关闭并导航

#### Scenario: 用户通过 TOC 定位章节

- **WHEN** 用户打开一篇含多级标题的文档并点击 TOC 中的某个条目
- **THEN** 页面平滑滚动到对应标题锚点位置，该条目立即呈现高亮态

#### Scenario: 滚动时 TOC 自动高亮当前章节

- **WHEN** 用户滚动正文，使某一章节标题到达视口顶部区域
- **THEN** TOC 中对应条目自动呈现高亮态，其余条目恢复常态；滚动到页面底部时高亮最后一节

### Requirement: MDX 渲染与 frontmatter 自动化

模板 SHALL 在构建期编译 MDX 内容：frontmatter（title/description/draft）SHALL 经构建期插件解析为模块导出并在内容加载时校验，非法 frontmatter SHALL 使构建或测试失败而非渲染坏页。文档页 SHALL 将 frontmatter 的 title/description 注入 `document.title` 与 meta description。代码块 SHALL 语法高亮并随主题明暗切换，SHALL 提供语言标签与一键复制；表格、引用块 SHALL 以共享 UI 组件渲染。

#### Scenario: 非法 frontmatter 阻断

- **WHEN** 某篇文档缺少 title 或 description
- **THEN** 内容一致性测试或构建失败，并指明问题文件与字段

#### Scenario: 代码块复制与主题

- **WHEN** 用户点击代码块的复制按钮
- **THEN** 代码文本写入剪贴板并呈现"已复制"反馈；切换明暗主题时代码配色随之切换

#### Scenario: 页面元数据注入

- **WHEN** 用户打开一篇有效文档
- **THEN** 浏览器标题包含该文档 frontmatter 标题与站点名，meta description 为 frontmatter 描述

### Requirement: 可配置双语与结构一致性

模板 SHALL 以中文为源语言维护双语内容，支持的语言集 SHALL 可配置（默认 zh/en）。manifest SHALL 是分组与阅读顺序的唯一语言无关事实源，标题 SHALL 只来自各文档 frontmatter。源语言文件集合 SHALL 与 manifest 双向一致；其他语言文件允许缺失，缺失即未翻译。模板 SHALL 提供文件系统级内容一致性测试：manifest ↔ 源语言双向一致、其他语言为源语言子集且无游离文件、全部 frontmatter 合法。

#### Scenario: 内容一致性检查

- **WHEN** 执行模板测试
- **THEN** 校验 manifest 与源语言文件双向一致、其他语言无游离文件、frontmatter 全部合法；任一违反时失败并指明问题项

#### Scenario: 语言集配置

- **WHEN** 复用者修改模板配置中的支持语言集与对应内容目录
- **THEN** 路由、语言检测与持久化、侧边栏与翻页按新语言集工作，无需改动组件代码

### Requirement: 内容状态处理

模板 SHALL 区分四种内容状态：正常文档渲染正文；draft 文档 SHALL 排除出导航与翻页，直接访问渲染草稿占位页；未翻译页面 SHALL 排除出该语言导航与翻页，直接访问渲染"翻译进行中"占位页（含源语言阅读入口）；未知 slug 渲染 NotFound。占位状态 SHALL 有独立的页面元数据。

#### Scenario: 直接访问未翻译页

- **WHEN** 英文缺少某篇文档而用户访问其英文 URL
- **THEN** 渲染未翻译占位页并提供中文阅读入口，英文侧边栏不出现该页

#### Scenario: 草稿页不进导航

- **WHEN** 某篇文档 frontmatter 标记 draft
- **THEN** 该页不出现在任何语言的侧边栏与翻页链中，直接访问渲染草稿占位页

### Requirement: 业务隔离与扩展点

模板 SHALL NOT 包含 Provider 模型表、能力徽章、模型投影、站点业务导航（playground/landing 入口）等业务代码与业务内容。模板 SHALL 提供两类扩展点：文档布局 SHALL 接受自定义页头（默认渲染配置驱动的极简页头：品牌名、语言切换、主题切换）；MDX 元素映射 SHALL 可与项目自定义组件合并，使业务组件能在 MDX 内容中使用。

#### Scenario: 注入自定义页头

- **WHEN** 复用者向文档布局传入自定义页头节点
- **THEN** 文档区渲染自定义页头替代默认页头，其余布局不变

#### Scenario: 注入自定义 MDX 组件

- **WHEN** 复用者按 README 指引将自定义组件合并进 MDX 元素映射并在 MDX 中使用
- **THEN** 文档正文渲染该自定义组件，无需修改模板内部代码

### Requirement: 部署深链兼容

模板 SHALL 以单一环境变量驱动资源 base path，客户端路由 basename SHALL 由同一 base 推导，二者 SHALL NOT 漂移。直接访问部署形态下的文档深链 SHALL 与本地开发行为一致；未设置 base 时 SHALL 以根路径部署。

#### Scenario: 子路径部署深链

- **WHEN** 以非根 base 构建部署后，用户直接访问 `<origin>/<base>/zh/docs/<有效 slug>`
- **THEN** 页面正常加载资源并渲染该文档

### Requirement: 复用指南

模板 SHALL 附带 README，写明：前置依赖（`@workspace/ui` 及共享 UI 体系需随模板一并复用）、应用到新项目的步骤（拷贝、改名与站点配置、替换 manifest/locales/内容、部署）、可定制点清单（站点名、语言集、主题、页头、MDX 组件）与明确排除的业务部分。

#### Scenario: 按指南复用

- **WHEN** 复用者按 README 步骤将模板应用到采用相同共享 UI 体系的新项目
- **THEN** 无需阅读 `apps/site` 源码即可完成改名、配置与内容替换并成功构建