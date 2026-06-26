# 钉钉消息汇总工具

本项目包含钉钉 DWS CLI 的消息提取和 AI 汇总工具。

## 环境

- DWS CLI 路径: 运行 `node skills/dingtalk-summary/scripts/config-helper.mjs show` 查看
- 如未配置，先运行: `node skills/dingtalk-summary/scripts/config-helper.mjs init`

## 可用命令

当用户提到「钉钉消息」时，使用以下脚本：

### 检查环境
```bash
node skills/dingtalk-summary/scripts/config-helper.mjs check
```

### 搜索群聊（获取群 ID）
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action search-groups --query "群名"
```

### 获取群消息
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action fetch --group "<openConversationId>" --since "24h" --limit 50
```

### 获取所有消息（按时间）
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action fetch-all --since "24h"
```

### 搜索消息
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action search --keyword "关键词" --since "7d"
```

### 获取 @我 的消息
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action mentions --since "24h"
```

### 获取未读会话
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action unread
```

### 发送汇总到钉钉
```bash
# 先将内容写入文件（每行之间必须空行分隔）
# 然后发送
dws chat message send --user <userId> --title "消息汇总" --text "@<文件路径>" -f json -y
```

## 汇总格式

生成汇总时按此结构：
1. 总览摘要（2-3句）
2. 主题分类（3-5个主题）
3. 重要事项（@提及、决策）
4. 待办清单
5. 关键讨论

## 钉钉发送格式规则

如果要把汇总发送到钉钉（不是只在终端显示），必须：
- 每行之间用空行分隔（双换行）
- 不要用 Markdown 表格（钉钉不渲染）
- 用 `▸` 代替表格列，`——` 做分隔线
- emoji 放行首做标记
- 长文本用文件传入: `--text "@file.txt"`

## 时间格式

支持: `24h`、`7d`、`30m`、`2w`（相对），或 ISO-8601
