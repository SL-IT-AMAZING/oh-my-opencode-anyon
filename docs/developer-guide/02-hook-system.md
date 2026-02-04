# Hook System Guide

This guide explains how the hook system works and how to add new hooks to oh-my-opencode.

## Table of Contents

- [Overview](#overview)
- [Hook Events](#hook-events)
- [Hook Execution Order](#hook-execution-order)
- [Creating a New Hook](#creating-a-new-hook)
- [Hook Patterns](#hook-patterns)
- [Registration Process](#registration-process)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)

---

## Overview

Hooks are **lifecycle interceptors** that can modify, block, or react to agent behavior at specific points in the execution flow.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Hook Execution Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Message                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                       │
│  │ UserPromptSubmit    │ ← Can BLOCK, modify, detect keywords  │
│  │ (chat.message)      │                                       │
│  └─────────────────────┘                                       │
│       │                                                         │
│       ▼                                                         │
│  Agent Processing...                                            │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                       │
│  │ PreToolUse          │ ← Can BLOCK, validate, inject context │
│  │ (tool.execute.before)│                                       │
│  └─────────────────────┘                                       │
│       │                                                         │
│       ▼                                                         │
│  Tool Execution                                                 │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                       │
│  │ PostToolUse         │ ← Cannot block, transform output      │
│  │ (tool.execute.after)│                                       │
│  └─────────────────────┘                                       │
│       │                                                         │
│       ▼                                                         │
│  Agent continues or stops...                                    │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                       │
│  │ Stop                │ ← Cannot block, cleanup, continue     │
│  │ (event: session.stop)│                                       │
│  └─────────────────────┘                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hook Events

### Available Events

| Event | OpenCode Hook | Can Block | Typical Use Cases |
|-------|---------------|-----------|-------------------|
| `UserPromptSubmit` | `chat.message` | Yes | Keyword detection, slash commands, context injection |
| `PreToolUse` | `tool.execute.before` | Yes | Validate inputs, inject context, modify tool args |
| `PostToolUse` | `tool.execute.after` | No | Transform output, truncate, error recovery |
| `Stop` | `event` (session.stop) | No | Auto-continue, notifications, cleanup |
| `onSummarize` | Compaction | No | Preserve state, inject summary context |
| `MessagesTransform` | `chat.messages.transform` | No | Modify message history before sending |
| `ChatParams` | `chat.params` | No | Modify model parameters |

### Event Signatures

```typescript
// UserPromptSubmit (chat.message)
type ChatMessageHook = (
  input: { messages: Message[] },
  output: { response?: string }
) => Promise<void>

// PreToolUse (tool.execute.before)
type PreToolUseHook = (
  input: { tool: string; input: unknown },
  output: { block?: boolean; error?: string }
) => Promise<void>

// PostToolUse (tool.execute.after)
type PostToolUseHook = (
  input: { tool: string; input: unknown },
  output: { output: string }
) => Promise<void>

// Stop (event)
type EventHook = (
  { event }: { event: { type: string; properties?: unknown } }
) => Promise<void>

// MessagesTransform
type MessagesTransformHook = (
  output: { messages: Message[] }
) => Promise<void>
```

---

## Hook Execution Order

### UserPromptSubmit Hooks

```
User sends message
     │
     ├─→ keywordDetector      (detects ultrawork, search, etc.)
     ├─→ claudeCodeHooks      (Claude Code settings.json compat)
     ├─→ autoSlashCommand     (detects /command patterns)
     └─→ startWork            (Sisyphus work session)
```

### PreToolUse Hooks

```
Tool about to execute
     │
     ├─→ subagentQuestionBlocker   (blocks question tool in subagents)
     ├─→ questionLabelTruncator    (truncates question labels)
     ├─→ claudeCodeHooks           (Claude Code compat)
     ├─→ nonInteractiveEnv         (non-TTY handling)
     ├─→ commentChecker            (validates comments)
     ├─→ directoryAgentsInjector   (injects AGENTS.md)
     ├─→ directoryReadmeInjector   (injects README.md)
     ├─→ rulesInjector             (conditional rules)
     ├─→ prometheusMdOnly          (planner read-only)
     ├─→ sisyphusJuniorNotepad     (notepad injection)
     └─→ atlasHook                 (orchestration)
```

### PostToolUse Hooks

```
Tool completed
     │
     ├─→ claudeCodeHooks           (Claude Code compat)
     ├─→ toolOutputTruncator       (truncates large outputs)
     ├─→ contextWindowMonitor      (warns on low headroom)
     ├─→ commentChecker            (validates comments)
     ├─→ directoryAgentsInjector   (marks injected)
     ├─→ directoryReadmeInjector   (marks injected)
     ├─→ rulesInjector             (tracks rules)
     ├─→ emptyTaskResponseDetector (detects empty responses)
     ├─→ agentUsageReminder        (reminds of agents)
     ├─→ interactiveBashSession    (tmux session)
     ├─→ editErrorRecovery         (recovers from edit failures)
     ├─→ delegateTaskRetry         (retries failed delegations)
     ├─→ atlasHook                 (orchestration)
     └─→ taskResumeInfo            (resume info)
```

---

## Creating a New Hook

### Step 1: Create Hook Directory

Create `src/hooks/my-hook/index.ts`:

```typescript
import type { PluginInput } from "@opencode-ai/plugin"

export interface MyHookOptions {
  // Optional configuration
  enabled?: boolean
  threshold?: number
}

export function createMyHook(ctx: PluginInput, options?: MyHookOptions) {
  // Hook-scoped state (persists across calls)
  const state = new Map<string, unknown>()
  
  return {
    // PostToolUse hook - runs after tool execution
    "tool.execute.after": async (
      input: { tool: string; input: unknown },
      output: { output: string }
    ) => {
      // Only process specific tools
      if (input.tool !== "edit" && input.tool !== "write") {
        return
      }
      
      // Modify output (append, don't replace)
      output.output += "\n\n[My Hook]: Processing complete."
    },
    
    // PreToolUse hook - runs before tool execution
    "tool.execute.before": async (
      input: { tool: string; input: unknown },
      output: { block?: boolean; error?: string }
    ) => {
      // Example: block dangerous operations
      if (input.tool === "bash") {
        const cmd = (input.input as { command?: string })?.command
        if (cmd?.includes("rm -rf /")) {
          output.block = true
          output.error = "Dangerous command blocked"
        }
      }
    },
    
    // Event hook - cleanup on session stop
    "event": async ({ event }: { event: { type: string } }) => {
      if (event.type === "session.stop") {
        // Cleanup state for this session
        state.clear()
      }
    },
  }
}
```

### Step 2: Add to Config Schema

Edit `src/config/schema.ts`:

```typescript
export const HookNameSchema = z.enum([
  // ... existing hooks
  "my-hook",  // Add your hook
])

export type HookName = z.infer<typeof HookNameSchema>
```

### Step 3: Register in Plugin Entry

Edit `src/index.ts`:

```typescript
import { createMyHook } from "./hooks/my-hook"

// In OhMyOpenCodePlugin function:
const myHook = isHookEnabled("my-hook")
  ? createMyHook(ctx, { threshold: 100 })
  : null

// Return hook handlers
return {
  // ...
  
  "tool.execute.after": async (input, output) => {
    // ... existing hooks
    await myHook?.["tool.execute.after"]?.(input, output)
  },
  
  "tool.execute.before": async (input, output) => {
    // ... existing hooks
    await myHook?.["tool.execute.before"]?.(input, output)
  },
  
  "event": async (eventInput) => {
    // ... existing hooks
    await myHook?.["event"]?.(eventInput)
  },
}
```

### Step 4: Export from Index

Edit `src/hooks/index.ts`:

```typescript
export { createMyHook } from "./my-hook"
```

---

## Hook Patterns

### Pattern 1: Simple Single-Event Hook

For hooks that only handle one event type:

```typescript
export function createToolOutputTruncatorHook(ctx: PluginInput) {
  const MAX_OUTPUT = 50000
  
  return {
    "tool.execute.after": async (
      input: { tool: string; input: unknown },
      output: { output: string }
    ) => {
      if (output.output.length > MAX_OUTPUT) {
        output.output = output.output.slice(0, MAX_OUTPUT) + "\n[TRUNCATED]"
      }
    },
  }
}
```

### Pattern 2: Multi-Event with Shared State

For hooks that need state across events:

```typescript
interface SessionState {
  injectedFiles: Set<string>
  tokenCount: number
}

export function createContextInjectorHook(ctx: PluginInput) {
  // State per session
  const sessions = new Map<string, SessionState>()
  
  const getState = (sessionID: string): SessionState => {
    if (!sessions.has(sessionID)) {
      sessions.set(sessionID, {
        injectedFiles: new Set(),
        tokenCount: 0,
      })
    }
    return sessions.get(sessionID)!
  }
  
  return {
    "tool.execute.before": async (input, output) => {
      const sessionID = extractSessionID(input)
      const state = getState(sessionID)
      
      // Track injected files to avoid duplicates
      if (state.injectedFiles.has("AGENTS.md")) {
        return
      }
      
      // ... inject content
      state.injectedFiles.add("AGENTS.md")
    },
    
    "event": async ({ event }) => {
      if (event.type === "session.deleted") {
        const sessionID = event.properties?.sessionID
        if (sessionID) {
          sessions.delete(sessionID)
        }
      }
    },
  }
}
```

### Pattern 3: Blocking Hook

For hooks that can prevent tool execution:

```typescript
export function createCommentCheckerHook(config?: CommentCheckerConfig) {
  return {
    "tool.execute.before": async (
      input: { tool: string; input: unknown },
      output: { block?: boolean; error?: string }
    ) => {
      if (input.tool !== "edit" && input.tool !== "write") {
        return
      }
      
      const content = extractContent(input)
      const commentRatio = calculateCommentRatio(content)
      
      if (commentRatio > 0.3) {
        output.block = true
        output.error = `Too many comments (${Math.round(commentRatio * 100)}%). Reduce comment density and try again.`
      }
    },
  }
}
```

### Pattern 4: Auto-Continue Hook

For hooks that trigger continuation:

```typescript
export function createTodoContinuationEnforcer(ctx: PluginInput) {
  return {
    "event": async ({ event }) => {
      if (event.type !== "session.stop") return
      
      const sessionID = event.properties?.sessionID
      const hasPendingTodos = await checkPendingTodos(sessionID)
      
      if (hasPendingTodos) {
        // Inject continuation reminder
        await ctx.client.session.prompt({
          path: { id: sessionID },
          body: {
            parts: [{
              type: "text",
              text: "[SYSTEM REMINDER] Incomplete tasks remain. Continue working."
            }],
          },
        })
      }
    },
  }
}
```

---

## Registration Process

### Complete Checklist

When adding a new hook:

- [ ] Create `src/hooks/my-hook/index.ts` with factory function
- [ ] Add hook name to `HookNameSchema` in `src/config/schema.ts`
- [ ] Import hook in `src/index.ts`
- [ ] Create hook instance with `isHookEnabled()` check
- [ ] Add to appropriate event handlers in return object
- [ ] Export from `src/hooks/index.ts`
- [ ] Run `bun run build:schema`
- [ ] Run `bun run build`
- [ ] Test hook behavior

### Hook Execution Integration

In `src/index.ts`, hooks are integrated into the returned plugin object:

```typescript
return {
  // Tool execution hooks
  "tool.execute.before": async (input, output) => {
    // Execute hooks in order
    await hook1?.["tool.execute.before"]?.(input, output)
    await hook2?.["tool.execute.before"]?.(input, output)
    // Your hook
    await myHook?.["tool.execute.before"]?.(input, output)
  },
  
  "tool.execute.after": async (input, output) => {
    await hook1?.["tool.execute.after"]?.(input, output)
    await hook2?.["tool.execute.after"]?.(input, output)
    await myHook?.["tool.execute.after"]?.(input, output)
  },
  
  // Chat hooks
  "chat.message": async (input, output) => {
    await chatHook1?.(input, output)
    await chatHook2?.(input, output)
  },
  
  // Event hooks
  "event": async (eventInput) => {
    await eventHook1?.(eventInput)
    await eventHook2?.(eventInput)
  },
}
```

---

## Performance Considerations

### PreToolUse is Critical

`PreToolUse` hooks run on **EVERY tool call**. Keep them fast:

```typescript
// ❌ BAD: Heavy computation in PreToolUse
"tool.execute.before": async (input, output) => {
  const analysis = await heavyAnalysis(input)  // Slow!
  // ...
}

// ✅ GOOD: Quick checks only
"tool.execute.before": async (input, output) => {
  if (input.tool !== "edit") return  // Early exit
  // Quick validation only
}
```

### Memory Management

Clean up state on session end:

```typescript
"event": async ({ event }) => {
  if (event.type === "session.deleted") {
    const sessionID = event.properties?.sessionID
    sessionState.delete(sessionID)  // Prevent memory leaks
  }
}
```

### Avoid Redundant Work

Track what you've already done:

```typescript
const injectedSessions = new Set<string>()

"tool.execute.before": async (input, output) => {
  const sessionID = getSessionID(input)
  
  // Skip if already injected
  if (injectedSessions.has(sessionID)) {
    return
  }
  
  // Do work...
  injectedSessions.add(sessionID)
}
```

---

## Best Practices

### 1. Use Early Returns

```typescript
"tool.execute.after": async (input, output) => {
  // Skip irrelevant tools immediately
  if (input.tool !== "edit" && input.tool !== "write") {
    return
  }
  
  // Process only relevant tools
}
```

### 2. Append, Don't Replace

```typescript
// ❌ BAD: Replaces entire output
output.output = "My message"

// ✅ GOOD: Appends to existing output
output.output += "\n\n[My Hook]: Additional info"
```

### 3. Handle Errors Gracefully

```typescript
"tool.execute.after": async (input, output) => {
  try {
    await riskyOperation()
  } catch (error) {
    // Log but don't crash
    console.error("[MyHook] Error:", error)
    // Optionally append warning
    output.output += "\n\n[Warning]: Hook processing failed"
  }
}
```

### 4. Make Hooks Configurable

```typescript
export interface MyHookConfig {
  enabled?: boolean
  maxLength?: number
  blockedPatterns?: string[]
}

export function createMyHook(ctx: PluginInput, config?: MyHookConfig) {
  const maxLength = config?.maxLength ?? 10000
  const patterns = config?.blockedPatterns ?? []
  
  // Use config values...
}
```

### 5. Document Hook Behavior

```typescript
/**
 * Comment Checker Hook
 * 
 * Prevents excessive comments in generated code.
 * 
 * Events:
 * - PreToolUse: Blocks edit/write if comment ratio > 30%
 * - PostToolUse: Warns if comment ratio > 20%
 * 
 * Config:
 * - threshold: Maximum allowed comment ratio (default: 0.3)
 */
export function createCommentCheckerHook(config?: CommentCheckerConfig) {
  // ...
}
```

---

## Example: Complete Hook Implementation

See `src/hooks/comment-checker/` for a production example:

```typescript
// src/hooks/comment-checker/index.ts
import type { PluginInput } from "@opencode-ai/plugin"
import { CommentChecker } from "@code-yeongyu/comment-checker"

export interface CommentCheckerConfig {
  threshold?: number
  warnOnly?: boolean
}

export function createCommentCheckerHooks(config?: CommentCheckerConfig) {
  const threshold = config?.threshold ?? 0.3
  const warnOnly = config?.warnOnly ?? false
  const checker = new CommentChecker()
  
  return {
    "tool.execute.before": async (
      input: { tool: string; input: unknown },
      output: { block?: boolean; error?: string }
    ) => {
      // Only check edit/write tools
      if (input.tool !== "edit" && input.tool !== "write") {
        return
      }
      
      const content = extractContent(input)
      if (!content) return
      
      const ratio = checker.getCommentRatio(content)
      
      if (ratio > threshold && !warnOnly) {
        output.block = true
        output.error = `Comment density too high (${Math.round(ratio * 100)}%). ` +
          `Maximum allowed: ${Math.round(threshold * 100)}%. ` +
          `Remove excessive comments and try again.`
      }
    },
    
    "tool.execute.after": async (
      input: { tool: string; input: unknown },
      output: { output: string }
    ) => {
      if (input.tool !== "edit" && input.tool !== "write") {
        return
      }
      
      const content = extractContent(input)
      if (!content) return
      
      const ratio = checker.getCommentRatio(content)
      
      if (ratio > threshold * 0.7) {
        output.output += `\n\n[Comment Checker Warning] Comment density: ${Math.round(ratio * 100)}%`
      }
    },
  }
}

function extractContent(input: unknown): string | null {
  const typedInput = input as { input?: { content?: string; newString?: string } }
  return typedInput?.input?.content ?? typedInput?.input?.newString ?? null
}
```

---

## Next Steps

- [03-tool-system.md](./03-tool-system.md) - Adding tools
- [04-delegation-orchestration.md](./04-delegation-orchestration.md) - How orchestration works
