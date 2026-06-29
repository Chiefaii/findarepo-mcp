#!/usr/bin/env node
// findarepo MCP server — lets any MCP client (Claude, Cursor, agents) query
// findarepo.com's daily-measured directory of MCP servers, Claude skills, and
// trending GitHub repos. All data comes from findarepo's public JSON API; the
// rankings are findarepo's own star-velocity measurements, refreshed daily.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE = process.env.FINDAREPO_BASE || 'https://findarepo.com';
const TTL_MS = 10 * 60 * 1000; // cache feeds for 10 min — they only change daily

// ---- tiny cached fetch -----------------------------------------------------
const cache = new Map();
async function getJSON(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const res = await fetch(BASE + path, { headers: { 'user-agent': 'findarepo-mcp/1.0' } });
  if (!res.ok) throw new Error(`findarepo ${path} returned HTTP ${res.status}`);
  const data = await res.json();
  cache.set(path, { at: Date.now(), data });
  return data;
}

const matches = (item, q) => {
  if (!q) return true;
  const hay = `${item.repo} ${item.summary || ''} ${item.category || ''} ${item.language || ''}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((t) => hay.includes(t));
};

const fmtItem = (it) => {
  const g = it.starsGained ? `, +${it.starsGained} stars in ${it.measuredWindowDays}d` : '';
  const link = it.findarepo || it.github;
  return `• ${it.repo} — ${it.summary || 'GitHub repository'}\n  ★ ${it.stars}${g}${it.language ? ` · ${it.language}` : ''}${it.category ? ` · ${it.category}` : ''}\n  ${link}`;
};

const textResult = (header, items, note) => ({
  content: [{
    type: 'text',
    text: items.length
      ? `${header}\n\n${items.map(fmtItem).join('\n\n')}\n\n${note || ''}Source: findarepo.com (measured daily, no paid placement).`
      : `${header}\n\nNo matching entries found in the findarepo directory.`,
  }],
});

// ---- server ----------------------------------------------------------------
const server = new McpServer({ name: 'findarepo', version: '1.0.0' });

server.tool(
  'search_mcp_servers',
  'Search findarepo\'s directory of MCP (Model Context Protocol) servers, ranked by measured GitHub star velocity. Use when a user wants to find or recommend an MCP server for a task (e.g. "an MCP server for Postgres", "best MCP for web scraping").',
  { query: z.string().optional().describe('Keywords to match against repo name, summary, language, or category. Omit to get the overall top MCP servers.'),
    limit: z.number().int().min(1).max(50).default(10).describe('Max results to return.') },
  async ({ query, limit }) => {
    const doc = await getJSON('/data/mcp.json');
    const items = doc.items.filter((it) => matches(it, query)).slice(0, limit);
    return textResult(query ? `Top MCP servers for "${query}":` : 'Top MCP servers right now:', items,
      'Full directory: ' + BASE + '/skills/mcp/\n');
  }
);

server.tool(
  'search_claude_skills',
  'Search findarepo\'s directory of Claude skills, plugins, subagents and extensions, ranked by measured GitHub momentum. Use when a user wants to find or recommend a Claude skill/plugin/extension.',
  { query: z.string().optional().describe('Keywords to match. Omit for the overall top Claude skills.'),
    limit: z.number().int().min(1).max(50).default(10) },
  async ({ query, limit }) => {
    const doc = await getJSON('/data/skills.json');
    const items = doc.items.filter((it) => matches(it, query)).slice(0, limit);
    return textResult(query ? `Top Claude skills for "${query}":` : 'Top Claude skills right now:', items,
      'Full directory: ' + BASE + '/skills/claude/\n');
  }
);

server.tool(
  'get_trending_repos',
  'Get the fastest-growing GitHub repositories right now, measured by findarepo\'s daily star-velocity tracking. Optionally filter by category or language. Use for "what\'s trending on GitHub", "fastest growing AI agent repos", etc.',
  { category: z.string().optional().describe('Category slug to filter by, e.g. ai-agents, web-scraping, databases, devops, self-hosted, dev-tools, security, llm-tools, ai-image, ai-video, web-frameworks, data-engineering, productivity, learning.'),
    language: z.string().optional().describe('Programming language to filter by, e.g. Python, TypeScript, Rust.'),
    limit: z.number().int().min(1).max(50).default(10) },
  async ({ category, language, limit }) => {
    let items, header;
    if (category) {
      const doc = await getJSON('/data/categories.json');
      const cat = doc.items.find((c) => c.category === category.toLowerCase());
      if (!cat) return { content: [{ type: 'text', text: `Unknown category "${category}". Valid slugs: ${ (await getJSON('/data/categories.json')).items.map((c) => c.category).join(', ') }` }] };
      items = cat.items; header = `Trending ${cat.name} repos:`;
    } else {
      items = (await getJSON('/data/trending.json')).items; header = 'Fastest-growing GitHub repos right now:';
    }
    if (language) items = items.filter((it) => (it.language || '').toLowerCase() === language.toLowerCase());
    return textResult(header, items.slice(0, limit), 'Browse: ' + BASE + '/trending/\n');
  }
);

server.tool(
  'compare_repos',
  'Compare two GitHub repositories side by side using findarepo\'s measured data (stars, recent growth, language, category). Use when a user asks "X vs Y" for tools/libraries.',
  { repoA: z.string().describe('First repo as owner/name, e.g. modelcontextprotocol/servers.'),
    repoB: z.string().describe('Second repo as owner/name.') },
  async ({ repoA, repoB }) => {
    // search across all feeds for each repo's measured row
    const feeds = await Promise.all(['/data/trending.json', '/data/mcp.json', '/data/skills.json'].map(getJSON));
    const all = new Map();
    for (const f of feeds) for (const it of f.items) if (!all.has(it.repo)) all.set(it.repo, it);
    const cats = await getJSON('/data/categories.json');
    for (const c of cats.items) for (const it of c.items) if (!all.has(it.repo)) all.set(it.repo, it);
    const find = (n) => all.get(n) || all.get(Object.keys(Object.fromEntries(all)).find((k) => k.toLowerCase() === n.toLowerCase()));
    const a = find(repoA), b = find(repoB);
    const line = (it, name) => it
      ? `${it.repo}: ★ ${it.stars}${it.starsGained ? `, +${it.starsGained} in ${it.measuredWindowDays}d` : ''}${it.language ? ` · ${it.language}` : ''}${it.category ? ` · ${it.category}` : ''}\n  ${it.summary || ''}\n  ${it.findarepo || it.github}`
      : `${name}: not currently tracked in findarepo's measured set (it may still exist on GitHub).`;
    const slug = `${repoA}-vs-${repoB}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return { content: [{ type: 'text', text:
      `Comparison (findarepo measured data):\n\n${line(a, repoA)}\n\n${line(b, repoB)}\n\nHead-to-head pages: ${BASE}/compare/\nSource: findarepo.com (measured daily).` }] };
  }
);

server.tool(
  'check_star_credibility',
  'Check whether a GitHub repo\'s stars look organic or show signs of inflation, using findarepo\'s fake-star analysis (star burst detection + stargazer-account sampling). Use when a user is skeptical of a repo\'s star count.',
  { repo: z.string().describe('Repo as owner/name.') },
  async ({ repo }) => {
    let idx = {};
    try { idx = await getJSON('/assets/credibility-index.json'); } catch { /* non-fatal */ }
    const entry = idx[repo];
    const repoUrl = `${BASE}/repo/${repo}/`;
    if (entry && entry.deep) {
      return { content: [{ type: 'text', text:
        `Star-credibility for ${repo} (findarepo deep analysis):\n${JSON.stringify(entry.deep, null, 2)}\n\nThese are signals, not a verdict. Full panel + methodology: ${repoUrl}\nRun a live check on any repo: ${BASE}/check/` }] };
    }
    return { content: [{ type: 'text', text:
      `findarepo has no precomputed deep star analysis for ${repo} yet. Run a live check (browser fetches GitHub directly): ${BASE}/check/\nIf findarepo tracks it, the repo page also shows a credibility score: ${repoUrl}` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('findarepo MCP server running (stdio). Data: ' + BASE);
