# Smart Dictation Helper (智听) 项目规则

## 分支策略（强制）
- **直接在 `main` 分支上开发**，严禁创建任何临时分支（如 `trae/solo-agent-***`、`trae-patch-***`、`ai/***`）。
- 严禁切换分支或进入游离 HEAD 状态，除非用户明确指示。
- 所有修改线性直接作用于 `main` 分支：`git add` → `git commit` → `git push origin main`。
- 推送遇冲突时直接 `git pull --rebase`；复杂冲突暂停询问用户，禁止用新建分支逃避。

## 技术栈（必须严格遵守）
- Frontend：原生微信小程序，WXSS (rpx 单位)，禁止 Uni-app / Taro。
- Backend：微信云开发 CloudBase（云函数 Node.js 18、云数据库 NoSQL/JSON、云存储）。
- AI：火山引擎 VolcEngine OCR + OpenAI SDK 兼容模式接入豆包大模型。
- Voice：微信同声传译插件或 wx.getBackgroundAudioManager。

## 开发心法
- 数据模型先行：改功能前先定义云数据库 Collection 结构（JSDoc / JSON Schema）。
- 模块化：UI 组件拆分，逻辑与视图分离。
- AI 调用安全：API Key 必须存放于云函数环境变量，绝不可写在前端代码。
- 随机算法：支持按"单元""课次"筛选，支持数量上下限 (Min-Max)。
- 错误处理：所有异步操作 try-catch，UI 层 Toast 提示。
- 代码风格：async/await，禁止回调地狱；变量语义化命名（如 selectedUnits, wordCountRange）。

## 代码质量
- 完成任务后必须运行 lint / typecheck（如 npm run lint）确保代码正确。
- 提交信息使用清晰、简明的中文规范。
