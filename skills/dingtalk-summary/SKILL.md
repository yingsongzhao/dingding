---
name: dingtalk-summary
description: |
  仅当用户消息中明确包含「钉钉消息」这四个字时才触发此技能。
  用于提取并汇总钉钉消息。不要在用户仅提到「消息」「群聊」「汇总」等通用词时触发。
  必须严格匹配「钉钉消息」关键词，无此关键词则不触发。
---

# 钉钉消息提取与汇总

通过钉钉 DWS CLI (`dws`) 提取群聊/会话消息，并生成结构化的 AI 汇总报告。

## 前置检查

每次执行前，先验证环境：

```bash
node scripts/config-helper.mjs check
```

如果 `status` 不是 `"ready"`，引导用户完成配置（安装 DWS CLI 并运行 `dws auth`）。

## 核心工作流

### 步骤 1：确定提取范围

向用户确认（如已在对话中提供则直接使用）：

- **目标**: 哪个群？所有消息？还是 @我 的？
- **时间范围**: 最近多久？（默认 24h）
- **过滤**: 关键词？（可选）

### 步骤 2：提取消息

根据需求选择合适的命令：

#### 搜索群聊（获取群 ID）

```bash
node scripts/fetch-messages.mjs --action search-groups --query "群名关键词"
```

#### 获取指定群的消息

```bash
node scripts/fetch-messages.mjs --action fetch --group "<openConversationId>" --since "24h" --limit 50
```

#### 获取所有会话消息（按时间范围）

```bash
node scripts/fetch-messages.mjs --action fetch-all --since "24h" --limit 50
```

#### 按关键词搜索消息

```bash
node scripts/fetch-messages.mjs --action search --keyword "关键词" --since "7d"
```

#### 获取 @我 的消息

```bash
node scripts/fetch-messages.mjs --action mentions --since "24h"
```

#### 获取未读会话

```bash
node scripts/fetch-messages.mjs --action unread
```

**时间格式支持**: `24h`、`7d`、`30m`、`2w`（相对时间），或 ISO-8601 格式。

### 步骤 3：AI 汇总

拿到消息数据后，按以下结构生成汇总报告：

1. **总览摘要**（2-3 句话概括整体情况）
2. **主题分类**（将消息聚类为 3-5 个主题，每个主题附摘要）
3. **重要事项**（@提及的消息、决策事项、明确的待办）
4. **关键讨论**（有争议或需关注的讨论线程）
5. **待办清单**（提取出的 action items）

汇总原则：
- 保留关键人名和原始表述
- 区分事实陈述和个人观点
- 标注消息时间，体现时序
- 对长讨论保留结论而非过程

输出格式参考 `assets/summary-template.md`。

### 步骤 4：输出

将汇总以 Markdown 展示给用户。

如果用户要求将汇总**发送到钉钉**（发给某人或群），必须遵循以下格式规则：

#### 钉钉消息格式规范（重要）

1. **每行之间必须用空行分隔**（双换行 = 段落），否则会被合并为一行
2. **禁止使用 Markdown 表格语法**（`|---|`），钉钉单聊不渲染表格
3. **用符号代替表格**：`▸` 分隔列，`——` 做分隔线
4. **emoji 放行首**作为视觉标记区分不同内容类型
5. **使用文件传入长文本**：`--text "@C:/path/to/msg.txt"`

#### 发送命令

```bash
# 发送给个人
dws chat message send --user <userId> --title "消息汇总" --text "@<文件路径>" -f json -y

# 发送到群
dws chat message send --group <openConversationId> --title "消息汇总" --text "@<文件路径>" -f json -y
```

#### 发送流程

1. 将汇总内容按钉钉格式规范写入临时文件（每行之间空行分隔）
2. 用 `--text "@文件路径"` 方式发送
3. 短消息（<5行）可直接用 `--text "内容"` 但要注意换行

#### 图片报告（可选）

如果汇总内容包含复杂表格/排版，可生成图片：
1. 用 Python + Pillow 生成图片
2. 上传到钉盘：`dws drive upload --file ./summary.png -f json -y`
3. 发送链接给用户

如果只是在 ZCode 中查看（不发到钉钉），直接输出标准 Markdown 即可。

## 直接使用 DWS CLI

如果用户提出的需求超出脚本封装的能力，可直接调用 DWS CLI：

```bash
"<dwsCliPath>" <service> <command> [flags] -f json -y
```

DWS CLI 支持的消息相关服务：
- `dws chat search` — 搜索群聊
- `dws chat message list` — 拉取群消息
- `dws chat message list-all` — 按时间范围拉取所有消息
- `dws chat message list-direct --user <userId>` — 拉取私聊消息
- `dws chat message list-mentions` — 拉取 @我 的消息
- `dws chat message list-focused` — 拉取特别关注人消息
- `dws chat message search` — 按关键词搜索消息
- `dws chat message list-unread-conversations` — 未读会话

其他有用的服务：
- `dws todo` — 待办任务
- `dws calendar` — 日程
- `dws minutes` — AI 听记/会议摘要
- `dws contact` — 通讯录

## 定时汇总

```bash
# 创建定时任务
node scripts/schedule-summary.mjs --action create --interval "daily 9:00" --groups "<openConversationId1>,<openConversationId2>"

# 查看已有任务
node scripts/schedule-summary.mjs --action list

# 立即执行一次
node scripts/schedule-summary.mjs --action run-now --groups "<openConversationId>"

# 删除任务
node scripts/schedule-summary.mjs --action remove --id <taskId>
```

## 典型使用场景

1. **"帮我汇总钉钉消息"**
   → search-groups 找到群 → fetch 拉消息 → 汇总

2. **"钉钉消息里有没有人@我"**
   → mentions 拉取 → 列出并高亮

3. **"搜索钉钉消息中关于发布的讨论"**
   → search --keyword "发布" → 整理结果

4. **"每天早上自动汇总钉钉消息"**
   → 创建定时任务 → 保存报告到 outputDir

## 配置

配置文件: `scripts/.dingtalk-summary.json`

```bash
# 查看配置
node scripts/config-helper.mjs show

# 修改配置
node scripts/config-helper.mjs set defaultGroups '["openConvId1","openConvId2"]'
node scripts/config-helper.mjs set summaryTimeRange "12h"
```
