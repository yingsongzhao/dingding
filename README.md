# 📨 钉钉消息汇总插件 (dingtalk-summary)

> ZCode 插件 — 通过钉钉 DWS CLI 提取群聊/会话消息，AI 自动生成结构化汇总报告。

## ✨ 功能特性

- 📥 **消息提取** — 拉取指定群组、所有会话、私聊的消息
- 🔍 **关键词搜索** — 按关键词搜索历史消息
- 📌 **@我 提醒** — 快速查看所有 @提及的消息
- 📋 **AI 汇总** — 自动生成主题分类、重要事项、待办清单
- ⏰ **定时汇总** — 支持 Windows 计划任务自动执行
- 📤 **发送报告** — 将汇总直接发送到钉钉（个人/群聊）

## 📋 前置要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| [ZCode](https://zcode.dev) | 最新版 | AI 编程助手 |
| [钉钉 DWS CLI](https://open.dingtalk.com/dingtalk-cli#dtcli-install) | v1.0.41+ | 钉钉命令行工具 |
| [Node.js](https://nodejs.org) | v18+ | 脚本运行环境 |

## 🚀 安装

### 方式 1：通过 Marketplace 安装（推荐）

在 ZCode 会话中执行：

```
/plugin marketplace add yingsongzhao/dingding
/plugin install dingtalk-summary@dingtalk-summary-marketplace
```

### 方式 2：手动安装

```bash
# 克隆到 ZCode 插件目录
git clone https://github.com/yingsongzhao/dingding.git "%USERPROFILE%\.zcode\cli\plugins\cache\dingtalk-summary\0.1.0"
```

然后创建注册文件 `%USERPROFILE%\.zcode\cli\plugins\marketplaces\dingtalk-summary\marketplace.json`：

```json
{
  "name": "dingtalk-summary",
  "plugins": [{
    "cachePath": "C:\\Users\\<你的用户名>\\.zcode\\cli\\plugins\\cache\\dingtalk-summary\\0.1.0",
    "name": "dingtalk-summary",
    "source": "filesystem",
    "version": "0.1.0"
  }],
  "version": 1
}
```

重启 ZCode 即可。

## ⚙️ 配置

### 1. 安装 DWS CLI

从 [钉钉开放平台](https://open.dingtalk.com/dingtalk-cli#dtcli-install) 下载 `dws.exe`，放到合适的目录（推荐 `%LOCALAPPDATA%\Programs\dws\`）。

### 2. 登录认证

```bash
dws auth login
```

### 3. 初始化插件配置

```bash
cd <插件安装目录>/skills/dingtalk-summary
node scripts/config-helper.mjs init
node scripts/config-helper.mjs set dwsCliPath "C:\\Users\\<你的用户名>\\AppData\\Local\\Programs\\dws\\dws.exe"
```

### 4. 验证环境

```bash
node scripts/config-helper.mjs check
```

输出 `"status": "ready"` 即表示一切就绪。

## 💬 使用方法

### 触发方式

在 ZCode 对话中，只要消息包含「**钉钉消息**」四个字即可触发：

| 你说的话 | 插件会做什么 |
|---------|-------------|
| 帮我汇总**钉钉消息** | 拉取最近 24h 所有消息并生成汇总 |
| 看看今天的**钉钉消息** | 同上 |
| **钉钉消息**里有没有人@我 | 获取 @提及列表 |
| 搜索**钉钉消息**中关于发布的讨论 | 按关键词搜索 |
| 每天自动汇总**钉钉消息** | 创建定时任务 |
| 把**钉钉消息**汇总发给张三 | 汇总后发送到钉钉 |

> ⚠️ 必须完整包含「钉钉消息」才会触发，避免误触发。

### 命令行直接调用

也可以直接运行脚本：

```bash
# 搜索群聊
node scripts/fetch-messages.mjs --action search-groups --query "产品群"

# 获取群消息
node scripts/fetch-messages.mjs --action fetch --group "<openConversationId>" --since "24h"

# 获取所有最近消息
node scripts/fetch-messages.mjs --action fetch-all --since "12h"

# 搜索消息
node scripts/fetch-messages.mjs --action search --keyword "发布" --since "7d"

# 获取 @我 的消息
node scripts/fetch-messages.mjs --action mentions --since "24h"

# 获取未读会话
node scripts/fetch-messages.mjs --action unread
```

### 定时汇总

```bash
# 创建每天早上9点自动汇总
node scripts/schedule-summary.mjs --action create --interval "daily 9:00" --groups "<groupId1>,<groupId2>"

# 查看已有定时任务
node scripts/schedule-summary.mjs --action list

# 立即执行一次
node scripts/schedule-summary.mjs --action run-now --groups "<groupId>"

# 删除任务
node scripts/schedule-summary.mjs --action remove --id <taskId>
```

支持的时间间隔格式：
- `daily 9:00` — 每天指定时间
- `weekday 8:30` — 工作日指定时间
- `hourly` — 每小时
- `every 2h` — 每 2 小时

## 📊 汇总报告示例

```text
📊 钉钉消息汇总报告

📅 产品群 ▸ 2026-06-25 09:00 ~ 18:00 ▸ 67条 ▸ 15人活跃

—— 📌 总览 ——

今日讨论集中在 v2.3 版本发布和客户反馈两个方面。共 67 条消息，其中 3 条 @你。

—— 🏷️ 主题分类 ——

▸ 1. 版本发布计划

确定 v2.3 于下周三上线，李四负责回归测试，王五完成接口文档。

涉及: 李四、王五、张三

▸ 2. 客户反馈处理

收到 3 个 P1 级 bug 反馈，登录超时问题优先修复。

涉及: 赵六、王五

—— ⚡ 重要事项 ——

🔔 [@你] 请确认支付模块的测试用例
👤 李四 ▸ 14:30

🔔 [决策] v2.3 发布时间定为下周三
👤 张三 ▸ 11:15

—— ✅ 待办清单 ——

☐ 完成支付模块测试用例确认
👤 你 ⏰ 明天

☐ 修复登录超时问题
👤 王五 ⏰ 周五前

—— 完 ——
```

## 📁 目录结构

```
dingtalk-summary-plugin/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace 发现配置
├── .zcode-plugin/
│   └── plugin.json               # 插件元数据
├── package.json
├── README.md
└── skills/dingtalk-summary/
    ├── SKILL.md                   # 技能定义（AI 指令）
    ├── scripts/
    │   ├── fetch-messages.mjs     # 消息提取（6 种操作）
    │   ├── config-helper.mjs      # 配置管理
    │   └── schedule-summary.mjs   # 定时调度
    ├── references/
    │   ├── dws-commands.md        # DWS CLI 命令参考
    │   └── message-formatting.md  # 消息格式规范
    └── assets/
        └── summary-template.md    # 汇总输出模板
```

## 🔧 配置项说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `dwsCliPath` | `"dws"` | DWS CLI 可执行文件路径 |
| `defaultGroups` | `[]` | 默认汇总的群组 ID 列表 |
| `summaryTimeRange` | `"24h"` | 默认提取时间范围 |
| `scheduleInterval` | `"daily 9:00"` | 定时汇总频率 |
| `outputDir` | `"./dingtalk-reports"` | 报告输出目录 |
| `summaryPreferences.maxTopics` | `5` | 汇总最大主题数 |
| `summaryPreferences.extractTodos` | `true` | 是否提取待办 |
| `summaryPreferences.highlightMentions` | `true` | 是否高亮 @提及 |

修改配置：
```bash
node scripts/config-helper.mjs set <key> <value>

# 示例
node scripts/config-helper.mjs set summaryTimeRange "12h"
node scripts/config-helper.mjs set defaultGroups '["groupId1","groupId2"]'
```

## 📝 钉钉消息格式规范

发送汇总到钉钉时，插件自动遵循以下规则：

- ✅ 双换行分段（避免内容合并为一行）
- ✅ emoji 行首标记（视觉区分）
- ✅ `▸` 和 `——` 代替表格（钉钉不渲染 Markdown 表格）
- ✅ 长文本通过文件传入

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
