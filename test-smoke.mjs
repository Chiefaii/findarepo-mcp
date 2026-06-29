// Smoke test: spin up the server over stdio and exercise every tool.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: 'node', args: ['index.js'] });
const client = new Client({ name: 'smoke', version: '1.0.0' });
await client.connect(transport);

const tools = await client.listTools();
console.log('TOOLS:', tools.tools.map((t) => t.name).join(', '));

const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  const txt = r.content.map((c) => c.text).join('\n');
  console.log(`\n=== ${name}(${JSON.stringify(args)}) ===\n` + txt.split('\n').slice(0, 6).join('\n'));
};

await call('search_mcp_servers', { query: 'postgres', limit: 3 });
await call('search_claude_skills', { limit: 2 });
await call('get_trending_repos', { category: 'ai-agents', limit: 2 });
await call('compare_repos', { repoA: 'modelcontextprotocol/servers', repoB: 'punkpeye/awesome-mcp-servers' });
await call('check_star_credibility', { repo: 'oven-sh/bun' });

await client.close();
console.log('\nSMOKE OK');
process.exit(0);
