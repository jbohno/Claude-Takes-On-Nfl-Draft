/**
 * RAS (Relative Athletic Score) scraper for 2026 NFL Draft prospects.
 *
 * Source: https://ras.football — no public API. We respect the site:
 *   - cache raw HTML under /data/.ras-cache/ so repeat runs don't hammer them
 *   - serial requests with a 1.5s delay between hits
 *   - User-Agent identifies this as a personal research tool
 *
 * Output: /data/rasScores.json (gitignored) keyed by player name.
 *
 * Usage:
 *   npm run fetch-ras
 *
 * Notes on the 2026 class:
 *   Many 2026 prospects have not combined/tested yet. For any player missing
 *   from ras.football we write ras: null so the UI can show "pending combine".
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import playersJson from '../data/players2026.json' with { type: 'json' };
import predictedJson from '../data/claudesPredictedMock.json' with { type: 'json' };
import myPredicted from '../data/myPredictedMock.json' with { type: 'json' };
import myGM from '../data/myGMMock.json' with { type: 'json' };
import claudesGM from '../data/claudesGMMock.json' with { type: 'json' };

interface PlayerSeed { name: string; pos?: string; school?: string }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'data', '.ras-cache');
const OUT_PATH = path.join(ROOT, 'data', 'rasScores.json');

const UA = 'DraftDashboard/0.1 (+personal research tool; local use)';
const SEARCH_URL = (q: string) => `https://ras.football/?s=${encodeURIComponent(q)}`;
const DELAY_MS = 1500;

interface RASEntry {
  ras: number | null;
  height?: string;
  weight?: number;
  forty?: number;
  vertical?: number;
  broad?: string;
  bench?: number;
  shuttle?: number;
  threeCone?: number;
  position?: string;
  school?: string;
  source?: string;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function cacheKey(url: string) {
  return url.replace(/[^a-z0-9]+/gi, '_').slice(0, 200) + '.html';
}

async function cachedFetch(url: string): Promise<string> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const key = path.join(CACHE_DIR, cacheKey(url));
  try {
    const cached = await fs.readFile(key, 'utf8');
    return cached;
  } catch { /* cache miss */ }

  await sleep(DELAY_MS);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  const html = await res.text();
  await fs.writeFile(key, html, 'utf8');
  return html;
}

async function findPlayerPage(name: string): Promise<string | null> {
  const html = await cachedFetch(SEARCH_URL(name));
  const $ = cheerio.load(html);

  // ras.football WordPress search lists articles; pull first result link
  const firstLink = $('article a[href]').first().attr('href')
    || $('h2 a[href]').first().attr('href')
    || $('a[href*="/class-of-2026/"]').first().attr('href')
    || null;

  return firstLink ?? null;
}

function parseRASFromPage(html: string): RASEntry | null {
  const $ = cheerio.load(html);
  const text = $('body').text();

  // RAS score — typically rendered as "RAS: 9.42" or in a prominent header
  const rasMatch = text.match(/\bRAS[:\s]+(\d+\.\d{1,2})\b/);
  const fortyMatch = text.match(/\b40(?:\s*Yard)?[:\s]+(\d\.\d{2})\b/i);
  const verticalMatch = text.match(/\bVertical(?:\s*Jump)?[:\s]+(\d{2}(?:\.\d)?)/i);
  const benchMatch = text.match(/\bBench(?:\s*Press)?[:\s]+(\d{1,2})\b/i);
  const shuttleMatch = text.match(/\b(?:20\s*Yard\s*)?Shuttle[:\s]+(\d\.\d{2})\b/i);
  const threeConeMatch = text.match(/\b3\s*Cone[:\s]+(\d\.\d{2})\b/i);
  const heightMatch = text.match(/\bHeight[:\s]+(\d'[\s]*\d{1,2}(?:\s*[\/\d]+)?)/i);
  const weightMatch = text.match(/\bWeight[:\s]+(\d{3})\b/i);
  const broadMatch = text.match(/\bBroad(?:\s*Jump)?[:\s]+(\d+\s*'[\s]*\d*)/i);

  if (!rasMatch && !fortyMatch) return null;

  return {
    ras: rasMatch ? parseFloat(rasMatch[1]!) : null,
    forty: fortyMatch ? parseFloat(fortyMatch[1]!) : undefined,
    vertical: verticalMatch ? parseFloat(verticalMatch[1]!) : undefined,
    bench: benchMatch ? parseInt(benchMatch[1]!, 10) : undefined,
    shuttle: shuttleMatch ? parseFloat(shuttleMatch[1]!) : undefined,
    threeCone: threeConeMatch ? parseFloat(threeConeMatch[1]!) : undefined,
    height: heightMatch ? heightMatch[1]!.trim() : undefined,
    weight: weightMatch ? parseInt(weightMatch[1]!, 10) : undefined,
    broad: broadMatch ? broadMatch[1]!.trim() : undefined,
  };
}

async function scorePlayer(name: string): Promise<RASEntry> {
  try {
    const pageUrl = await findPlayerPage(name);
    if (!pageUrl) return { ras: null };
    const html = await cachedFetch(pageUrl);
    const parsed = parseRASFromPage(html);
    if (!parsed) return { ras: null, source: pageUrl };
    return { ...parsed, source: pageUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[fetchRAS] ${name}: ${msg}`);
    return { ras: null };
  }
}

function uniqueNames(): string[] {
  const seen = new Set<string>();
  const collect = (list: PlayerSeed[]) => {
    for (const p of list) {
      if (p.name && p.name.trim()) seen.add(p.name.trim());
    }
  };
  collect(playersJson as PlayerSeed[]);
  // mock files use `player` field, normalize
  const mockNames = (arr: { player: string }[]) => arr.map((x) => ({ name: x.player }));
  collect(mockNames(predictedJson as { player: string }[]));
  collect(mockNames(myPredicted as { player: string }[]));
  collect(mockNames(myGM as { player: string }[]));
  collect(mockNames(claudesGM as { player: string }[]));
  return Array.from(seen).filter(Boolean).sort();
}

async function main() {
  const names = uniqueNames();
  console.log(`[fetchRAS] scoring ${names.length} unique prospects...`);

  const existing: Record<string, RASEntry> = {};
  try {
    const raw = await fs.readFile(OUT_PATH, 'utf8');
    Object.assign(existing, JSON.parse(raw));
    console.log(`[fetchRAS] loaded ${Object.keys(existing).length} cached entries from ${OUT_PATH}`);
  } catch { /* first run */ }

  const out: Record<string, RASEntry> = { ...existing };

  for (const name of names) {
    if (out[name] && out[name].ras !== undefined) {
      // already attempted; skip unless explicitly told to refresh
      continue;
    }
    const entry = await scorePlayer(name);
    out[name] = entry;
    const msg = entry.ras !== null ? `RAS ${entry.ras}` : 'no RAS data';
    console.log(`  · ${name.padEnd(30)} ${msg}`);
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
  const withRAS = Object.values(out).filter((e) => e.ras !== null).length;
  console.log(`[fetchRAS] wrote ${OUT_PATH}: ${withRAS}/${Object.keys(out).length} with RAS data`);
}

main().catch((err) => {
  console.error('[fetchRAS] fatal:', err);
  process.exit(1);
});
