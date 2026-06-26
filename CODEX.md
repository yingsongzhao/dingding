# DingTalk Message Summary Tool

## What This Does

Extracts messages from DingTalk (钉钉) via DWS CLI and generates AI-powered summaries.

## Prerequisites

- Node.js 18+
- DWS CLI (DingTalk Workspace CLI) — install from https://open.dingtalk.com/dingtalk-cli
- Run `dws auth login` to authenticate before first use

## Quick Start

```bash
# 1. Initialize
node skills/dingtalk-summary/scripts/config-helper.mjs init
node skills/dingtalk-summary/scripts/config-helper.mjs set dwsCliPath "/path/to/dws"

# 2. Verify
node skills/dingtalk-summary/scripts/config-helper.mjs check
# Should output: "status": "ready"
```

## Available Actions

| Action | Command | Required Params |
|--------|---------|-----------------|
| Search groups | `--action search-groups` | `--query "name"` |
| Fetch group msgs | `--action fetch` | `--group <id>` |
| Fetch all msgs | `--action fetch-all` | (uses --since) |
| Search msgs | `--action search` | `--keyword "kw"` |
| Get @mentions | `--action mentions` | (uses --since) |
| Get unread | `--action unread` | (none) |

Base command: `node skills/dingtalk-summary/scripts/fetch-messages.mjs`

Common flags: `--since "24h"`, `--limit 50`, `--group <id>`

## Summary Output Structure

When asked to summarize DingTalk messages, generate:

1. Overview (2-3 sentences)
2. Topic clusters (3-5 themes with summaries)
3. Highlights (@mentions, decisions)
4. Action items (TODOs with assignees/deadlines)
5. Key discussions (conclusions)

## DingTalk Message Sending Rules

When sending content TO DingTalk:
- Double newlines required between lines
- NO markdown tables
- Use emoji prefixes and `▸` / `——` for structure
- Long text via file: `--text "@filepath"`
