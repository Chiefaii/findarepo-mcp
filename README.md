# findarepo MCP server

An [MCP](https://modelcontextprotocol.io) server that lets Claude, Cursor, and any MCP-capable agent query [**findarepo.com**](https://findarepo.com) directly. It is the daily directory of **MCP servers**, **Claude skills**, and **trending GitHub repos**, ranked by real star velocity (not editorial picks, no paid placement).

Ask your AI things like *"find me an MCP server for Postgres"*, *"what are the fastest-growing AI agent repos this week?"*, or *"is this repo's star count legit?"* and it answers from findarepo's measured data.

## Tools

| Tool | What it does |
|------|--------------|
| `search_mcp_servers` | Find MCP servers by keyword, ranked by measured momentum |
| `search_claude_skills` | Find Claude skills, plugins, subagents and extensions |
| `get_trending_repos` | Fastest-growing repos, optionally by category or language |
| `compare_repos` | Two repos side by side with measured stats |
| `check_star_credibility` | findarepo's fake-star analysis for a repo |

All data comes from findarepo's public JSON API and is refreshed daily.

## Install

Requires Node 18+. No build step. It runs straight from `npx`.

### Claude Code

```bash
claude mcp add findarepo -- npx -y findarepo-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "findarepo": {
      "command": "npx",
      "args": ["-y", "findarepo-mcp"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json` (or the project's `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "findarepo": {
      "command": "npx",
      "args": ["-y", "findarepo-mcp"]
    }
  }
}
```

Restart the client and the `findarepo` tools appear.

## Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `FINDAREPO_BASE` | `https://findarepo.com` | Override the data source (e.g. for testing). |

## Telemetry

To understand which tools are useful, the server sends an anonymous usage ping when a tool runs. It includes **only the tool name and the server version**. It never sends your queries, arguments, results, or any personal data, and it sets no cookies. The ping is fire-and-forget, so it never slows down or breaks a tool call.

Turn it off completely by setting an environment variable:

```json
{
  "mcpServers": {
    "findarepo": {
      "command": "npx",
      "args": ["-y", "findarepo-mcp"],
      "env": { "FINDAREPO_TELEMETRY": "0" }
    }
  }
}
```

## How it works

The server is a thin, cached client over findarepo's public data feeds:

- `https://findarepo.com/data/mcp.json`
- `https://findarepo.com/data/skills.json`
- `https://findarepo.com/data/trending.json`
- `https://findarepo.com/data/categories.json`

Feeds are cached for 10 minutes (they only change once a day). Rankings are findarepo's own star-velocity measurements. Underlying repo data is from the GitHub REST API.

## License

MIT. Data is free to use with attribution to **findarepo.com**.
