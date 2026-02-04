# Delegation and Orchestration Guide

This guide explains how task delegation and multi-agent orchestration work in oh-my-opencode.

## Table of Contents

- [Overview](#overview)
- [Delegation Architecture](#delegation-architecture)
- [delegate_task Tool](#delegate_task-tool)
- [Background Agent Management](#background-agent-management)
- [Categories System](#categories-system)
- [Session Continuity](#session-continuity)
- [Customizing Delegation](#customizing-delegation)
- [Best Practices](#best-practices)

---

## Overview

oh-my-opencode uses a **multi-agent orchestration** pattern where:
1. A main agent (Sisyphus/Atlas) receives user requests
2. Work is delegated to specialized agents based on task type
3. Background agents run in parallel for efficiency
4. Results flow back to the orchestrator

```
┌─────────────────────────────────────────────────────────────────┐
│                  Orchestration Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Request                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                           │
│  │   Sisyphus      │  Main Orchestrator                        │
│  │  (Claude Opus)  │                                           │
│  └─────────────────┘                                           │
│       │                                                         │
│       ├──── delegate_task(category="quick") ─────────────────┐ │
│       │                      │                                │ │
│       │                      ▼                                │ │
│       │              ┌─────────────────┐                      │ │
│       │              │ Sisyphus-Junior │                      │ │
│       │              │ (with category  │                      │ │
│       │              │  model config)  │                      │ │
│       │              └─────────────────┘                      │ │
│       │                                                       │ │
│       ├──── delegate_task(subagent_type="oracle") ──────────┐│ │
│       │                      │                               ││ │
│       │                      ▼                               ││ │
│       │              ┌─────────────────┐                     ││ │
│       │              │     Oracle      │                     ││ │
│       │              │   (GPT 5.2)     │                     ││ │
│       │              └─────────────────┘                     ││ │
│       │                                                      ││ │
│       ├──── delegate_task(subagent="explore", bg=true) ─────┼┤ │
│       │                      │                              ││ │
│       │                      ▼                              ││ │
│       │              ┌─────────────────┐                    ││ │
│       │              │    Explore      │ ← Background       ││ │
│       │              │ (Grok Code Fast)│                    ││ │
│       │              └─────────────────┘                    ││ │
│       │                                                     ││ │
│       ◄─────────────────────────────────────────────────────┴┴─┤
│       │                                                        │
│       ▼                                                        │
│  Synthesize Results → Response to User                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Delegation Architecture

### Two Delegation Modes

| Mode | Command | Spawned Agent | Model Source |
|------|---------|---------------|--------------|
| **Category-based** | `delegate_task(category="X")` | Sisyphus-Junior | Category config |
| **Subagent-based** | `delegate_task(subagent_type="Y")` | Named agent (Oracle, Explore, etc.) | Agent's fallback chain |

### Why Two Modes?

**Category-based**: For generic implementation tasks
- Uses Sisyphus-Junior (a capable executor)
- Model/temperature configured per category
- Best for: "Implement feature X", "Fix bug Y"

**Subagent-based**: For specialized capabilities
- Uses purpose-built agents (Oracle for consultation, Explore for search)
- Agent has own optimal model and prompt
- Best for: Research, debugging consultation, fast search

---

## delegate_task Tool

### API Reference

```typescript
delegate_task({
  // REQUIRED
  prompt: string,           // Task description
  run_in_background: boolean,  // true=async, false=sync
  load_skills: string[],    // Skills to inject
  
  // MUTUALLY EXCLUSIVE (pick one)
  category?: string,        // e.g., "quick", "ultrabrain"
  subagent_type?: string,   // e.g., "oracle", "explore"
  
  // OPTIONAL
  session_id?: string,      // Continue existing session
  command?: string,         // Command that triggered this
})
```

### Usage Examples

```typescript
// Category-based: Quick fix
delegate_task({
  category: "quick",
  load_skills: ["git-master"],
  run_in_background: false,
  prompt: "Fix the typo in README.md line 42",
})

// Subagent-based: Research
delegate_task({
  subagent_type: "explore",
  load_skills: [],
  run_in_background: true,
  prompt: "Find all usages of AuthService in the codebase",
})

// Subagent-based: Consultation
delegate_task({
  subagent_type: "oracle",
  load_skills: [],
  run_in_background: false,
  prompt: "Review my approach: I plan to refactor the auth module...",
})

// Continue previous session
delegate_task({
  session_id: "ses_abc123",
  prompt: "Fix the type error you mentioned",
})
```

---

## Background Agent Management

### BackgroundManager

The `BackgroundManager` class handles async task execution:

```
┌─────────────────────────────────────────────────────────────────┐
│                 BackgroundManager Lifecycle                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  launch(input)                                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                               │
│  │   PENDING   │  Task created, waiting for slot               │
│  └─────────────┘                                               │
│       │                                                         │
│       ▼ (concurrency slot acquired)                            │
│  ┌─────────────┐                                               │
│  │   RUNNING   │  Session created, prompt sent                 │
│  └─────────────┘                                               │
│       │                                                         │
│       │◄──── poll (every 2s) ────────────────────┐             │
│       │                                          │              │
│       ▼ (3 consecutive idle polls)               │              │
│  ┌─────────────┐                                 │              │
│  │  COMPLETED  │  Task finished                  │              │
│  └─────────────┘                                 │              │
│       │                                          │              │
│       ▼                                          │              │
│  Release concurrency slot                        │              │
│  Notify parent session                           │              │
│                                                  │              │
│  ──── OR ────                                    │              │
│                                                  │              │
│  ┌─────────────┐                                 │              │
│  │   ERROR     │  Task failed                    │              │
│  └─────────────┘                                 │              │
│                                                  │              │
│  ┌─────────────┐                                 │              │
│  │  CANCELLED  │  Task cancelled                 │              │
│  └─────────────┘─────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Concurrency Control

```typescript
// Configuration in oh-my-opencode.json
{
  "background_task": {
    "defaultConcurrency": 5,
    "providerConcurrency": {
      "anthropic": 3,
      "openai": 5,
      "google": 10
    },
    "modelConcurrency": {
      "anthropic/claude-opus-4-5": 2  // Expensive model limited
    }
  }
}
```

Priority: `modelConcurrency` > `providerConcurrency` > `defaultConcurrency`

### Task States

| State | Description |
|-------|-------------|
| `pending` | In queue, waiting for concurrency slot |
| `running` | Session active, agent processing |
| `completed` | Agent finished successfully |
| `error` | Agent encountered error |
| `cancelled` | Manually cancelled |

---

## Categories System

### Built-in Categories

| Category | Default Model | Temperature | Use Case |
|----------|---------------|-------------|----------|
| `visual-engineering` | Gemini 3 Pro | 0.1 | Frontend, UI/UX, styling |
| `ultrabrain` | GPT 5.2 Codex | 0.1 | Complex logic, architecture |
| `deep` | Claude Opus | 0.1 | Goal-oriented problem solving |
| `artistry` | Gemini 3 Pro | 0.3 | Creative, unconventional approaches |
| `quick` | Claude Haiku | 0.1 | Simple fixes, typos |
| `unspecified-low` | Claude Sonnet | 0.1 | General tasks, low effort |
| `unspecified-high` | Claude Opus | 0.1 | General tasks, high effort |
| `writing` | Gemini 3 Flash | 0.3 | Documentation, prose |

### Category Configuration

```typescript
// src/tools/delegate-task/constants.ts
export const DEFAULT_CATEGORIES: Record<string, CategoryConfig> = {
  "visual-engineering": {
    model: "google/gemini-3-pro-preview",
    temperature: 0.1,
    description: "Frontend, UI/UX, design, styling, animation",
  },
  "ultrabrain": {
    model: "openai/gpt-5.2-codex",
    variant: "xhigh",
    temperature: 0.1,
    description: "Deep logical reasoning, complex architecture decisions",
  },
  // ...
}
```

### Custom Categories

Add via config:

```json
// oh-my-opencode.json
{
  "categories": {
    "my-domain": {
      "model": "anthropic/claude-sonnet-4-5",
      "temperature": 0.2,
      "description": "Domain-specific tasks",
      "prompt_append": "You are an expert in [domain]. Focus on..."
    }
  }
}
```

---

## Session Continuity

### Why Session IDs Matter

When you continue with `session_id`:
- Agent retains FULL conversation context
- No repeated exploration or setup
- Saves 70%+ tokens on follow-ups
- Maintains continuity

```typescript
// First call - returns session_id in result
const result1 = await delegate_task({
  subagent_type: "explore",
  prompt: "Find auth patterns in codebase",
  run_in_background: false,
  load_skills: [],
})
// Result includes: session_id: "ses_abc123"

// Continue same session
const result2 = await delegate_task({
  session_id: "ses_abc123",  // Continue!
  prompt: "Also look for JWT usage",
})
```

### When to Continue vs New Task

| Scenario | Action |
|----------|--------|
| Task failed/incomplete | Continue with `session_id` |
| Follow-up question | Continue with `session_id` |
| Multi-turn conversation | Always continue |
| Completely new topic | New task (no session_id) |

---

## Customizing Delegation

### Adding a Custom Category

1. **Define in config**:

```json
{
  "categories": {
    "backend-api": {
      "model": "openai/gpt-5.2",
      "temperature": 0.1,
      "description": "Backend API development",
      "prompt_append": "Focus on REST/GraphQL best practices..."
    }
  }
}
```

2. **Use in delegation**:

```typescript
delegate_task({
  category: "backend-api",
  load_skills: ["typescript-programmer"],
  prompt: "Implement the user CRUD endpoints",
  run_in_background: false,
})
```

### Modifying Default Categories

Override built-in categories:

```json
{
  "categories": {
    "quick": {
      "model": "anthropic/claude-sonnet-4-5",  // Override default Haiku
      "temperature": 0.1
    }
  }
}
```

### Adding Prompt Injection

Categories can inject additional prompt content:

```json
{
  "categories": {
    "security-focused": {
      "model": "openai/gpt-5.2",
      "prompt_append": "Always consider security implications. Check for: injection attacks, auth bypass, data exposure..."
    }
  }
}
```

---

## Implementation Details

### delegate_task Resolution Flow

```
delegate_task(args)
        │
        ▼
┌───────────────────────┐
│  Resolve Skills       │  Load skill content
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Resolve Category OR  │
│  Subagent Type        │
└───────────────────────┘
        │
        ├─── category ──────────────┐
        │                           ▼
        │               ┌───────────────────────┐
        │               │ Get category config   │
        │               │ (model, temp, prompt) │
        │               └───────────────────────┘
        │                           │
        │                           ▼
        │               ┌───────────────────────┐
        │               │ Spawn Sisyphus-Junior │
        │               │ with category config  │
        │               └───────────────────────┘
        │
        └─── subagent_type ─────────┐
                                    ▼
                        ┌───────────────────────┐
                        │ Resolve agent's model │
                        │ fallback chain        │
                        └───────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │ Spawn named agent     │
                        │ (Oracle, Explore...)  │
                        └───────────────────────┘
```

### Code Location

Key files for delegation:

```
src/tools/delegate-task/
├── tools.ts              # Main delegate_task tool (175 lines)
├── executor.ts           # Execution logic
├── categories.ts         # Category resolution
├── prompt-builder.ts     # System prompt building
├── constants.ts          # DEFAULT_CATEGORIES
└── types.ts              # Type definitions

src/features/background-agent/
├── manager.ts            # BackgroundManager (1418 lines)
├── concurrency.ts        # ConcurrencyManager
├── types.ts              # Task types
└── constants.ts          # Timeouts, polling intervals
```

---

## Best Practices

### 1. Use Background for Exploration

```typescript
// ✅ Good: Parallel exploration
delegate_task({ subagent_type: "explore", run_in_background: true, ... })
delegate_task({ subagent_type: "explore", run_in_background: true, ... })
delegate_task({ subagent_type: "librarian", run_in_background: true, ... })
// Collect results later

// ❌ Bad: Sequential exploration
await delegate_task({ subagent_type: "explore", run_in_background: false, ... })
await delegate_task({ subagent_type: "explore", run_in_background: false, ... })
```

### 2. Match Category to Task

```typescript
// ✅ Good: Category matches task domain
delegate_task({ category: "visual-engineering", ... })  // For UI work
delegate_task({ category: "ultrabrain", ... })          // For complex logic
delegate_task({ category: "quick", ... })               // For simple fixes

// ❌ Bad: Wrong category
delegate_task({ category: "quick", prompt: "Design new auth architecture" })
```

### 3. Load Relevant Skills

```typescript
// ✅ Good: Skills enhance agent capability
delegate_task({
  category: "visual-engineering",
  load_skills: ["frontend-ui-ux"],  // Relevant skill
  prompt: "Create a dark mode toggle component",
})

// ❌ Bad: Missing relevant skills
delegate_task({
  category: "visual-engineering",
  load_skills: [],  // No UI skill loaded
  prompt: "Create a complex animation system",
})
```

### 4. Continue Sessions When Appropriate

```typescript
// ✅ Good: Continue for follow-ups
const r1 = await delegate_task({ prompt: "Find X" })
const r2 = await delegate_task({
  session_id: r1.session_id,
  prompt: "Now find Y in same context",
})

// ❌ Bad: New session for related work
const r1 = await delegate_task({ prompt: "Find X" })
const r2 = await delegate_task({ prompt: "Find Y" })  // Lost context!
```

### 5. Limit Concurrency for Expensive Models

```json
{
  "background_task": {
    "modelConcurrency": {
      "anthropic/claude-opus-4-5": 2  // Limit expensive model
    }
  }
}
```

---

## Next Steps

- [05-skill-system.md](./05-skill-system.md) - Adding skills
- [06-config-system.md](./06-config-system.md) - Configuration system
