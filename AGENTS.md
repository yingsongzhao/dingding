# 钉钉消息汇总工具 (DingTalk Message Summary)

本项目提供钉钉消息提取和 AI 汇总能力，适用于任何能执行 Shell 命令的 AI Agent。

## Setup

1. Ensure DWS CLI is installed (download from https://open.dingtalk.com/dingtalk-cli)
2. Run `dws auth login` to authenticate
3. Initialize config:
   ```bash
   node skills/dingtalk-summary/scripts/config-helper.mjs init
   node skills/dingtalk-summary/scripts/config-helper.mjs set dwsCliPath "/path/to/dws"
   ```

## Commands

All scripts are under `skills/dingtalk-summary/scripts/`. Use Node.js to run them.

### Check Environment
```bash
node skills/dingtalk-summary/scripts/config-helper.mjs check
```
Returns JSON with `status: "ready"` when everything is configured.

### Search Groups (get openConversationId)
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action search-groups --query "group name"
```

### Fetch Group Messages
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action fetch --group "<openConversationId>" --since "24h" --limit 50
```

### Fetch All Messages (by time range)
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action fetch-all --since "24h"
```

### Search Messages by Keyword
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action search --keyword "keyword" --since "7d"
```

### Get @mentions
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action mentions --since "24h"
```

### Get Unread Conversations
```bash
node skills/dingtalk-summary/scripts/fetch-messages.mjs --action unread
```

## Time Formats

Relative: `30m`, `24h`, `7d`, `2w`
Absolute: ISO-8601 (e.g., `2026-06-25T00:00:00+08:00`)

## Output Format

All commands output JSON. Typical structure:
```json
{
  "success": true,
  "data": { ... }
}
```

On error:
```json
{
  "success": false,
  "error": "CLI_ERROR",
  "message": "..."
}
```

## Summary Guidelines

When summarizing messages, produce:
1. **Overview** — 2-3 sentence summary
2. **Topics** — Cluster into 3-5 themes
3. **Highlights** — @mentions, decisions, important changes
4. **Action Items** — Extracted TODOs with assignees
5. **Key Discussions** — Controversial or noteworthy threads

## Sending to DingTalk

To send summaries back to DingTalk:

```bash
# Send to a user
dws chat message send --user <userId> --title "Summary" --text "@/path/to/file.txt" -f json -y

# Send to a group
dws chat message send --group <groupId> --title "Summary" --text "@/path/to/file.txt" -f json -y
```

**Formatting rules for DingTalk messages:**
- Use double newlines between lines (single newlines are collapsed)
- Do NOT use Markdown tables (not rendered in DingTalk)
- Use `▸` for columns, `——` for separators
- Prefix lines with emoji for visual markers
- For long text, write to file and use `--text "@filepath"`

## Scheduled Summaries

```bash
# Create scheduled task
node skills/dingtalk-summary/scripts/schedule-summary.mjs --action create --interval "daily 9:00" --groups "id1,id2"

# List tasks
node skills/dingtalk-summary/scripts/schedule-summary.mjs --action list

# Run immediately
node skills/dingtalk-summary/scripts/schedule-summary.mjs --action run-now --groups "id1"

# Remove task
node skills/dingtalk-summary/scripts/schedule-summary.mjs --action remove --id <taskId>
```
