#!/usr/bin/env node

/**
 * schedule-summary.mjs — 定时汇总调度器
 *
 * 用法:
 *   node schedule-summary.mjs --action create --interval "daily 9:00" --groups "id1,id2"
 *   node schedule-summary.mjs --action list
 *   node schedule-summary.mjs --action remove --id <taskId>
 *   node schedule-summary.mjs --action run-now --groups "id1"
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, ".dingtalk-summary.json");
const SCHEDULES_PATH = resolve(__dirname, ".schedules.json");

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(JSON.stringify({ error: "CONFIG_NOT_FOUND", message: "请先运行 init" }));
    process.exit(1);
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

function loadSchedules() {
  if (!existsSync(SCHEDULES_PATH)) return { tasks: [] };
  try { return JSON.parse(readFileSync(SCHEDULES_PATH, "utf-8")); } catch { return { tasks: [] }; }
}

function saveSchedules(schedules) {
  writeFileSync(SCHEDULES_PATH, JSON.stringify(schedules, null, 2), "utf-8");
}

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseInterval(interval) {
  if (!interval) return null;
  const dailyMatch = interval.match(/^daily\s+(\d{1,2}):(\d{2})$/);
  if (dailyMatch) return { type: "daily", hour: parseInt(dailyMatch[1]), minute: parseInt(dailyMatch[2]), cron: `${dailyMatch[2]} ${dailyMatch[1]} * * *` };
  if (interval === "hourly") return { type: "hourly", cron: "0 * * * *" };
  const everyMatch = interval.match(/^every\s+(\d+)([hm])$/);
  if (everyMatch) { const [, n, u] = everyMatch; return u === "h" ? { type: "interval", cron: `0 */${n} * * *` } : { type: "interval", cron: `*/${n} * * * *` }; }
  const weekdayMatch = interval.match(/^weekday\s+(\d{1,2}):(\d{2})$/);
  if (weekdayMatch) return { type: "weekday", hour: parseInt(weekdayMatch[1]), minute: parseInt(weekdayMatch[2]), cron: `${weekdayMatch[2]} ${weekdayMatch[1]} * * 1-5` };
  return { type: "custom", raw: interval, cron: null };
}

function actionCreate({ interval, groups }) {
  const config = loadConfig();
  const schedules = loadSchedules();
  const schedule = parseInterval(interval || config.scheduleInterval);
  const groupList = groups ? groups.split(",").map(g => g.trim()) : config.defaultGroups;

  if (!groupList.length) { console.log(JSON.stringify({ error: "NO_GROUPS", message: "未指定群组" }, null, 2)); return; }

  const taskId = generateId();
  const task = { id: taskId, interval: interval || config.scheduleInterval, schedule, groups: groupList, createdAt: new Date().toISOString(), status: "active" };

  if (process.platform === "win32") {
    const st = schedule.type === "daily" ? `/sc daily /st ${String(schedule.hour).padStart(2,"0")}:${String(schedule.minute).padStart(2,"0")}` : `/sc daily /st 09:00`;
    const cmd = `schtasks /create /tn "DingTalkSummary_${taskId}" ${st} /tr "\\"${process.execPath}\\" \\"${resolve(__dirname,"schedule-summary.mjs")}\\" --action run-now --groups \\"${groupList.join(",")}\\"" /f`;
    task.windowsCommand = cmd;
    try { execSync(cmd, { encoding: "utf-8", windowsHide: true }); task.windowsTaskCreated = true; } catch { task.windowsTaskCreated = false; }
  }

  schedules.tasks.push(task);
  saveSchedules(schedules);
  console.log(JSON.stringify({ action: "create", result: "success", task }, null, 2));
}

function actionList() {
  console.log(JSON.stringify({ action: "list", ...loadSchedules() }, null, 2));
}

function actionRemove({ id }) {
  if (!id) { console.log(JSON.stringify({ error: "MISSING_ID" })); return; }
  const schedules = loadSchedules();
  const idx = schedules.tasks.findIndex(t => t.id === id);
  if (idx === -1) { console.log(JSON.stringify({ error: "NOT_FOUND" })); return; }
  if (process.platform === "win32") { try { execSync(`schtasks /delete /tn "DingTalkSummary_${id}" /f`, { windowsHide: true }); } catch {} }
  schedules.tasks.splice(idx, 1);
  saveSchedules(schedules);
  console.log(JSON.stringify({ action: "remove", result: "success" }, null, 2));
}

function actionRunNow({ groups }) {
  const config = loadConfig();
  const groupList = groups ? groups.split(",").map(g => g.trim()) : config.defaultGroups;
  if (!groupList.length) { console.log(JSON.stringify({ error: "NO_GROUPS" }, null, 2)); return; }

  const outputDir = resolve(process.cwd(), config.outputDir || "./dingtalk-reports");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const results = [];
  for (const group of groupList) {
    try {
      const out = execSync(`node "${resolve(__dirname,"fetch-messages.mjs")}" --action fetch --group "${group}" --since "${config.summaryTimeRange}"`, { encoding: "utf-8", timeout: 60000, windowsHide: true });
      results.push({ group, success: true, data: JSON.parse(out) });
    } catch (err) { results.push({ group, success: false, error: err.message }); }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputFile = resolve(outputDir, `raw-messages-${ts}.json`);
  writeFileSync(outputFile, JSON.stringify(results, null, 2), "utf-8");
  console.log(JSON.stringify({ action: "run-now", results: results.map(r => ({ group: r.group, success: r.success })), outputFile }, null, 2));
}

function main() {
  const { values } = parseArgs({ options: { action: { type: "string" }, interval: { type: "string" }, groups: { type: "string" }, id: { type: "string" } }, strict: false });
  switch (values.action) {
    case "create": actionCreate({ interval: values.interval, groups: values.groups }); break;
    case "list": actionList(); break;
    case "remove": actionRemove({ id: values.id }); break;
    case "run-now": actionRunNow({ groups: values.groups }); break;
    default: console.log(JSON.stringify({ message: "用法: --action <create|list|remove|run-now>" }, null, 2));
  }
}

main();
