#!/usr/bin/env node

/**
 * config-helper.mjs — 配置初始化与验证
 *
 * 用法:
 *   node config-helper.mjs check    — 检查 DWS CLI 可用性和配置状态
 *   node config-helper.mjs init     — 初始化/重置配置文件
 *   node config-helper.mjs show     — 显示当前配置
 *   node config-helper.mjs set <key> <value> — 设置单个配置项
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, ".dingtalk-summary.json");

const DEFAULT_CONFIG = {
  dwsCliPath: "dws",
  commands: {
    searchGroups: "chat search --query \"{query}\"",
    fetchMessages: "chat message list --group \"{group}\"",
    fetchAll: "chat message list-all --start \"{start}\" --end \"{end}\"",
    searchMessages: "chat message search --query \"{keyword}\" --start \"{start}\" --end \"{end}\"",
    listMentions: "chat message list-mentions --start \"{start}\" --end \"{end}\"",
    listUnread: "chat message list-unread-conversations",
  },
  defaultGroups: [],
  summaryTimeRange: "24h",
  scheduleInterval: "daily 9:00",
  outputDir: "./dingtalk-reports",
  summaryPreferences: {
    language: "zh-CN",
    maxTopics: 5,
    extractTodos: true,
    highlightMentions: true,
  },
};

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function checkCliAvailable(cliPath) {
  if (cliPath.includes("/") || cliPath.includes("\\")) {
    if (existsSync(cliPath)) {
      return { available: true, path: cliPath };
    }
    return { available: false, path: null };
  }

  try {
    const cmd =
      process.platform === "win32"
        ? `where ${cliPath} 2>nul`
        : `which ${cliPath} 2>/dev/null`;
    const result = execSync(cmd, { encoding: "utf-8", windowsHide: true });
    return { available: true, path: result.trim().split("\n")[0] };
  } catch {
    return { available: false, path: null };
  }
}

function checkCliVersion(cliPath) {
  try {
    const result = execSync(`"${cliPath}" version`, {
      encoding: "utf-8",
      timeout: 5000,
      windowsHide: true,
    });
    return { success: true, version: result.trim() };
  } catch {
    return { success: false, version: null };
  }
}

function actionCheck() {
  const report = {
    configExists: existsSync(CONFIG_PATH),
    config: null,
    cli: { available: false, path: null, version: null },
    status: "not_ready",
    issues: [],
  };

  const config = loadConfig();
  if (config) {
    report.config = config;
  } else {
    report.issues.push("配置文件不存在，请运行: node scripts/config-helper.mjs init");
  }

  const cliPath = config?.dwsCliPath || DEFAULT_CONFIG.dwsCliPath;
  const cliCheck = checkCliAvailable(cliPath);
  report.cli.available = cliCheck.available;
  report.cli.path = cliCheck.path;

  if (cliCheck.available) {
    const versionCheck = checkCliVersion(cliPath);
    report.cli.version = versionCheck.version;
  } else {
    report.issues.push(
      `DWS CLI 未找到 (路径: ${cliPath})。请确认已安装并配置正确的路径。`
    );
  }

  if (report.configExists && report.cli.available) {
    report.status = "ready";
  } else if (report.configExists) {
    report.status = "cli_missing";
  } else if (report.cli.available) {
    report.status = "config_missing";
  }

  console.log(JSON.stringify(report, null, 2));
}

function actionInit() {
  const existing = loadConfig();

  if (existing) {
    const merged = { ...DEFAULT_CONFIG, ...existing };
    merged.commands = { ...DEFAULT_CONFIG.commands, ...existing.commands };
    merged.summaryPreferences = {
      ...DEFAULT_CONFIG.summaryPreferences,
      ...existing.summaryPreferences,
    };
    saveConfig(merged);
    console.log(
      JSON.stringify({
        action: "init",
        result: "merged",
        message: "配置已更新（保留已有设置，补充新字段）",
        configPath: CONFIG_PATH,
        config: merged,
      }, null, 2)
    );
  } else {
    saveConfig(DEFAULT_CONFIG);
    console.log(
      JSON.stringify({
        action: "init",
        result: "created",
        message: "配置文件已创建。请设置 dwsCliPath 为 DWS CLI 的实际路径。",
        configPath: CONFIG_PATH,
        config: DEFAULT_CONFIG,
      }, null, 2)
    );
  }
}

function actionShow() {
  const config = loadConfig();
  if (!config) {
    console.log(
      JSON.stringify({
        error: "NO_CONFIG",
        message: "配置文件不存在，请运行: node scripts/config-helper.mjs init",
      })
    );
    process.exit(1);
  }
  console.log(JSON.stringify({ configPath: CONFIG_PATH, config }, null, 2));
}

function actionSet(key, value) {
  if (!key) {
    console.log(
      JSON.stringify({ error: "MISSING_KEY", message: "请指定要设置的配置项" })
    );
    process.exit(1);
  }

  const config = loadConfig() || DEFAULT_CONFIG;

  const keys = key.split(".");
  let target = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in target)) target[keys[i]] = {};
    target = target[keys[i]];
  }

  let parsedValue;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    parsedValue = value;
  }

  target[keys[keys.length - 1]] = parsedValue;
  saveConfig(config);

  console.log(
    JSON.stringify({
      action: "set",
      key,
      value: parsedValue,
      message: `已设置 ${key} = ${JSON.stringify(parsedValue)}`,
    }, null, 2)
  );
}

function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  switch (action) {
    case "check":
      actionCheck();
      break;
    case "init":
      actionInit();
      break;
    case "show":
      actionShow();
      break;
    case "set":
      actionSet(args[1], args[2]);
      break;
    default:
      console.log(
        JSON.stringify({
          error: "UNKNOWN_ACTION",
          message: "用法: node config-helper.mjs <check|init|show|set>",
          actions: {
            check: "检查环境和配置状态",
            init: "初始化/重置配置文件",
            show: "显示当前配置",
            "set <key> <value>": "设置单个配置项",
          },
        }, null, 2)
      );
  }
}

main();
