# Tool System Guide

This guide explains how the tool system works and how to add new tools to oh-my-opencode.

## Table of Contents

- [Overview](#overview)
- [Tool Architecture](#tool-architecture)
- [Tool Patterns](#tool-patterns)
- [Creating a New Tool](#creating-a-new-tool)
- [Tool Categories](#tool-categories)
- [Registration Process](#registration-process)
- [Best Practices](#best-practices)

---

## Overview

Tools are **capabilities** that agents can invoke to interact with the system. oh-my-opencode provides 20+ tools across 7 categories.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Tool Categories                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    LSP      │  │  AST-Grep   │  │   Search    │             │
│  │ (6 tools)   │  │ (2 tools)   │  │ (2 tools)   │             │
│  │             │  │             │  │             │             │
│  │ definition  │  │ search      │  │ grep        │             │
│  │ references  │  │ replace     │  │ glob        │             │
│  │ symbols     │  │             │  │             │             │
│  │ diagnostics │  │             │  │             │             │
│  │ rename      │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Session   │  │    Agent    │  │ Background  │             │
│  │ (4 tools)   │  │ (2 tools)   │  │ (2 tools)   │             │
│  │             │  │             │  │             │             │
│  │ list        │  │ delegate    │  │ output      │             │
│  │ read        │  │ call_omo    │  │ cancel      │             │
│  │ search      │  │             │  │             │             │
│  │ info        │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Skill     │  │   System    │                              │
│  │ (3 tools)   │  │ (2 tools)   │                              │
│  │             │  │             │                              │
│  │ skill       │  │ interactive │                              │
│  │ skill_mcp   │  │ look_at     │                              │
│  │ slashcommand│  │             │                              │
│  └─────────────┘  └─────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Architecture

### Core Types

```typescript
// From @opencode-ai/plugin
interface ToolDefinition {
  description: string
  args: Record<string, ArgSchema>
  execute: (args: unknown, context: ToolContext) => Promise<string>
}

interface ArgSchema {
  // Zod-like schema definition
  type: "string" | "number" | "boolean" | "array" | "object"
  description?: string
  optional?: boolean
}

interface ToolContext {
  sessionID: string
  directory: string
  // ... other context
}
```

### Two Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Direct ToolDefinition** | Static tools without runtime dependencies | grep, glob, LSP tools |
| **Factory Function** | Tools needing context, config, or managers | delegate_task, background tools |

---

## Tool Patterns

### Pattern 1: Direct ToolDefinition (Static)

For simple tools that don't need runtime context:

```typescript
// src/tools/grep/tools.ts
import { tool, type ToolDefinition } from "@opencode-ai/plugin"

export const grep: ToolDefinition = tool({
  description: "Search file contents using regex patterns",
  
  args: {
    pattern: tool.schema.string().describe("Regex pattern to search"),
    path: tool.schema.string().optional().describe("Directory to search"),
    include: tool.schema.string().optional().describe("File pattern filter"),
  },
  
  async execute(args) {
    const { pattern, path, include } = args as {
      pattern: string
      path?: string
      include?: string
    }
    
    // Implementation
    const results = await searchFiles(pattern, path, include)
    return formatResults(results)
  },
})
```

### Pattern 2: Factory Function (Context-Dependent)

For tools that need runtime context or shared managers:

```typescript
// src/tools/delegate-task/tools.ts
import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import type { BackgroundManager } from "../../features/background-agent"

export interface DelegateTaskOptions {
  manager: BackgroundManager
  client: OpenCodeClient
  directory: string
  userCategories?: Record<string, CategoryConfig>
}

export function createDelegateTask(options: DelegateTaskOptions): ToolDefinition {
  const { manager, client, directory, userCategories } = options
  
  return tool({
    description: "Spawn agent task with category-based delegation",
    
    args: {
      prompt: tool.schema.string().describe("Task prompt"),
      category: tool.schema.string().optional().describe("Task category"),
      subagent_type: tool.schema.string().optional().describe("Agent type"),
      run_in_background: tool.schema.boolean().describe("Async execution"),
      load_skills: tool.schema.array(tool.schema.string()).describe("Skills to load"),
    },
    
    async execute(args, context) {
      // Can use options (manager, client, etc.)
      const task = await manager.launch({
        prompt: args.prompt,
        category: args.category,
        // ...
      })
      
      return `Task launched: ${task.id}`
    },
  })
}
```

---

## Creating a New Tool

### Step 1: Create Tool Directory

Create `src/tools/my-tool/`:

```
my-tool/
├── index.ts      # Barrel export
├── tools.ts      # Tool implementation
├── types.ts      # Type definitions
└── constants.ts  # Constants (optional)
```

### Step 2: Define Types

`src/tools/my-tool/types.ts`:

```typescript
import { z } from "zod"

// Input validation schema
export const MyToolArgsSchema = z.object({
  input: z.string().describe("Input value"),
  options: z.object({
    flag: z.boolean().optional(),
    limit: z.number().optional(),
  }).optional(),
})

export type MyToolArgs = z.infer<typeof MyToolArgsSchema>

// Output types
export interface MyToolResult {
  success: boolean
  data: unknown
  message: string
}
```

### Step 3: Implement the Tool

`src/tools/my-tool/tools.ts`:

```typescript
import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import type { MyToolArgs } from "./types"

// Direct ToolDefinition pattern
export const my_tool: ToolDefinition = tool({
  description: `
    Brief description of what this tool does.
    
    Usage notes:
    - When to use this tool
    - What it returns
    - Important considerations
  `,
  
  args: {
    input: tool.schema.string().describe("The input to process"),
    options: tool.schema.object({
      flag: tool.schema.boolean().optional().describe("Enable feature X"),
      limit: tool.schema.number().optional().describe("Maximum results"),
    }).optional().describe("Tool options"),
  },
  
  async execute(args) {
    const { input, options } = args as MyToolArgs
    
    try {
      // Implementation
      const result = await processInput(input, options)
      
      // Return string (required)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      // Error handling
      const message = error instanceof Error ? error.message : String(error)
      return `Error: ${message}`
    }
  },
})

// OR: Factory pattern
export function createMyTool(config: MyToolConfig): ToolDefinition {
  return tool({
    description: "...",
    args: { /* ... */ },
    async execute(args, context) {
      // Can use config and context
      return "result"
    },
  })
}
```

### Step 4: Create Barrel Export

`src/tools/my-tool/index.ts`:

```typescript
export { my_tool } from "./tools"
export type { MyToolArgs, MyToolResult } from "./types"
```

### Step 5: Register the Tool

Edit `src/tools/index.ts`:

```typescript
import { my_tool } from "./my-tool"

// For static tools
export const builtinTools: Record<string, ToolDefinition> = {
  // ... existing tools
  my_tool,
}

// For factory tools, export separately
export { createMyTool } from "./my-tool"
```

### Step 6: Add to Plugin (Factory Only)

For factory tools, update `src/index.ts`:

```typescript
import { createMyTool } from "./tools"

// In OhMyOpenCodePlugin:
const myTool = createMyTool({
  // config
})

return {
  tool: {
    ...builtinTools,
    my_tool: myTool,  // Add factory tool
  },
  // ...
}
```

---

## Tool Categories

### LSP Tools

Language Server Protocol integration:

| Tool | Purpose |
|------|---------|
| `lsp_goto_definition` | Jump to symbol definition |
| `lsp_find_references` | Find all usages of symbol |
| `lsp_symbols` | Get document/workspace symbols |
| `lsp_diagnostics` | Get errors/warnings |
| `lsp_prepare_rename` | Check if rename is valid |
| `lsp_rename` | Rename symbol across workspace |

### AST-Grep Tools

AST-aware code search and replace:

| Tool | Purpose |
|------|---------|
| `ast_grep_search` | Search code patterns (25 languages) |
| `ast_grep_replace` | Replace code patterns (dry-run by default) |

### Search Tools

File and content search:

| Tool | Purpose |
|------|---------|
| `grep` | Regex content search (60s timeout, 10MB limit) |
| `glob` | File pattern matching (100 file limit) |

### Session Tools

Session management:

| Tool | Purpose |
|------|---------|
| `session_list` | List all sessions |
| `session_read` | Read session messages |
| `session_search` | Search session content |
| `session_info` | Get session metadata |

### Agent Tools

Agent invocation:

| Tool | Purpose |
|------|---------|
| `delegate_task` | Category/subagent-based delegation |
| `call_omo_agent` | Direct agent invocation |

### Background Tools

Background task management:

| Tool | Purpose |
|------|---------|
| `background_output` | Get task output |
| `background_cancel` | Cancel running tasks |

### Skill Tools

Skill system:

| Tool | Purpose |
|------|---------|
| `skill` | Load and execute skills |
| `skill_mcp` | Invoke skill-embedded MCPs |
| `slashcommand` | Execute slash commands |

---

## Registration Process

### For Static Tools (builtinTools)

```typescript
// src/tools/index.ts
export const builtinTools: Record<string, ToolDefinition> = {
  // Add your tool here
  my_tool,
}
```

These are automatically included in the plugin.

### For Factory Tools

```typescript
// 1. Export factory from tools/index.ts
export { createMyTool } from "./my-tool"

// 2. Create instance in src/index.ts
const myTool = createMyTool(config)

// 3. Add to returned tools
return {
  tool: {
    ...builtinTools,
    my_tool: myTool,
  },
}
```

### Complete Checklist

- [ ] Create tool directory `src/tools/my-tool/`
- [ ] Implement `tools.ts` with tool definition
- [ ] Define types in `types.ts`
- [ ] Create barrel export `index.ts`
- [ ] Add to `builtinTools` or export factory
- [ ] For factory tools, instantiate in `src/index.ts`
- [ ] Run `bun run build`
- [ ] Test tool invocation

---

## Best Practices

### 1. Tool Naming

```typescript
// ✅ Good: snake_case, descriptive
"lsp_goto_definition"
"ast_grep_search"
"session_list"

// ❌ Bad: inconsistent casing
"goToDefinition"
"ASTSearch"
```

### 2. Clear Descriptions

```typescript
description: `
  Search file contents using regular expressions.
  
  - Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+")
  - Filter files by pattern with the include parameter (e.g., "*.js")
  - Returns file paths with matches sorted by modification time
  
  Usage:
  - Search for patterns: grep(pattern="TODO.*fix", include="*.ts")
  - Search specific directory: grep(pattern="import", path="src/")
`,
```

### 3. Argument Descriptions

```typescript
args: {
  // ✅ Good: descriptive, examples
  pattern: tool.schema.string().describe(
    "Regex pattern to search (e.g., 'function\\s+\\w+', 'TODO.*')"
  ),
  
  // ❌ Bad: minimal description
  pattern: tool.schema.string().describe("Pattern"),
}
```

### 4. Error Handling

```typescript
async execute(args) {
  try {
    const result = await riskyOperation()
    return JSON.stringify(result)
  } catch (error) {
    // Return error as string, don't throw
    const message = error instanceof Error ? error.message : String(error)
    return `Error: ${message}\n\nTry: [suggestion]`
  }
}
```

### 5. Return Format

```typescript
// ✅ Good: structured, parseable
return JSON.stringify({
  success: true,
  count: results.length,
  results: results.slice(0, 100),
}, null, 2)

// ✅ Good: formatted for LLM readability
return `Found ${results.length} matches:\n\n${formatted}`

// ❌ Bad: raw data dump
return results.toString()
```

### 6. Resource Limits

```typescript
// Set reasonable limits
const MAX_RESULTS = 100
const TIMEOUT_MS = 60000
const MAX_OUTPUT_SIZE = 10 * 1024 * 1024  // 10MB

async execute(args) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  
  try {
    const results = await search(args, { signal: controller.signal })
    return formatResults(results.slice(0, MAX_RESULTS))
  } finally {
    clearTimeout(timeout)
  }
}
```

### 7. Context Usage (Factory Pattern)

```typescript
export function createMyTool(options: Options): ToolDefinition {
  const { client, directory } = options
  
  return tool({
    async execute(args, context) {
      // Use options for shared state
      const cache = options.cache
      
      // Use context for request-specific data
      const sessionID = context.sessionID
      
      // ...
    },
  })
}
```

---

## Example: Complete Tool Implementation

See `src/tools/grep/` for a production example:

```typescript
// src/tools/grep/tools.ts
import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

const TIMEOUT_MS = 60000
const MAX_OUTPUT_SIZE = 10 * 1024 * 1024

export const grep: ToolDefinition = tool({
  description: `
    Fast content search tool with safety limits (60s timeout, 10MB output).
    Searches file contents using regular expressions.
    Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+").
    Filter files by pattern with the include parameter (e.g., "*.js", "*.{ts,tsx}").
    Returns file paths with matches sorted by modification time.
  `,
  
  args: {
    pattern: tool.schema.string().describe("Regex pattern to search"),
    path: tool.schema.string().optional().describe("Directory to search"),
    include: tool.schema.string().optional().describe("File pattern filter"),
  },
  
  async execute(args) {
    const { pattern, path, include } = args as {
      pattern: string
      path?: string
      include?: string
    }
    
    const searchPath = path || "."
    
    try {
      const rgArgs = [
        "--json",
        "--max-filesize", "1M",
        pattern,
        searchPath,
      ]
      
      if (include) {
        rgArgs.push("--glob", include)
      }
      
      const { stdout } = await execFileAsync("rg", rgArgs, {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_SIZE,
      })
      
      return formatRipgrepOutput(stdout)
    } catch (error) {
      if (error.code === "ENOENT") {
        return "Error: ripgrep (rg) not found. Please install it."
      }
      return `Error: ${error.message}`
    }
  },
})
```

---

## Next Steps

- [04-delegation-orchestration.md](./04-delegation-orchestration.md) - How delegation works
- [05-skill-system.md](./05-skill-system.md) - Adding skills
