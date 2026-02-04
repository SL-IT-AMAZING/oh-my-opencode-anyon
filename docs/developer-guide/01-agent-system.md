# Agent System Guide

This guide explains how the agent system works and how to add new agents to oh-my-opencode.

## Table of Contents

- [Overview](#overview)
- [Agent Architecture](#agent-architecture)
- [Agent Types](#agent-types)
- [Creating a New Agent](#creating-a-new-agent)
- [Agent Prompt Metadata](#agent-prompt-metadata)
- [Model Fallback Chains](#model-fallback-chains)
- [Tool Restrictions](#tool-restrictions)
- [Registration Process](#registration-process)
- [Best Practices](#best-practices)

---

## Overview

Agents in oh-my-opencode are specialized AI personalities that:
- Have specific roles and responsibilities
- Use optimized models for their task domain
- Have restricted tool access based on their role
- Can be invoked via `delegate_task` or directly

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Hierarchy                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Primary Agents (UI model selection respected)              │
│  ├── Sisyphus      → Main orchestrator                     │
│  ├── Atlas         → Master orchestrator (holds todos)     │
│  └── Prometheus    → Strategic planner                     │
│                                                             │
│  Subagents (own fallback chains)                           │
│  ├── Oracle        → Read-only consultation                │
│  ├── Librarian     → External research                     │
│  ├── Explore       → Fast codebase search                  │
│  ├── Hephaestus    → Autonomous deep worker                │
│  ├── Metis         → Pre-planning analysis                 │
│  ├── Momus         → Plan review                           │
│  ├── Multimodal    → Media analysis                        │
│  └── Sisyphus-Junior → Category-spawned executor           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Architecture

### Core Types

```typescript
// src/agents/types.ts

// Agent mode determines UI model selection behavior
type AgentMode = "primary" | "subagent" | "all"

// Factory function signature
type AgentFactory = ((model: string) => AgentConfig) & {
  mode: AgentMode
}

// Agent configuration (from OpenCode SDK)
interface AgentConfig {
  name: string
  description: string
  prompt: string           // System prompt
  model?: string           // e.g., "anthropic/claude-opus-4-5"
  temperature?: number     // 0.1 for code, 0.3 for analysis
  variant?: string         // "max", "medium", "high"
  thinking?: {
    budget: number         // Token budget for thinking
  }
}

// Metadata for Sisyphus prompt generation
interface AgentPromptMetadata {
  category: "exploration" | "specialist" | "advisor" | "utility"
  cost: "FREE" | "CHEAP" | "EXPENSIVE"
  triggers: DelegationTrigger[]
  useWhen?: string[]
  avoidWhen?: string[]
  keyTrigger?: string
  dedicatedSection?: string
}
```

### Agent Modes Explained

| Mode | Behavior | Example Agents |
|------|----------|----------------|
| `primary` | Respects user's UI model selection. If user selects "claude-sonnet" in UI, agent uses it. | Sisyphus, Atlas, Prometheus |
| `subagent` | Ignores UI selection. Uses own fallback chain for optimal model. | Oracle, Explore, Librarian |
| `all` | Available in both contexts. OpenCode compatibility. | - |

---

## Agent Types

### Primary Agents

**Sisyphus** - Main orchestrator
```typescript
// The "boss" agent that:
// - Receives user requests
// - Delegates to specialist agents
// - Coordinates work completion
// - Uses dynamic prompt with delegation tables
```

**Atlas** - Master orchestrator
```typescript
// Alternative orchestrator that:
// - Holds and manages the todo list
// - Provides structured task tracking
// - Works with Sisyphus delegation system
```

**Prometheus** - Strategic planner
```typescript
// Planning specialist that:
// - Conducts requirements interviews
// - Creates detailed work plans
// - Never implements - planning only
```

### Subagents

**Oracle** - Read-only consultant
```typescript
// High-IQ consultation agent:
// - Architecture decisions
// - Complex debugging
// - CANNOT write/edit files
// - Expensive but accurate
```

**Explore** - Fast codebase search
```typescript
// Contextual grep specialist:
// - Fast and cheap
// - Multiple search angles
// - Pattern discovery
// - CANNOT write/edit
```

**Librarian** - External research
```typescript
// Research specialist:
// - Official documentation
// - GitHub code search
// - OSS implementation examples
// - Context7, grep.app integration
```

---

## Creating a New Agent

### Step 1: Create the Agent File

Create `src/agents/my-agent.ts`:

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory, AgentPromptMetadata } from "./types"

// System prompt for your agent
const MY_AGENT_SYSTEM_PROMPT = `
You are a specialized agent for [DOMAIN].

## Your Role
- [Primary responsibility]
- [Secondary responsibility]

## Guidelines
- [Guideline 1]
- [Guideline 2]

## Constraints
- [What you should NOT do]
`

// Agent factory function
export function createMyAgent(model: string): AgentConfig {
  return {
    name: "my-agent",
    description: "Brief description of what this agent does",
    model,
    prompt: MY_AGENT_SYSTEM_PROMPT,
    temperature: 0.1,  // Low for code, higher for creative tasks
    // Optional: thinking budget for complex reasoning
    thinking: {
      budget: 16000,  // Token budget
    },
  }
}

// CRITICAL: Set the agent mode
createMyAgent.mode = "subagent" as const  // or "primary"

// Metadata for Sisyphus prompt generation
export const MY_AGENT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",  // exploration | specialist | advisor | utility
  cost: "CHEAP",           // FREE | CHEAP | EXPENSIVE
  triggers: [
    {
      domain: "Your Domain",
      trigger: "When to use this agent",
    },
  ],
  useWhen: [
    "Specific scenario 1",
    "Specific scenario 2",
  ],
  avoidWhen: [
    "When NOT to use this agent",
  ],
  // Optional: appears in Phase 0 Key Triggers
  keyTrigger: "Trigger phrase → fire my-agent",
}
```

### Step 2: Add to Agent Sources

Edit `src/agents/utils.ts`:

```typescript
import { createMyAgent, MY_AGENT_PROMPT_METADATA } from "./my-agent"

// Add to agent sources
const agentSources: Record<BuiltinAgentName, AgentSource> = {
  // ... existing agents
  "my-agent": createMyAgent,
}

// Add metadata for Sisyphus prompt generation
const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  // ... existing metadata
  "my-agent": MY_AGENT_PROMPT_METADATA,
}
```

### Step 3: Update Type Definitions

Edit `src/agents/types.ts`:

```typescript
export type BuiltinAgentName =
  | "sisyphus"
  | "oracle"
  // ... existing agents
  | "my-agent"  // Add your agent
```

### Step 4: Update Config Schema

Edit `src/config/schema.ts`:

```typescript
export const AgentNameSchema = z.enum([
  "sisyphus",
  "oracle",
  // ... existing agents
  "my-agent",  // Add your agent
])
```

### Step 5: Export from Index

Edit `src/agents/index.ts`:

```typescript
export { createMyAgent, MY_AGENT_PROMPT_METADATA } from "./my-agent"
```

### Step 6: Build and Test

```bash
# Rebuild schema
bun run build:schema

# Full build
bun run build

# Test locally in OpenCode
```

---

## Agent Prompt Metadata

Metadata drives **dynamic Sisyphus prompt generation**. Instead of hardcoding delegation tables, the system generates them from agent metadata.

### How It Works

```
Agent Metadata           dynamic-agent-prompt-builder.ts         Sisyphus Prompt
     │                              │                                  │
     ▼                              ▼                                  ▼
┌─────────────┐              ┌─────────────────┐              ┌─────────────────┐
│ category    │──────────────│ buildKeyTriggers│──────────────│ Phase 0 Triggers│
│ cost        │              │ buildToolSelect │              │ Tool Selection  │
│ triggers    │              │ buildDelegation │              │ Delegation Table│
│ useWhen     │              │ buildOracleSection│            │ Oracle Section  │
│ avoidWhen   │              └─────────────────┘              └─────────────────┘
└─────────────┘
```

### Metadata Fields Explained

```typescript
interface AgentPromptMetadata {
  // Groups agent in Sisyphus prompt sections
  category: "exploration" | "specialist" | "advisor" | "utility"
  
  // Appears in Tool & Agent Selection table
  cost: "FREE" | "CHEAP" | "EXPENSIVE"
  
  // Generates Delegation Table rows
  triggers: [{
    domain: "Frontend UI/UX",       // Domain column
    trigger: "Visual changes only"  // Trigger column
  }]
  
  // When to use (for detailed sections)
  useWhen: ["Complex debugging", "Architecture review"]
  
  // When NOT to use
  avoidWhen: ["Simple file operations", "First attempt"]
  
  // Appears in Phase 0 Key Triggers (BEFORE classification)
  keyTrigger: "External library mentioned → fire librarian"
  
  // Optional: full markdown section for complex agents (like Oracle)
  dedicatedSection: "## Oracle Usage\n..."
}
```

### Example: Oracle Metadata

```typescript
export const ORACLE_PROMPT_METADATA: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  triggers: [
    { domain: "Architecture decisions", trigger: "Multi-system tradeoffs" },
    { domain: "Self-review", trigger: "After completing significant implementation" },
    { domain: "Hard debugging", trigger: "After 2+ failed fix attempts" },
  ],
  useWhen: [
    "Complex architecture design",
    "2+ failed fix attempts",
    "Unfamiliar code patterns",
    "Security/performance concerns",
  ],
  avoidWhen: [
    "Simple file operations (use direct tools)",
    "First attempt at any fix (try yourself first)",
    "Questions answerable from code you've read",
    "Trivial decisions (variable names, formatting)",
  ],
}
```

---

## Model Fallback Chains

Agents specify fallback chains for when primary models are unavailable.

### Defining Fallback Chains

Edit `src/shared/model-requirements.ts`:

```typescript
export const AGENT_MODEL_REQUIREMENTS: Record<string, AgentModelRequirement> = {
  "my-agent": {
    // Try these models in order
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-sonnet-4-5" },
      { providers: ["openai"], model: "gpt-5.2" },
      { providers: ["google"], model: "gemini-3-flash" },
    ],
    // Optional: require specific model (no fallback)
    // requiresModel: "openai/gpt-5.2-codex",
    
    // Optional: require at least one model from chain to be available
    // requiresAnyModel: true,
  },
}
```

### How Resolution Works

```typescript
// Resolution priority:
// 1. User-specified model (from config override)
// 2. UI-selected model (for primary agents)
// 3. Fallback chain (try each in order)
// 4. System default model

const resolution = resolveModelPipeline({
  intent: { uiSelectedModel, userModel },
  constraints: { availableModels },
  policy: { fallbackChain, systemDefaultModel },
})
```

---

## Tool Restrictions

Restrict which tools an agent can use based on its role.

### Defining Restrictions

Edit `src/shared/agent-tool-restrictions.ts`:

```typescript
export function getAgentToolRestrictions(agentName: string) {
  // Read-only agents
  if (agentName === "oracle" || agentName === "my-agent") {
    return {
      write: false,
      edit: false,
      task: false,
      delegate_task: false,
    }
  }
  
  // Exploration agents (no recursion)
  if (agentName === "explore" || agentName === "librarian") {
    return {
      write: false,
      edit: false,
      task: false,
      delegate_task: false,
      call_omo_agent: false,
    }
  }
  
  // Allow all tools by default
  return {}
}
```

### Alternative: Tool Allowlist

For very restricted agents:

```typescript
export function createAgentToolAllowlist(tools: string[]) {
  // Only these tools are allowed, all others denied
  return { allowlist: tools }
}

// Usage: multimodal-looker only gets 'read'
if (agentName === "multimodal-looker") {
  return createAgentToolAllowlist(["read"])
}
```

---

## Registration Process

### Complete Checklist

When adding a new agent, ensure you:

- [ ] Create `src/agents/my-agent.ts` with factory and metadata
- [ ] Add to `agentSources` in `src/agents/utils.ts`
- [ ] Add metadata to `agentMetadata` in `src/agents/utils.ts`
- [ ] Update `BuiltinAgentName` type in `src/agents/types.ts`
- [ ] Update `AgentNameSchema` in `src/config/schema.ts`
- [ ] Export from `src/agents/index.ts`
- [ ] Add model requirements in `src/shared/model-requirements.ts` (if needed)
- [ ] Add tool restrictions in `src/shared/agent-tool-restrictions.ts` (if needed)
- [ ] Run `bun run build:schema` to update JSON schema
- [ ] Run `bun run build` to verify
- [ ] Test agent invocation via `delegate_task`

### Testing Your Agent

```typescript
// Test via delegate_task
delegate_task(
  subagent_type="my-agent",
  load_skills=[],
  run_in_background=false,
  prompt="Test prompt for my agent"
)

// Or via category if you added one
delegate_task(
  category="my-category",
  load_skills=["relevant-skill"],
  run_in_background=false,
  prompt="Test prompt"
)
```

---

## Best Practices

### 1. Single Responsibility

Each agent should have ONE clear purpose:
- ✅ "Explore - fast codebase grep"
- ✅ "Oracle - read-only consultation"
- ❌ "Helper - does everything"

### 2. Appropriate Temperature

| Task Type | Temperature |
|-----------|-------------|
| Code generation | 0.1 |
| Code review | 0.1 |
| Creative writing | 0.5-0.7 |
| Analysis | 0.3 |

### 3. Clear Constraints

Be explicit about what the agent should NOT do:

```typescript
const PROMPT = `
## Constraints
- NEVER modify files directly - you are read-only
- NEVER suggest changes without evidence
- NEVER speculate about code you haven't read
`
```

### 4. Thinking Budget

For complex reasoning agents, allocate thinking budget:

```typescript
thinking: {
  budget: 32000,  // For complex architecture decisions
}
```

Recommended budgets:
- Simple tasks: 8000-16000
- Complex reasoning: 32000
- Strategic planning: 32000+

### 5. Tool Restrictions Match Role

If agent is "read-only", enforce it:
- No `write`, `edit` tools
- No `delegate_task` (prevent recursion)
- Consider allowlist for maximum safety

### 6. Meaningful Metadata

Good metadata helps Sisyphus delegate correctly:

```typescript
// ✅ Specific and actionable
triggers: [
  { domain: "TypeScript types", trigger: "Complex generic patterns" }
]

// ❌ Vague and unhelpful
triggers: [
  { domain: "Code", trigger: "When needed" }
]
```

---

## Example: Complete Agent Implementation

See `src/agents/oracle.ts` for a production example:

```typescript
// Simplified Oracle implementation
import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentFactory, AgentPromptMetadata } from "./types"

const ORACLE_SYSTEM_PROMPT = `
You are Oracle - a read-only high-IQ consultant for debugging and architecture.

## Your Role
- Provide strategic advice on architecture decisions
- Help debug complex issues after multiple failed attempts
- Review code and suggest improvements

## Constraints
- You are READ-ONLY. You cannot modify any files.
- Do not attempt to fix bugs directly - advise only.
- Be concise and actionable.
`

export function createOracleAgent(model: string): AgentConfig {
  return {
    name: "oracle",
    description: "Read-only consultation for architecture and debugging",
    model,
    prompt: ORACLE_SYSTEM_PROMPT,
    temperature: 0.1,
    thinking: { budget: 32000 },
  }
}

createOracleAgent.mode = "subagent" as const

export const ORACLE_PROMPT_METADATA: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  triggers: [
    { domain: "Architecture decisions", trigger: "Multi-system tradeoffs" },
    { domain: "Hard debugging", trigger: "After 2+ failed fix attempts" },
  ],
  useWhen: [
    "Complex architecture design",
    "2+ failed fix attempts",
    "Unfamiliar code patterns",
  ],
  avoidWhen: [
    "Simple file operations",
    "First attempt at any fix",
    "Trivial decisions",
  ],
}
```

---

## Next Steps

- [02-hook-system.md](./02-hook-system.md) - Adding lifecycle hooks
- [04-delegation-orchestration.md](./04-delegation-orchestration.md) - How delegation works
