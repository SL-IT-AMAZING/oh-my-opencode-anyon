# MCP Integration

The MCP (Model Context Protocol) system in oh-my-opencode provides a three-tier architecture for integrating external tools and services. MCPs enable agents to access web search, documentation lookup, code search, and custom capabilities through a unified protocol.

## Overview

### Three-Tier MCP System

```
┌─────────────────────────────────────────────────────────────┐
│                   MCP Integration Layers                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  TIER 1: Built-in MCPs (Remote HTTP)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ websearch (Exa/Tavily) | context7 | grep_app            │ │
│  │ Location: src/mcp/                                      │ │
│  │ Transport: Remote HTTP (SSE/Streamable)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  TIER 2: Claude Code Compatible MCPs                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ User: ~/.claude/.mcp.json                               │ │
│  │ Project: .mcp.json, .claude/.mcp.json                   │ │
│  │ Transport: stdio (local) or HTTP (remote)               │ │
│  │ Features: ${VAR} env expansion, OAuth support           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  TIER 3: Skill-Embedded MCPs                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Defined in: SKILL.md YAML frontmatter or mcp.json       │ │
│  │ Loaded by: SkillMcpManager                              │ │
│  │ Lifecycle: Lazy init, 5-minute idle cleanup             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### MCP Transport Types

| Transport | Protocol | Use Case | Example |
|-----------|----------|----------|---------|
| **Remote HTTP** | SSE/Streamable HTTP | Cloud services, APIs | Exa, Context7 |
| **stdio** | stdin/stdout | Local processes | Playwright MCP, custom CLIs |

## Built-in MCPs (Tier 1)

Built-in MCPs are remote HTTP services bundled with oh-my-opencode. They require no configuration and work out of the box.

### Available Built-in MCPs

| Name | URL | Purpose | Auth |
|------|-----|---------|------|
| `websearch` | mcp.exa.ai / mcp.tavily.com | Real-time web search | Optional (EXA_API_KEY / TAVILY_API_KEY) |
| `context7` | mcp.context7.com/mcp | Library documentation | Optional (CONTEXT7_API_KEY) |
| `grep_app` | mcp.grep.app | GitHub code search | None |

### Websearch Configuration

The websearch MCP supports multiple providers:

```jsonc
// oh-my-opencode.jsonc
{
  "websearch": {
    "provider": "exa"  // or "tavily"
  }
}
```

| Provider | Auth | API Key Required | Notes |
|----------|------|------------------|-------|
| `exa` (default) | x-api-key header | No | Works without key, better with key |
| `tavily` | Bearer token | Yes | Requires TAVILY_API_KEY |

### Disabling Built-in MCPs

```jsonc
{
  "disabled_mcps": ["websearch", "grep_app"]
}
```

### Adding a New Built-in MCP

1. **Create the MCP config file**

```typescript
// src/mcp/my-service.ts
type RemoteMcpConfig = {
  type: "remote"
  url: string
  enabled: boolean
  headers?: Record<string, string>
  oauth?: false
}

export const my_service: RemoteMcpConfig = {
  type: "remote" as const,
  url: "https://mcp.myservice.com/mcp",
  enabled: true,
  headers: process.env.MY_SERVICE_API_KEY
    ? { "x-api-key": process.env.MY_SERVICE_API_KEY }
    : undefined,
  oauth: false as const,
}
```

2. **Register in index.ts**

```typescript
// src/mcp/index.ts
import { my_service } from "./my-service"

export function createBuiltinMcps(disabledMcps: string[] = [], config?: OhMyOpenCodeConfig) {
  const mcps: Record<string, RemoteMcpConfig> = {}

  // ... existing MCPs

  if (!disabledMcps.includes("my_service")) {
    mcps.my_service = my_service
  }

  return mcps
}
```

3. **Add to schema**

```typescript
// src/mcp/types.ts
export const McpNameSchema = z.enum([
  "websearch",
  "context7",
  "grep_app",
  "my_service",  // Add here
])
```

## Claude Code Compatible MCPs (Tier 2)

MCPs defined in `.mcp.json` files are automatically loaded, providing compatibility with Claude Code's MCP system.

### File Locations (Priority Order)

```
1. .claude/.mcp.json     (project-local, highest priority)
2. .mcp.json             (project root)
3. ~/.claude/.mcp.json   (user-level)
```

### Config Format

```json
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@my-org/my-mcp@latest"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    },
    "remote-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

### Environment Variable Expansion

The `${VAR}` syntax expands environment variables:

```json
{
  "mcpServers": {
    "my-mcp": {
      "command": "npx",
      "args": ["-y", "@my-org/mcp@latest"],
      "env": {
        "API_KEY": "${MY_API_KEY}",          // Expands to process.env.MY_API_KEY
        "BASE_URL": "${BASE_URL:-default}"   // With default value
      }
    }
  }
}
```

### Server Configuration Options

```typescript
interface ClaudeCodeMcpServer {
  // Transport type (inferred from url/command if not specified)
  type?: "http" | "sse" | "stdio"
  
  // For HTTP/SSE transport
  url?: string
  headers?: Record<string, string>
  
  // For stdio transport
  command?: string
  args?: string[]
  env?: Record<string, string>
  
  // OAuth configuration
  oauth?: {
    clientId?: string
    scopes?: string[]
  }
  
  // Disable this server
  disabled?: boolean
}
```

### Disabling via Config

To disable an MCP defined in a parent config:

```json
{
  "mcpServers": {
    "unwanted-mcp": {
      "disabled": true
    }
  }
}
```

## Skill-Embedded MCPs (Tier 3)

Skills can include MCP configurations that are loaded on-demand when the skill is activated.

### Defining in SKILL.md

```yaml
---
name: my-skill
description: "Skill with embedded MCP"
mcp:
  my-mcp-server:
    command: npx
    args:
      - "@my-org/my-mcp@latest"
    env:
      API_KEY: "${MY_API_KEY}"
---

# My Skill

This skill uses the my-mcp-server MCP...
```

### Defining in mcp.json

Create `mcp.json` in the skill directory (takes precedence over frontmatter):

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "npx",
      "args": ["@my-org/my-mcp@latest"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

### SkillMcpManager Lifecycle

The `SkillMcpManager` handles skill MCP lifecycle:

```
┌─────────────────────────────────────────────────────────────┐
│                 Skill MCP Lifecycle                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. DISCOVERY                                                 │
│     - Skill loaded → MCP config extracted                    │
│     - Config validated (url or command required)             │
│                                                               │
│  2. LAZY INITIALIZATION                                       │
│     - Client NOT created until first tool call               │
│     - Connection type inferred (http or stdio)               │
│     - Environment variables expanded                          │
│                                                               │
│  3. CONNECTION                                                │
│     - Stdio: Spawn process, connect via stdin/stdout         │
│     - HTTP: Connect via StreamableHTTPClientTransport        │
│     - OAuth flow triggered if configured                     │
│                                                               │
│  4. USAGE                                                     │
│     - Tools/resources accessed via skill_mcp tool            │
│     - lastUsedAt timestamp updated on each call              │
│                                                               │
│  5. CLEANUP                                                   │
│     - Idle timeout: 5 minutes                                │
│     - Signal handlers: SIGINT, SIGTERM, SIGBREAK             │
│     - Session cleanup: All clients for session closed        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Using Skill MCPs

The `skill_mcp` tool invokes skill-embedded MCPs:

```typescript
// Tool call
skill_mcp({
  mcp_name: "my-mcp-server",
  tool_name: "my_tool",
  arguments: { param: "value" }
})

// Or for resources
skill_mcp({
  mcp_name: "my-mcp-server",
  resource_name: "my_resource"
})

// Or for prompts
skill_mcp({
  mcp_name: "my-mcp-server",
  prompt_name: "my_prompt",
  arguments: { arg: "value" }
})
```

## MCP Loader Implementation

### Claude Code MCP Loader

```typescript
// src/features/claude-code-mcp-loader/loader.ts

interface McpConfigPath {
  path: string
  scope: McpScope  // "user" | "project" | "local"
}

function getMcpConfigPaths(): McpConfigPath[] {
  return [
    { path: join(getClaudeConfigDir(), ".mcp.json"), scope: "user" },
    { path: join(process.cwd(), ".mcp.json"), scope: "project" },
    { path: join(process.cwd(), ".claude", ".mcp.json"), scope: "local" },
  ]
}

export async function loadMcpConfigs(): Promise<McpLoadResult> {
  const servers: Record<string, McpServerConfig> = {}
  const loadedServers: LoadedMcpServer[] = []
  
  for (const { path, scope } of getMcpConfigPaths()) {
    const config = await loadMcpConfigFile(path)
    if (!config?.mcpServers) continue

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      // Handle disabled servers
      if (serverConfig.disabled) {
        delete servers[name]
        continue
      }

      // Transform and store
      const transformed = transformMcpServer(name, serverConfig)
      servers[name] = transformed
      loadedServers.push({ name, scope, config: transformed })
    }
  }

  return { servers, loadedServers }
}
```

### MCP Server Transformation

```typescript
// src/features/claude-code-mcp-loader/transformer.ts

export function transformMcpServer(
  name: string,
  config: ClaudeCodeMcpServer
): McpServerConfig {
  // Expand environment variables
  const expanded = expandEnvVarsInObject(config)

  // Determine transport type
  if (expanded.url) {
    return {
      type: "remote",
      url: expanded.url,
      headers: expanded.headers,
      enabled: true,
    }
  }

  if (expanded.command) {
    return {
      type: "local",
      command: [expanded.command, ...(expanded.args || [])],
      environment: expanded.env,
      enabled: true,
    }
  }

  throw new Error(`Invalid MCP config for "${name}": missing url or command`)
}
```

## Connection Types

### HTTP Transport (Remote MCPs)

For remote MCP servers using HTTP/SSE:

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

const transport = new StreamableHTTPClientTransport(
  new URL(config.url),
  {
    requestInit: {
      headers: config.headers,
    },
  }
)

const client = new Client({ name: "oh-my-opencode", version: "1.0" })
await client.connect(transport)
```

### Stdio Transport (Local MCPs)

For local MCP processes using stdin/stdout:

```typescript
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

const transport = new StdioClientTransport({
  command: config.command,
  args: config.args,
  env: {
    ...createCleanMcpEnvironment(),
    ...config.env,
  },
})

const client = new Client({ name: "oh-my-opencode", version: "1.0" })
await client.connect(transport)
```

## OAuth Support

MCPs can require OAuth authentication:

```json
{
  "mcpServers": {
    "oauth-protected": {
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "clientId": "your-client-id",
        "scopes": ["read", "write"]
      }
    }
  }
}
```

The `McpOAuthProvider` handles:
- Token acquisition and refresh
- Step-up authentication (additional scopes)
- Token caching per server URL

## Best Practices

### Built-in MCPs

1. **Use remote HTTP**: Built-in MCPs should be stateless services
2. **Optional auth**: Support both authenticated and unauthenticated use
3. **Config factory**: Use factory functions for dynamic config (like websearch)

### Claude Code MCPs

1. **Environment variables**: Never hardcode secrets; use `${VAR}` syntax
2. **Scope appropriately**: User-level for personal tools, project for team tools
3. **Version lock**: Pin npm packages to avoid breaking changes

### Skill MCPs

1. **Lazy loading**: MCPs only connect when needed
2. **Clean environment**: Use `createCleanMcpEnvironment()` to prevent leaks
3. **Error handling**: Provide helpful error messages for missing config

## File Reference

| File | Purpose |
|------|---------|
| `src/mcp/index.ts` | Built-in MCP factory |
| `src/mcp/websearch.ts` | Exa/Tavily websearch config |
| `src/mcp/context7.ts` | Context7 docs config |
| `src/mcp/grep-app.ts` | Grep.app code search config |
| `src/mcp/types.ts` | McpNameSchema |
| `src/features/claude-code-mcp-loader/loader.ts` | .mcp.json loading |
| `src/features/claude-code-mcp-loader/transformer.ts` | Config transformation |
| `src/features/claude-code-mcp-loader/env-expander.ts` | ${VAR} expansion |
| `src/features/claude-code-mcp-loader/types.ts` | MCP types |
| `src/features/skill-mcp-manager/manager.ts` | Skill MCP lifecycle (617 lines) |
| `src/features/skill-mcp-manager/types.ts` | Skill MCP types |
| `src/features/mcp-oauth/provider.ts` | OAuth handling |

## Next Steps

- Return to [README.md](./README.md) for the guide index
