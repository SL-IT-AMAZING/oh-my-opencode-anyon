# Oh-My-OpenCode Developer Guide

This guide is for developers who want to fork, customize, or contribute to oh-my-opencode. It covers the architecture, extension points, and patterns used throughout the codebase.

## Who This Guide Is For

- **Plugin developers** extending oh-my-opencode functionality
- **Fork maintainers** customizing for specific use cases
- **Contributors** adding new features or fixing bugs
- **Power users** wanting to understand internals

## Prerequisites

Before diving in, ensure you have:

- **Bun** (package manager and runtime) - [Install Bun](https://bun.sh)
- **Node.js 18+** (for compatibility)
- **Basic TypeScript knowledge**
- **Familiarity with Claude Code / OpenCode concepts**

## Quick Start by Task

| I want to... | Start here |
|--------------|------------|
| Understand the codebase | [00-architecture-overview.md](./00-architecture-overview.md) |
| Add a new AI agent | [01-agent-system.md](./01-agent-system.md) |
| Create a lifecycle hook | [02-hook-system.md](./02-hook-system.md) |
| Build a new tool | [03-tool-system.md](./03-tool-system.md) |
| Customize task delegation | [04-delegation-orchestration.md](./04-delegation-orchestration.md) |
| Create a skill | [05-skill-system.md](./05-skill-system.md) |
| Modify configuration | [06-config-system.md](./06-config-system.md) |
| Add an MCP server | [07-mcp-integration.md](./07-mcp-integration.md) |

## Table of Contents

### Core Architecture

1. **[Architecture Overview](./00-architecture-overview.md)**
   - Project structure and directories
   - Core components and their relationships
   - Data flow and execution lifecycle
   - Extension points overview

### Extension Systems

2. **[Agent System](./01-agent-system.md)**
   - Agent types (Primary vs Subagent)
   - Factory pattern and metadata
   - Model fallback chains
   - Tool restrictions
   - Creating new agents

3. **[Hook System](./02-hook-system.md)**
   - Hook types (PreToolUse, PostToolUse, UserPromptSubmit, etc.)
   - Execution order and priority
   - Response transformation
   - Creating custom hooks

4. **[Tool System](./03-tool-system.md)**
   - Direct tools vs factory tools
   - Tool schema definition
   - Permission models
   - Tool categories
   - Creating new tools

5. **[Delegation & Orchestration](./04-delegation-orchestration.md)**
   - `delegate_task` categories
   - Background task management
   - Session continuity
   - Parallel execution patterns

### Configuration & Integration

6. **[Skill System](./05-skill-system.md)**
   - Skill vs Agent vs Tool
   - SKILL.md format and YAML frontmatter
   - Loading priority
   - Skill MCP integration
   - Creating custom skills

7. **[Config System](./06-config-system.md)**
   - Zod schema validation
   - JSONC format support
   - Multi-level config hierarchy
   - Extending the schema

8. **[MCP Integration](./07-mcp-integration.md)**
   - Three-tier MCP architecture
   - Built-in MCPs (Exa, Context7, Grep.app)
   - Claude Code compatible MCPs
   - Skill-embedded MCPs
   - Adding new MCP servers

## Key Concepts

### Extension Points Summary

| Extension Point | Purpose | Complexity |
|-----------------|---------|------------|
| **Skill** | Inject domain expertise | Low |
| **Config Override** | Customize behavior | Low |
| **Hook** | Intercept lifecycle events | Medium |
| **Tool** | Add new capabilities | Medium |
| **Agent** | Create autonomous workers | Medium-High |
| **Built-in MCP** | Add remote services | Medium |

### Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `createXXXHook` | `createTodoContinuationEnforcerHook` | Hook factories |
| `createXXXTool` | `createDelegateTaskTool` | Tool factories |
| `createXXXAgent` | `createSisyphusAgent` | Agent factories |
| kebab-case dirs | `background-agent/`, `skill-mcp-manager/` | Directory names |

### Package Management

| Tool | Usage |
|------|-------|
| `bun run` | Execute package.json scripts |
| `bun build` | Build ESM output |
| `bunx` | Execute binaries |
| `bun test` | Run test suite |

**Never use npm or yarn** - Bun exclusively.

## Development Workflow

### Building

```bash
bun run build        # ESM + declarations + schema
bun run rebuild      # Clean + build
bun run typecheck    # Type checking only
```

### Testing

```bash
bun test                     # Run all tests
bun test src/agents          # Run tests in directory
bun test --watch             # Watch mode
```

### Common Commands

```bash
bun run build:schema         # Regenerate JSON schema
bun run lint                 # Lint code
bun run format               # Format code
```

## File Structure Reference

```
src/
├── agents/        # AI agent definitions
├── hooks/         # Lifecycle hooks
├── tools/         # Tool implementations
├── features/      # Feature modules
│   ├── background-agent/      # Async task management
│   ├── builtin-skills/        # Core skills
│   ├── builtin-commands/      # Slash commands
│   ├── opencode-skill-loader/ # Skill discovery
│   ├── skill-mcp-manager/     # MCP lifecycle
│   └── claude-code-*/         # Compatibility layers
├── mcp/           # Built-in MCP servers
├── config/        # Zod schemas
├── shared/        # Cross-cutting utilities
└── index.ts       # Plugin entry point
```

## Anti-Patterns to Avoid

| Category | Forbidden | Alternative |
|----------|-----------|-------------|
| **Package Manager** | npm, yarn | Bun exclusively |
| **Types** | @types/node | bun-types |
| **Type Safety** | `as any`, `@ts-ignore` | Proper typing |
| **Testing** | Delete failing tests | Fix the code |
| **Agent Calls** | Sequential delegation | Parallel `delegate_task` |
| **Git** | Interactive mode (-i) | Non-interactive commands |

## Getting Help

- **AGENTS.md files**: Each major directory has a knowledge base
- **Test files**: `*.test.ts` files demonstrate usage
- **Source code**: The codebase is the ultimate documentation

## Contributing

1. Read the relevant guide section
2. Follow existing patterns in the codebase
3. Write tests (TDD: test first, then implement)
4. Ensure `bun run typecheck` passes
5. Ensure `bun test` passes
6. Create PR targeting `dev` branch (never `master`)

---

*This guide is part of [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode).*
