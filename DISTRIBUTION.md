# findarepo GEO distribution playbook

The on-site GEO work is live (AI crawlers allowed, `llms.txt`, `/data/` JSON API, quotable answer blocks, AI referral tracking, a daily GEO audit). The remaining lever is **off-page**: getting findarepo and its MCP server cited where both developers and AIs look. These steps need a human (Daryl), since they involve publishing accounts and posting.

Write everything below with no dashes, per the house style.

---

## 1. Publish the MCP server (do this first, npx install depends on it)

The README tells people to run `npx -y findarepo-mcp`. That only works once it is on npm.

```bash
cd "~/Claude Code2/findarepo-mcp"

# a) create the GitHub repo (public)
gh repo create Chiefaii/findarepo-mcp --public --source=. --remote=origin --push

# b) publish to npm (needs `npm login` once)
npm publish --access public
```

After publishing, verify the install path works from a clean machine:

```bash
npx -y findarepo-mcp   # should print "findarepo MCP server running (stdio)"
```

---

## 2. Submit to MCP registries (where AIs and devs discover servers)

These registries are themselves crawled and quoted by AI assistants, so a listing is both distribution and GEO.

| Registry | How to submit |
|----------|----------------|
| **modelcontextprotocol/servers** (official community list) | PR adding findarepo under "Community Servers" |
| **Smithery** (smithery.ai) | Connect the GitHub repo, it auto-indexes |
| **mcp.so** | Submit form with repo URL |
| **PulseMCP** (pulsemcp.com) | Submit server form |
| **Glama** (glama.ai/mcp/servers) | Add via GitHub |
| **Awesome MCP Servers** (punkpeye/awesome-mcp-servers) | PR (entry text below) |

**Ready entry text** for the awesome-list / official list:

```
- [findarepo](https://github.com/Chiefaii/findarepo-mcp): Find the best MCP servers, Claude skills, and trending GitHub repos, ranked daily by measured star velocity. Includes fake-star credibility checks.
```

---

## 3. Get findarepo.com itself cited (GitHub carries the most weight with LLMs)

LLMs heavily weight GitHub and a handful of community hubs. Aim to get **findarepo.com** linked from:

- **Awesome lists**: awesome-mcp-servers, awesome-claude, awesome-ai-tools. PR entry:
  ```
  - [findarepo](https://findarepo.com): Daily measured rankings of MCP servers, Claude skills, and trending repos, with a public JSON data API and a fake-star checker.
  ```
- A short **GitHub repo** for findarepo-mcp (above) that links back to findarepo.com in its README (already done).
- Replies on relevant **Reddit/HN/Threads** threads when people ask "where do I find MCP servers / Claude skills" (link, do not spam).

---

## 4. Launch posts (drafts, Daryl posts, no dashes)

**Show HN**
> Title: Show HN: findarepo, daily measured rankings of MCP servers and Claude skills
> Body: I kept finding stale "awesome" lists for MCP servers and Claude skills, so I built a site that re-ranks them every day by measured GitHub star velocity, not editorial picks. It also flags repos with suspicious star bursts, and there is now a public JSON API plus an MCP server so your AI can query it directly. Feedback welcome.

**Reddit (r/ClaudeAI, r/mcp)**
> Title: I built an MCP server that finds other MCP servers and Claude skills, ranked daily
> Body: findarepo measures star velocity daily and now exposes it as an MCP server. Ask Claude "find me an MCP server for Postgres" and it answers from live measured data. Free, npx install. Site: findarepo.com

**Threads (@chiefaii)**
> Your AI can now find the best MCP servers for you. I shipped an MCP server for findarepo: ask Claude or Cursor "best MCP server for web scraping" and it pulls live, measured rankings. Free. Link in bio.

---

## 5. Track whether it is working

- **Analytics**: the dashboard now has an "AI" traffic bucket. Watch it grow at findarepo.com/stats.
- **GEO audit**: `node pipeline/geo-audit.mjs` on the VPS asks the target questions and logs whether findarepo appears. Baseline on launch day was 0/8. Re-run weekly and watch the hit rate climb as crawls catch up and citations accumulate. History is in `data/state/geo-audit.json`.
