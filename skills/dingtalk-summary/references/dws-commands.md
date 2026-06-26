# 钉钉 DWS CLI 命令参考 (v1.0.41+)

## 消息相关

| 命令 | 说明 |
|------|------|
| `dws chat search --query "群名"` | 搜索群聊，获取 openConversationId |
| `dws chat message list --group <id>` | 拉取群消息 |
| `dws chat message list-all --start "..." --end "..."` | 按时间范围拉所有消息 |
| `dws chat message list-direct --user <userId>` | 拉取私聊消息 |
| `dws chat message list-mentions --start "..." --end "..."` | @我 的消息 |
| `dws chat message search --query "kw" --start "..." --end "..."` | 搜索消息 |
| `dws chat message list-unread-conversations` | 未读会话 |

## 通用 Flags

`-f json -y --limit N --cursor "0"`

## 安装

下载地址: https://open.dingtalk.com/dingtalk-cli#dtcli-install

登录: `dws auth login`
