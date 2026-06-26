#!/usr/bin/env node

/**
 * fetch-messages.mjs — 钉钉 DWS CLI 消息提取封装
 *
 * 基于 dws v1.0.41 实际命令接口
 *
 * 用法:
 *   node fetch-messages.mjs --action search-groups --query "产品"
 *   node fetch-messages.mjs --action fetch --group <openConversationId> --since "24h"
 *   node fetch-messages.mjs --action fetch-all --since "24h"
 *   node fetch-messages.mjs --action search --keyword "发布" --since "7d"
 *   node fetch-messages.mjs --action mentions --since "24h"
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, ".dingtalk-summary.json");

// ─── 配置 ────────────────────────────────────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(
      JSON.stringify({
        error: "CONFIG_NOT_FOUND",
        message: "配置文件不存在，请先运行: node scripts/config-helper.mjs init",
      })
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

// ─── 时间范围解析 ─────────────────────────────────────────────────────────────

function parseTimeToISO(timeStr) {
  if (!timeStr) return null;

  const match = timeStr.match(/^(\d+)([mhdw])$/);
  if (match) {
    const [, num, unit] = match;
    const ms = {
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
    };
    const date = new Date(Date.now() - parseInt(num) * ms[unit]);
    return formatISO8601(date);
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }

  const date = new Date(timeStr);
  if (!isNaN(date.getTime())) {
    return formatISO8601(date);
  }

  return null;
}

function formatISO8601(date) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  const tz = `${sign}${hours}:${minutes}`;

  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${y}-${mo}-${d}T${h}:${mi}:${s}${tz}`;
}

function formatDatetime(date) {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

function getNowISO() {
  return formatISO8601(new Date());
}

// ─── DWS CLI 调用 ─────────────────────────────────────────────────────────────

function runDws(config, args) {
  const cmd = `"${config.dwsCliPath}" ${args} -f json -y`;
  try {
    const output = execSync(cmd, {
      encoding: "utf-8",
      timeout: 60000,
      windowsHide: true,
    });
    const trimmed = output.trim();
    try {
      return { success: true, data: JSON.parse(trimmed) };
    } catch {
      return { success: true, data: trimmed };
    }
  } catch (err) {
    const stderr = err.stderr || "";
    const stdout = err.stdout || "";
    return {
      success: false,
      error: "CLI_ERROR",
      message: stderr || err.message,
      stdout: stdout.trim(),
      command: cmd,
    };
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function searchGroups(config, { query, limit }) {
  let args = `chat search --query "${query}"`;
  if (limit) args += ` --limit ${limit}`;
  return runDws(config, args);
}

function fetchGroupMessages(config, { group, since, limit }) {
  let args = `chat message list --group "${group}"`;
  if (limit) args += ` --limit ${limit}`;
  if (since) {
    const time = parseTimeToISO(since);
    if (time) args += ` --time "${time}"`;
  }
  return runDws(config, args);
}

function fetchAllMessages(config, { since, until, limit, cursor }) {
  const startTime = since
    ? parseTimeToISO(since)
    : formatDatetime(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const endTime = until ? parseTimeToISO(until) : formatDatetime(new Date());

  const start = startTime.includes("T")
    ? startTime.replace("T", " ").replace(/[+-]\d{2}:\d{2}$/, "")
    : startTime;
  const end = endTime.includes("T")
    ? endTime.replace("T", " ").replace(/[+-]\d{2}:\d{2}$/, "")
    : endTime;

  let args = `chat message list-all --start "${start}" --end "${end}"`;
  if (limit) args += ` --limit ${limit}`;
  if (cursor) args += ` --cursor "${cursor}"`;
  return runDws(config, args);
}

function searchMessages(config, { keyword, group, since, until, limit, cursor }) {
  const startTime = since
    ? parseTimeToISO(since)
    : formatISO8601(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const endTime = until ? parseTimeToISO(until) : getNowISO();

  let args = `chat message search --query "${keyword}" --start "${startTime}" --end "${endTime}"`;
  if (group) args += ` --group "${group}"`;
  if (limit) args += ` --limit ${limit}`;
  if (cursor) args += ` --cursor "${cursor}"`;
  return runDws(config, args);
}

function fetchMentions(config, { group, since, until, limit, cursor }) {
  const startTime = since
    ? parseTimeToISO(since)
    : formatISO8601(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const endTime = until ? parseTimeToISO(until) : getNowISO();

  let args = `chat message list-mentions --start "${startTime}" --end "${endTime}"`;
  if (group) args += ` --group "${group}"`;
  if (limit) args += ` --limit ${limit}`;
  if (cursor) args += ` --cursor "${cursor}"`;
  return runDws(config, args);
}

function fetchUnread(config) {
  return runDws(config, "chat message list-unread-conversations");
}

// ─── CLI 入口 ─────────────────────────────────────────────────────────────────

function main() {
  const { values } = parseArgs({
    options: {
      action: { type: "string", short: "a" },
      group: { type: "string", short: "g" },
      query: { type: "string", short: "q" },
      keyword: { type: "string", short: "k" },
      since: { type: "string", short: "s" },
      until: { type: "string", short: "u" },
      limit: { type: "string", short: "l" },
      cursor: { type: "string", short: "c" },
    },
    strict: false,
  });

  const config = loadConfig();
  let result;

  switch (values.action) {
    case "search-groups":
      if (!values.query) {
        result = { error: "MISSING_PARAM", message: "需要指定 --query 参数（群名关键词）" };
        break;
      }
      result = searchGroups(config, {
        query: values.query,
        limit: values.limit ? parseInt(values.limit) : undefined,
      });
      break;

    case "fetch":
      if (!values.group) {
        result = { error: "MISSING_PARAM", message: "需要指定 --group 参数（openConversationId，可通过 search-groups 获取）" };
        break;
      }
      result = fetchGroupMessages(config, {
        group: values.group,
        since: values.since,
        limit: values.limit ? parseInt(values.limit) : 50,
      });
      break;

    case "fetch-all":
      result = fetchAllMessages(config, {
        since: values.since,
        until: values.until,
        limit: values.limit ? parseInt(values.limit) : 50,
        cursor: values.cursor,
      });
      break;

    case "search":
      if (!values.keyword) {
        result = { error: "MISSING_PARAM", message: "需要指定 --keyword 参数" };
        break;
      }
      result = searchMessages(config, {
        keyword: values.keyword,
        group: values.group,
        since: values.since,
        until: values.until,
        limit: values.limit ? parseInt(values.limit) : 100,
        cursor: values.cursor,
      });
      break;

    case "mentions":
      result = fetchMentions(config, {
        group: values.group,
        since: values.since,
        until: values.until,
        limit: values.limit ? parseInt(values.limit) : 50,
        cursor: values.cursor,
      });
      break;

    case "unread":
      result = fetchUnread(config);
      break;

    default:
      result = {
        error: "UNKNOWN_ACTION",
        message: `未知操作: ${values.action}`,
        availableActions: {
          "search-groups": "搜索群聊 (--query 群名关键词)",
          "fetch": "获取指定群的消息 (--group openConversationId, --since 时间范围)",
          "fetch-all": "获取所有会话消息 (--since, --until)",
          "search": "按关键词搜索消息 (--keyword, --since, --group 可选)",
          "mentions": "获取 @我 的消息 (--since, --group 可选)",
          "unread": "获取未读会话列表",
        },
      };
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
