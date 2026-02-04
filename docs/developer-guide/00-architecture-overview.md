# Architecture Overview

This document provides a comprehensive overview of oh-my-opencode's architecture for developers who want to fork and customize the project.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Extension Points](#extension-points)
- [Directory Structure](#directory-structure)
- [Key Patterns](#key-patterns)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OpenCode Runtime                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     oh-my-opencode Plugin                           │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │                                                                     │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│   │  │  Agents  │  │  Hooks   │  │  Tools   │  │  Features        │   │   │
│   │  │  (11)    │  │  (34)    │  │  (20+)   │  │  (Background,    │   │   │
│   │  │          │  │          │  │          │  │   Skills, MCPs)  │   │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │   │
│   │       │              │             │                │              │   │
│   │       └──────────────┴─────────────┴────────────────┘              │   │
│   │                              │                                      │   │
│   │                    ┌─────────▼─────────┐                           │   │
│   │                    │    Plugin Entry   │                           │   │
│   │                    │    (index.ts)     │                           │   │
│   │                    └───────────────────┘                           │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

oh-my-opencode is an **OpenCode plugin** that extends the base OpenCode functionality with:

1. **Multi-model agent orchestration** - 11 specialized AI agents
2. **Lifecycle hooks** - 34 hooks for customizing behavior
3. **Extended tools** - LSP, AST-grep, delegation, and more
4. **Background agent management** - Parallel task execution
5. **Skill system** - Reusable prompt injection
6. **MCP integration** - External tool servers

---

## Core Components

### 1. Agents (`src/agents/`)

Agents are AI personalities with specific roles and capabilities.

| Agent | Model | Role |
|-------|-------|------|
| **Sisyphus** | Claude Opus 4.5 | Primary orchestrator - delegates work to specialists |
| **Hephaestus** | GPT 5.2 Codex | Autonomous deep worker - goal-oriented execution |
| **Atlas** | Claude Sonnet 4.5 | Master orchestrator - holds todo list |
| **Oracle** | GPT 5.2 | Read-only consultant - architecture & debugging |
| **Librarian** | GLM 4.7 | Research agent - docs, GitHub, external references |
| **Explore** | Grok Code Fast | Fast codebase grep - contextual search |
| **Prometheus** | Claude Opus 4.5 | Strategic planner - interview-based planning |
| **Metis** | Claude Opus 4.5 | Pre-planning analysis - gap detection |
| **Momus** | GPT 5.2 | Plan reviewer - ruthless fault-finding |
| **Multimodal-Looker** | Gemini 3 Flash | Media analyzer - PDFs, images |
| **Sisyphus-Junior** | Claude Sonnet 4.5 | Category-spawned executor |

**Key Concept**: Agents have **modes**:
- `primary` - Respects user's UI model selection
- `subagent` - Uses own fallback chain, ignores UI selection

### 2. Hooks (`src/hooks/`)

Hooks intercept and modify behavior at specific lifecycle points.

| Hook Type | When Triggered | Use Case |
|-----------|----------------|----------|
| `PreToolUse` | Before any tool executes | Validation, modification |
| `PostToolUse` | After tool completes | Result transformation |
| `UserPromptSubmit` | When user sends message | Context injection |
| `Stop` | When agent stops | Cleanup, continuation |
| `SessionStart` | New session begins | Initialization |
| `MessagesTransform` | Before messages sent to model | Context modification |

**Performance Note**: `PreToolUse` hooks run on EVERY tool call. Keep them lightweight.

### 3. Tools (`src/tools/`)

Tools are capabilities the agent can invoke.

| Category | Tools | Purpose |
|----------|-------|---------|
| **LSP** | 6 tools | goto_definition, find_references, symbols, diagnostics, rename |
| **AST** | 2 tools | ast_grep_search, ast_grep_replace |
| **Search** | 2 tools | grep, glob |
| **Session** | 4 tools | list, read, search, info |
| **Delegation** | 2 tools | delegate_task, call_omo_agent |
| **Background** | 2 tools | background_output, background_cancel |

### 4. Features (`src/features/`)

Features are complex subsystems that combine multiple components.

| Feature | Purpose |
|---------|---------|
| `background-agent/` | Parallel task execution with concurrency control |
| `builtin-skills/` | Core skills (playwright, git-master, frontend-ui-ux) |
| `opencode-skill-loader/` | Skill discovery from multiple directories |
| `skill-mcp-manager/` | MCP server lifecycle management |
| `context-injector/` | AGENTS.md, README injection |
| `boulder-state/` | Todo persistence across sessions |

### 5. Config (`src/config/`)

Configuration with Zod validation and JSONC support.

```
Config Priority:
1. Project: .opencode/oh-my-opencode.json
2. User: ~/.config/opencode/oh-my-opencode.json
```

---

## Data Flow

### Agent Invocation Flow

```
User Message
     │
     ▼
┌────────────────┐
│ UserPromptSubmit│  ← Hooks inject context
│    Hooks       │
└────────────────┘
     │
     ▼
┌────────────────┐
│  Main Agent    │  ← Sisyphus/Atlas
│  (Orchestrator)│
└────────────────┘
     │
     ├─── Direct Tool Use ───────────────────────────────┐
     │         │                                          │
     │         ▼                                          │
     │    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
     │    │PreToolUse│ →  │  Tool    │ →  │PostToolUse│  │
     │    │  Hooks   │    │ Execute  │    │  Hooks   │  │
     │    └──────────┘    └──────────┘    └──────────┘  │
     │                                                    │
     └─── delegate_task ─────────────────────────────────┤
               │                                          │
               ▼                                          │
          ┌──────────────┐                               │
          │  Background  │  ← Async execution            │
          │   Manager    │                               │
          └──────────────┘                               │
               │                                          │
               ▼                                          │
          ┌──────────────┐                               │
          │  Subagent    │  ← Oracle, Explore, etc.     │
          │  Session     │                               │
          └──────────────┘                               │
               │                                          │
               ▼                                          │
          ┌──────────────┐                               │
          │   Result     │ ─────────────────────────────┘
          └──────────────┘
```

### Delegation Flow

```
delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"])
                    │
                    ▼
           ┌───────────────────┐
           │  Resolve Category │
           │  → Model config   │
           │  → Temperature    │
           │  → Prompt append  │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Resolve Skills   │
           │  → Load SKILL.md  │
           │  → Inject prompt  │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Spawn Agent      │
           │  → Sisyphus-Junior│
           │  → With category  │
           │    model config   │
           └───────────────────┘
```

---

## Extension Points

oh-my-opencode provides multiple extension points for customization:

| Extension | How to Add | Complexity |
|-----------|------------|------------|
| **New Agent** | Create factory in `src/agents/` | Medium |
| **New Hook** | Create factory in `src/hooks/` | Low-Medium |
| **New Tool** | Create directory in `src/tools/` | Medium |
| **New Skill** | Add `SKILL.md` in skills directory | Low |
| **New Category** | Add to config `categories` | Low |
| **New MCP** | Add config in `src/mcp/` | Medium |

See individual guides for detailed instructions:
- [01-agent-system.md](./01-agent-system.md) - Adding agents
- [02-hook-system.md](./02-hook-system.md) - Adding hooks
- [03-tool-system.md](./03-tool-system.md) - Adding tools
- [05-skill-system.md](./05-skill-system.md) - Adding skills

---

## Directory Structure

```
oh-my-opencode/
├── src/
│   ├── index.ts                 # Plugin entry point (788 lines)
│   │
│   ├── agents/                  # 11 AI agents
│   │   ├── sisyphus.ts          # Main orchestrator
│   │   ├── oracle.ts            # Consultation agent
│   │   ├── types.ts             # AgentConfig, AgentPromptMetadata
│   │   ├── utils.ts             # createBuiltinAgents(), model resolution
│   │   └── dynamic-agent-prompt-builder.ts  # Sisyphus prompt generation
│   │
│   ├── hooks/                   # 34 lifecycle hooks
│   │   ├── todo-continuation/   # Enforces task completion
│   │   ├── context-window/      # Monitors token usage
│   │   ├── comment-checker/     # Prevents comment bloat
│   │   └── [hook-name]/         # Each hook in its directory
│   │
│   ├── tools/                   # 20+ tools
│   │   ├── lsp/                 # 6 LSP tools
│   │   ├── ast-grep/            # AST search/replace
│   │   ├── delegate-task/       # Task delegation (1135 lines)
│   │   └── [tool-name]/         # Standard structure
│   │
│   ├── features/                # Complex subsystems
│   │   ├── background-agent/    # Async task management (1418 lines)
│   │   ├── builtin-skills/      # Core skills (1729 lines)
│   │   ├── opencode-skill-loader/
│   │   └── skill-mcp-manager/
│   │
│   ├── mcp/                     # Built-in MCP servers
│   │   ├── websearch.ts         # Exa search
│   │   ├── context7.ts          # Documentation
│   │   └── grep_app.ts          # GitHub code search
│   │
│   ├── config/                  # Configuration
│   │   └── schema.ts            # Zod validation schema
│   │
│   └── shared/                  # 66 utilities
│       ├── model-resolution.ts  # Fallback chains
│       └── agent-tool-restrictions.ts
│
├── docs/
│   ├── developer-guide/         # You are here
│   ├── guide/                   # User guides
│   └── configurations.md        # Config reference
│
└── script/                      # Build scripts
    └── build-schema.ts          # JSON schema generation
```

---

## Key Patterns

### 1. Factory Pattern

All agents, hooks, and most tools use factory functions:

```typescript
// Agent factory
export function createOracleAgent(model: string): AgentConfig {
  return {
    name: "oracle",
    model,
    description: "Strategic advisor...",
    prompt: ORACLE_SYSTEM_PROMPT,
    temperature: 0.1,
  }
}
createOracleAgent.mode = "subagent" as const

// Hook factory
export function createMyHook(ctx: PluginInput) {
  return {
    preToolUse: async (input) => { /* ... */ },
    postToolUse: async (input) => { /* ... */ },
  }
}

// Tool factory
export function createDelegateTask(options): ToolDefinition {
  return tool({
    description: "...",
    args: { /* ... */ },
    execute: async (args, ctx) => { /* ... */ },
  })
}
```

### 2. Metadata Pattern

Agents expose metadata for dynamic prompt generation:

```typescript
export const ORACLE_PROMPT_METADATA: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  triggers: [
    { domain: "Architecture decisions", trigger: "Multi-system tradeoffs" },
  ],
  useWhen: ["Complex debugging", "After 2+ failed fixes"],
  avoidWhen: ["Simple file operations", "First attempt at fix"],
}
```

This metadata is used by `dynamic-agent-prompt-builder.ts` to generate Sisyphus's delegation tables automatically.

### 3. Model Fallback Chain

Agents define fallback chains for model availability:

```typescript
// In shared/model-requirements.ts
export const AGENT_MODEL_REQUIREMENTS = {
  sisyphus: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-opus-4-5" },
      { providers: ["kimi"], model: "k2.5" },
      { providers: ["openai"], model: "gpt-5.2-codex" },
    ]
  }
}
```

### 4. Tool Restrictions

Agents have restricted tool access to enforce roles:

```typescript
// Read-only agents can't write
export function getAgentToolRestrictions(agentName: string) {
  if (agentName === "oracle") {
    return { write: false, edit: false, task: false, delegate_task: false }
  }
  // ...
}
```

---

## Next Steps

1. **[01-agent-system.md](./01-agent-system.md)** - Deep dive into agents
2. **[02-hook-system.md](./02-hook-system.md)** - Hook implementation guide
3. **[03-tool-system.md](./03-tool-system.md)** - Tool creation guide
4. **[04-delegation-orchestration.md](./04-delegation-orchestration.md)** - Orchestration mechanics
