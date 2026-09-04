#!/usr/bin/env node
/**
 * generate-daily.js — 每日内容生成器
 * 由 GitHub Actions 每天 00:10（北京时间）自动运行。
 * 从 content/*.json 语料中，按"日期种子"确定性挑选当天内容：
 *   → daily/<YYYY-MM-DD>.json （当日归档）
 *   → daily/latest.json       （网页版每次启动拉取的"今日推送"源）
 * 同一日期重复运行结果完全一致（幂等），任何时刻只推当天内容。
 *
 * 想扩充每日内容：往 content/*.json 里加语料即可，无需改代码。
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const DAILY = path.join(ROOT, "daily");

/* ---------- 北京时间工具 ---------- */
function beijingNow() {
  // Node 以 UTC 存储；Asia/Shanghai = UTC+8（无夏令时）
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  const iso = d.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) };
}
function readJSON(name) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, name), "utf8"));
}
/** 稳定字符串哈希（与前端 daySeed 同思路，勿改算法以免两端不一致） */
function seedOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
/** 带种子的确定性洗牌（洗牌序列每日期不同） */
function seededShuffle(arr, seed) {
  const a = arr.slice();
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const DAY_MS = 86400000;
/** 距 2026-06-01 的第几天（用于 Day N 展示） */
function dayIndex(dateStr) {
  const t0 = Date.UTC(2026, 5, 1);
  return Math.floor((Date.parse(dateStr + "T00:00:00Z") - t0) / DAY_MS) + 1;
}

function buildDaily(dateStr) {
  const words = readJSON("words.json");
  const quiz4 = readJSON("quiz4.json");
  const quiz6 = readJSON("quiz6.json");
  const listening = readJSON("listening.json");
  const tips = readJSON("tips.json");

  const baseSeed = seedOf("cet-daily-" + dateStr);

  // 当日词包：确定性洗牌后取 6 个（同一天稳定，跨天轮换）
  const dayWords = seededShuffle(words, baseSeed).slice(0, 6);

  // 每日一题：单双日轮换 CET-4 / CET-6 语料
  const quizPool = dayIndex(dateStr) % 2 === 1 ? quiz4 : quiz6;
  const quizLevel = dayIndex(dateStr) % 2 === 1 ? "CET-4" : "CET-6";
  const quiz = quizPool[seedOf("quiz-" + dateStr) % quizPool.length];

  // 每日知识点（提示语按日轮换）
  const tip = tips[seedOf("tip-" + dateStr) % tips.length];

  // 听力一条
  const listeningPick = listening[seedOf("listening-" + dateStr) % listening.length];

  // 每日一句：从当日词包挑最长的例句
  let sentence = dayWords.slice().sort((a, b) => (b.ex || "").length - (a.ex || "").length)[0];
  sentence = { en: sentence.ex, word: sentence.w, cn: sentence.cn };

  const publishAt = `${dateStr}T00:10:00+08:00`;

  return {
    date: dateStr,
    publishAt,
    day: dayIndex(dateStr),
    type: "daily-feed",
    feed: {
      headline: `${dateStr} · 今日词包 Day ${dayIndex(dateStr)}`,
      words: dayWords,
      quiz: Object.assign({}, quiz, { level: quizLevel }),
      tip,
      listening: listeningPick,
      sentence,
    },
    meta: {
      source: "cet-daily-content",
      generatedBy: "github-actions / generate-daily.js",
      contentVersion: JSON.parse(fs.readFileSync(path.join(CONTENT, "meta.json"), "utf8")).version,
      wordPoolSize: words.length,
    },
  };
}

/* ---------- 主流程 ---------- */
const argDate = process.argv[2]; // 可选：指定日期（用于手动补跑历史）
const { date } = beijingNow();
const target = /^\d{4}-\d{2}-\d{2}$/.test(argDate || "") ? argDate : date;

const daily = buildDaily(target);

if (!fs.existsSync(DAILY)) fs.mkdirSync(DAILY, { recursive: true });
fs.writeFileSync(path.join(DAILY, `${target}.json`), JSON.stringify(daily, null, 2), "utf8");
fs.writeFileSync(path.join(DAILY, "latest.json"), JSON.stringify(daily, null, 2), "utf8");

console.log(`[daily-content] 已生成 ${target} → daily/${target}.json + daily/latest.json`);
console.log(`  今日词包 ${daily.feed.words.length} 词 / 知识点: ${daily.feed.tip.tag} / 题目: ${daily.feed.quiz.level}`);
