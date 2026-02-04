# Skill System

The Skill System provides a mechanism for injecting domain-specific expertise into agents. Unlike Agents (which are autonomous entities) or Tools (which are discrete operations), Skills are **prompt injections** that enhance an agent's capabilities with specialized knowledge, workflows, and constraints.

## Overview

### What is a Skill?

A Skill is a structured prompt template that gets injected into an agent's context when activated. Skills:

- **Inject specialized knowledge** into any agent that loads them
- **Carry optional MCP configurations** for tool access
- **Support tool restrictions** to limit agent capabilities when loaded
- **Can be user-defined or built-in**

### Skills vs Agents vs Tools

| Aspect | Skill | Agent | Tool |
|--------|-------|-------|------|
| **Purpose** | Inject expertise/workflow | Autonomous execution | Discrete operation |
| **Persistence** | Loaded per-task | Runs independently | Called on-demand |
| **Implementation** | Markdown + YAML frontmatter | TypeScript factory | TypeScript with schema |
| **Customization** | User-created or built-in | Config-override only | Code-defined |
| **Example** | `git-master`, `playwright` | `oracle`, `explore` | `delegate_task`, `lsp_rename` |

### Skill Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Skill Loading Pipeline                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Discovery (by priority)                                   │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ .opencode/skills/     (project - highest priority)   │ │
│     │ .claude/skills/       (project - Claude Code compat) │ │
│     │ ~/.config/opencode/skills/ (user global)             │ │
│     │ ~/.claude/skills/     (user - Claude Code compat)    │ │
│     │ Built-in skills       (lowest priority)              │ │
│     └─────────────────────────────────────────────────────┘ │
│                                                               │
│  2. Loading                                                   │
│     - Parse YAML frontmatter (metadata)                       │
│     - Extract markdown body (template)                        │
│     - Load MCP config (from frontmatter or mcp.json)          │
│     - Resolve allowed tools                                   │
│                                                               │
│  3. Injection                                                 │
│     - Template wrapped in <skill-instruction> tags            │
│     - $ARGUMENTS placeholder replaced with user input         │
│     - MCP clients initialized (lazy)                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Skill Types

### Built-in Skills

Defined in TypeScript, bundled with oh-my-opencode:

| Skill | Description | MCP Config |
|-------|-------------|------------|
| `playwright` | Browser automation via Playwright MCP | Yes |
| `agent-browser` | Browser automation via CLI tool | No |
| `frontend-ui-ux` | Designer-developer UI/UX expertise | No |
| `git-master` | Git operations, atomic commits, history search | No |
| `dev-browser` | Browser automation with persistent state | Yes |

**Location**: `src/features/builtin-skills/skills/`

### User-Defined Skills

Created by users in markdown format with YAML frontmatter:

**Locations** (by priority):
1. `.opencode/skills/` - Project-specific (highest priority)
2. `.claude/skills/` - Project-specific (Claude Code compatible)
3. `~/.config/opencode/skills/` - User global
4. `~/.claude/skills/` - User global (Claude Code compatible)

## Creating a Skill

### Step 1: Choose Location

```bash
# Project-specific skill (recommended for project workflows)
mkdir -p .opencode/skills/my-skill

# User global skill (for personal workflows)
mkdir -p ~/.config/opencode/skills/my-skill
```

### Step 2: Create SKILL.md

The skill file must be named either:
- `SKILL.md` (preferred)
- `<directory-name>.md` (e.g., `my-skill.md` in `my-skill/` directory)

```markdown
---
name: my-skill
description: "Brief description for skill selection UI. Triggers: 'keyword1', 'keyword2'."
model: anthropic/claude-sonnet-4-5
agent: sisyphus-junior
subtask: true
argument-hint: "What should I help with?"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
license: MIT
compatibility: "opencode >= 2.0"
metadata:
  author: "Your Name"
  version: "1.0.0"
mcp:
  my-mcp-server:
    command: npx
    args:
      - "@my-org/my-mcp@latest"
---

# My Skill Name

You are an expert in [domain]. Your role is to [purpose].

## Core Principles

1. **Principle One**: Description
2. **Principle Two**: Description

## Workflow

When invoked, follow these steps:

1. First, do X
2. Then, do Y
3. Finally, do Z

## Examples

### Example 1: Basic Usage

```bash
# Example command
my-command --flag value
```

## Anti-Patterns (NEVER)

- Never do X
- Never do Y

## User Request

$ARGUMENTS
```

### Step 3: Frontmatter Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Skill name (defaults to directory name) |
| `description` | string | Yes | Shown in skill picker. Include trigger phrases |
| `model` | string | No | Preferred model for this skill |
| `agent` | string | No | Preferred agent to run this skill |
| `subtask` | boolean | No | If `true`, runs as subtask of current session |
| `argument-hint` | string | No | Placeholder text for argument input |
| `allowed-tools` | string[] | No | Restrict which tools are available |
| `license` | string | No | License for the skill |
| `compatibility` | string | No | Version requirements |
| `metadata` | object | No | Arbitrary key-value pairs |
| `mcp` | object | No | MCP server configurations |

### Step 4: Optional MCP Configuration

Skills can include MCP servers in two ways:

**Option A: Frontmatter (inline)**

```yaml
---
name: my-skill
description: "Skill with MCP"
mcp:
  my-server:
    command: npx
    args:
      - "@my-org/my-mcp@latest"
    env:
      API_KEY: "${MY_API_KEY}"
---
```

**Option B: Separate mcp.json file**

Create `mcp.json` in the skill directory:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["@my-org/my-mcp@latest"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

The `mcp.json` takes precedence over frontmatter MCP config.

## Skill Loading

### Loading Priority

When multiple skills have the same name, the first one found wins:

```
1. .opencode/skills/           (opencode-project scope)
2. .claude/skills/             (project scope)
3. ~/.config/opencode/skills/  (opencode scope)
4. ~/.claude/skills/           (user scope)
5. Built-in skills             (builtin scope)
```

### Directory Structure Support

Skills support nested directories up to 2 levels deep:

```
.opencode/skills/
├── simple-skill/
│   └── SKILL.md              → name: "simple-skill"
├── category/
│   ├── nested-skill/
│   │   └── SKILL.md          → name: "category/nested-skill"
│   └── another/
│       └── SKILL.md          → name: "category/another"
└── flat-skill.md             → name: "flat-skill"
```

### Lazy Content Loading

Skills use lazy content loading for efficiency:

```typescript
interface LazyContentLoader {
  loaded: boolean
  content?: string
  load: () => Promise<string>
}
```

The skill body is loaded on first access, not at discovery time.

## Built-in Skill Implementation

### File Structure

```
src/features/builtin-skills/
├── skills/
│   ├── index.ts              # Barrel exports
│   ├── playwright.ts         # Playwright skill
│   ├── git-master.ts         # Git operations skill
│   ├── frontend-ui-ux.ts     # UI/UX skill
│   └── dev-browser.ts        # Browser automation skill
├── types.ts                  # BuiltinSkill interface
├── skills.ts                 # createBuiltinSkills factory
└── index.ts                  # Public exports
```

### BuiltinSkill Interface

```typescript
// src/features/builtin-skills/types.ts
export interface BuiltinSkill {
  name: string
  description: string
  template: string
  license?: string
  compatibility?: string
  metadata?: Record<string, unknown>
  allowedTools?: string[]
  agent?: string
  model?: string
  subtask?: boolean
  argumentHint?: string
  mcpConfig?: SkillMcpConfig
}
```

### Creating a Built-in Skill

```typescript
// src/features/builtin-skills/skills/my-skill.ts
import type { BuiltinSkill } from "../types"

export const mySkill: BuiltinSkill = {
  name: "my-skill",
  description: "Description shown in skill picker",
  template: `# My Skill

You are an expert in [domain].

## Instructions

1. Do X
2. Do Y

## User Request

$ARGUMENTS`,
  allowedTools: ["Read", "Write", "Edit"],
  mcpConfig: {
    "my-mcp": {
      command: "npx",
      args: ["@my-org/my-mcp@latest"],
    },
  },
}
```

### Registering the Skill

```typescript
// src/features/builtin-skills/skills/index.ts
export { mySkill } from "./my-skill"

// src/features/builtin-skills/skills.ts
import { mySkill } from "./skills/index"

export function createBuiltinSkills(options: CreateBuiltinSkillsOptions = {}): BuiltinSkill[] {
  const { disabledSkills } = options
  
  const skills = [
    browserSkill,
    frontendUiUxSkill,
    gitMasterSkill,
    devBrowserSkill,
    mySkill,  // Add here
  ]

  if (!disabledSkills) {
    return skills
  }

  return skills.filter((skill) => !disabledSkills.has(skill.name))
}
```

## Skill MCP Integration

### How Skill MCPs Work

When a skill with MCP config is loaded:

1. **Discovery**: MCP config extracted from skill
2. **Lazy Initialization**: MCP client created on first tool call
3. **Session Scoping**: Each session gets isolated MCP clients
4. **Cleanup**: Clients cleaned up after 5 minutes idle

### SkillMcpManager

The `SkillMcpManager` handles MCP lifecycle:

```typescript
// src/features/skill-mcp-manager/types.ts
export type SkillMcpConfig = Record<string, ClaudeCodeMcpServer>

export interface SkillMcpClientInfo {
  serverName: string
  skillName: string
  sessionID: string
}
```

### Invoking Skill MCPs

Use the `skill_mcp` tool to invoke skill-embedded MCPs:

```typescript
// Tool call
skill_mcp({
  mcp_name: "my-mcp",
  tool_name: "my_tool",
  arguments: { param: "value" }
})
```

## Tool Restrictions

### Allowed Tools

Skills can restrict which tools are available:

```yaml
---
name: read-only-skill
description: "Read-only exploration skill"
allowed-tools:
  - Read
  - Glob
  - Grep
---
```

### Tool Pattern Matching

Tool restrictions support patterns:

```yaml
allowed-tools:
  - Read              # Exact match
  - "Bash(git:*)"     # Pattern: any git command
  - "Bash(npm:*)"     # Pattern: any npm command
```

## Best Practices

### Skill Design

1. **Single Responsibility**: One skill = one workflow/expertise area
2. **Clear Triggers**: Include trigger phrases in description
3. **Structured Output**: Define expected output formats
4. **Anti-Patterns**: Explicitly list what NOT to do
5. **Examples**: Include concrete examples

### Skill Template Structure

```markdown
# [Skill Name]

Brief introduction to the skill's purpose.

---

## Mode Detection (if multiple modes)

| Request Pattern | Mode | Action |
|-----------------|------|--------|
| "pattern 1" | MODE_A | Do X |
| "pattern 2" | MODE_B | Do Y |

---

## Core Principles

1. **Principle**: Description
2. **Principle**: Description

---

## Workflow

### Phase 1: Setup

Steps...

### Phase 2: Execution

Steps...

### Phase 3: Verification

Steps...

---

## Output Format

```
EXPECTED OUTPUT FORMAT:
  field1: value
  field2: value
```

---

## Anti-Patterns (NEVER)

| Violation | Why It's Wrong |
|-----------|----------------|
| Pattern X | Reason |
| Pattern Y | Reason |

---

## Quick Reference

| Command | Description |
|---------|-------------|
| cmd1 | Does X |
| cmd2 | Does Y |
```

### MCP Configuration

1. **Prefer mcp.json**: Easier to maintain than inline YAML
2. **Use env vars**: `"${VAR_NAME}"` for secrets
3. **Version lock**: Pin MCP package versions for stability

### Tool Restrictions

1. **Principle of least privilege**: Only allow necessary tools
2. **Pattern matching**: Use patterns for tool families
3. **Document restrictions**: Explain why tools are restricted

## File Reference

| File | Purpose |
|------|---------|
| `src/features/builtin-skills/skills.ts` | Built-in skill factory |
| `src/features/builtin-skills/types.ts` | BuiltinSkill interface |
| `src/features/builtin-skills/skills/*.ts` | Individual skill definitions |
| `src/features/opencode-skill-loader/loader.ts` | Skill discovery and loading |
| `src/features/opencode-skill-loader/types.ts` | LoadedSkill, SkillMetadata types |
| `src/features/skill-mcp-manager/manager.ts` | MCP client lifecycle |
| `src/features/skill-mcp-manager/types.ts` | SkillMcpConfig types |

## Next Steps

- [06-config-system.md](./06-config-system.md) - Learn about configuration
- [07-mcp-integration.md](./07-mcp-integration.md) - Understand MCP integration
