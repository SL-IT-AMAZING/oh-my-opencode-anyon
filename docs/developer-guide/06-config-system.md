# Config System

The Config System provides a flexible, type-safe configuration mechanism for oh-my-opencode. It uses Zod schemas for validation, supports JSONC format (JSON with comments), and implements a multi-level configuration hierarchy.

## Overview

### Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Priority                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Project Config (highest priority)                         │
│     .opencode/oh-my-opencode.jsonc                           │
│     .opencode/oh-my-opencode.json                            │
│                                                               │
│  2. User Config (base)                                        │
│     ~/.config/opencode/oh-my-opencode.jsonc                  │
│     ~/.config/opencode/oh-my-opencode.json                   │
│                                                               │
│  Merge Strategy:                                              │
│     - Arrays: Union (combined, deduplicated)                  │
│     - Objects: Deep merge (nested keys preserved)             │
│     - Primitives: Override (project wins)                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

- **Zod Schema Validation**: Type-safe config with detailed error messages
- **JSONC Support**: Comments and trailing commas allowed
- **Deep Merge**: Nested configurations merged intelligently
- **Environment Variables**: Secrets injected via `${VAR}` syntax
- **Auto-Migration**: Legacy config formats upgraded automatically

## Configuration Files

### File Locations

```bash
# User-level config (applies to all projects)
~/.config/opencode/oh-my-opencode.jsonc  # Preferred
~/.config/opencode/oh-my-opencode.json   # Fallback

# Project-level config (overrides user config)
.opencode/oh-my-opencode.jsonc           # Preferred
.opencode/oh-my-opencode.json            # Fallback
```

### JSONC Format

Both `.json` and `.jsonc` are supported. JSONC allows:

```jsonc
{
  // Single-line comments
  "disabled_hooks": [
    "auto-update-checker",  // Trailing commas OK
  ],
  
  /* Multi-line
     comments */
  "agents": {
    "sisyphus": {
      "temperature": 0.1  // Inline comments
    }
  }
}
```

## Schema Structure

### Root Configuration

```typescript
// src/config/schema.ts
export const OhMyOpenCodeConfigSchema = z.object({
  $schema: z.string().optional(),
  
  // Feature Toggles
  new_task_system_enabled: z.boolean().optional(),
  default_run_agent: z.string().optional(),
  auto_update: z.boolean().optional(),
  
  // Disable Lists
  disabled_mcps: z.array(AnyMcpNameSchema).optional(),
  disabled_agents: z.array(BuiltinAgentNameSchema).optional(),
  disabled_skills: z.array(BuiltinSkillNameSchema).optional(),
  disabled_hooks: z.array(HookNameSchema).optional(),
  disabled_commands: z.array(BuiltinCommandNameSchema).optional(),
  disabled_tools: z.array(z.string()).optional(),
  
  // Override Configurations
  agents: AgentOverridesSchema.optional(),
  categories: CategoriesConfigSchema.optional(),
  skills: SkillsConfigSchema.optional(),
  
  // Feature Configs
  claude_code: ClaudeCodeConfigSchema.optional(),
  sisyphus_agent: SisyphusAgentConfigSchema.optional(),
  comment_checker: CommentCheckerConfigSchema.optional(),
  experimental: ExperimentalConfigSchema.optional(),
  ralph_loop: RalphLoopConfigSchema.optional(),
  background_task: BackgroundTaskConfigSchema.optional(),
  notification: NotificationConfigSchema.optional(),
  babysitting: BabysittingConfigSchema.optional(),
  git_master: GitMasterConfigSchema.optional(),
  browser_automation_engine: BrowserAutomationConfigSchema.optional(),
  websearch: WebsearchConfigSchema.optional(),
  tmux: TmuxConfigSchema.optional(),
  sisyphus: SisyphusConfigSchema.optional(),
})
```

### Agent Override Schema

Override agent behavior without modifying source code:

```typescript
export const AgentOverrideConfigSchema = z.object({
  // Model Configuration
  model: z.string().optional(),           // Deprecated: use category
  variant: z.string().optional(),
  category: z.string().optional(),        // Inherit from category
  
  // Generation Parameters
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  maxTokens: z.number().optional(),
  
  // Thinking/Reasoning
  thinking: z.object({
    type: z.enum(["enabled", "disabled"]),
    budgetTokens: z.number().optional(),
  }).optional(),
  reasoningEffort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
  textVerbosity: z.enum(["low", "medium", "high"]).optional(),
  
  // Prompt Customization
  prompt: z.string().optional(),          // Replace system prompt
  prompt_append: z.string().optional(),   // Append to system prompt
  skills: z.array(z.string()).optional(), // Inject skills
  
  // Tool Configuration
  tools: z.record(z.string(), z.boolean()).optional(),
  
  // Agent Metadata
  disable: z.boolean().optional(),
  description: z.string().optional(),
  mode: z.enum(["subagent", "primary", "all"]).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  
  // Permissions
  permission: AgentPermissionSchema.optional(),
  
  // Provider Options
  providerOptions: z.record(z.string(), z.unknown()).optional(),
})
```

### Category Schema

Configure delegation categories:

```typescript
export const CategoryConfigSchema = z.object({
  description: z.string().optional(),
  model: z.string().optional(),
  variant: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  maxTokens: z.number().optional(),
  thinking: z.object({
    type: z.enum(["enabled", "disabled"]),
    budgetTokens: z.number().optional(),
  }).optional(),
  reasoningEffort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
  textVerbosity: z.enum(["low", "medium", "high"]).optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  prompt_append: z.string().optional(),
  is_unstable_agent: z.boolean().optional(),
})
```

## Configuration Examples

### Basic Configuration

```jsonc
{
  "$schema": "./node_modules/oh-my-opencode/schema.json",
  
  // Disable features you don't need
  "disabled_hooks": [
    "auto-update-checker",
    "comment-checker"
  ],
  
  // Configure agents
  "agents": {
    "sisyphus": {
      "temperature": 0.1
    }
  }
}
```

### Agent Customization

```jsonc
{
  "agents": {
    // Override the oracle agent
    "oracle": {
      "model": "openai/gpt-5.2",
      "temperature": 0.2,
      "thinking": {
        "type": "enabled",
        "budgetTokens": 8000
      },
      "prompt_append": "\n\nAlways provide code examples.",
      "skills": ["git-master"]
    },
    
    // Disable the librarian agent
    "librarian": {
      "disable": true
    }
  }
}
```

### Custom Categories

```jsonc
{
  "categories": {
    // Override built-in category
    "visual-engineering": {
      "model": "anthropic/claude-sonnet-4-5",
      "temperature": 0.3,
      "description": "Frontend and UI/UX work"
    },
    
    // Add custom category
    "data-pipeline": {
      "description": "ETL and data processing tasks",
      "model": "openai/gpt-5.2-codex",
      "temperature": 0.1,
      "maxTokens": 16000,
      "prompt_append": "Focus on efficiency and data integrity."
    }
  }
}
```

### Background Task Configuration

```jsonc
{
  "background_task": {
    // Global default concurrency
    "defaultConcurrency": 5,
    
    // Per-provider limits
    "providerConcurrency": {
      "anthropic": 3,
      "openai": 5,
      "google": 2
    },
    
    // Per-model limits (overrides provider)
    "modelConcurrency": {
      "anthropic/claude-opus-4-5": 2,
      "openai/gpt-5.2-codex": 3
    },
    
    // Stale task timeout (3 minutes)
    "staleTimeoutMs": 180000
  }
}
```

### Claude Code Compatibility

```jsonc
{
  "claude_code": {
    // Enable/disable Claude Code compatibility features
    "mcp": true,           // Load MCPs from .mcp.json
    "commands": true,      // Load commands from ~/.claude/commands/
    "skills": true,        // Load skills from ~/.claude/skills/
    "agents": true,        // Load agents from ~/.claude/agents/
    "hooks": true,         // Run Claude Code hooks
    "plugins": true,       // Load Claude Code plugins
    
    // Override specific plugins
    "plugins_override": {
      "some-plugin": false  // Disable specific plugin
    }
  }
}
```

### Experimental Features

```jsonc
{
  "experimental": {
    // Aggressive context truncation
    "aggressive_truncation": true,
    
    // Auto-resume on connection loss
    "auto_resume": true,
    
    // Preemptive context compaction
    "preemptive_compaction": true,
    
    // Truncate all tool outputs
    "truncate_all_tool_outputs": true,
    
    // Dynamic context pruning
    "dynamic_context_pruning": {
      "enabled": true,
      "notification": "detailed",
      "turn_protection": {
        "enabled": true,
        "turns": 3
      },
      "protected_tools": ["task", "todowrite"],
      "strategies": {
        "deduplication": { "enabled": true },
        "supersede_writes": { "enabled": true, "aggressive": false },
        "purge_errors": { "enabled": true, "turns": 5 }
      }
    }
  }
}
```

## Config Loading Implementation

### Loading Pipeline

```typescript
// src/plugin-config.ts
export function loadPluginConfig(
  directory: string,
  ctx: unknown
): OhMyOpenCodeConfig {
  // 1. Resolve user config path
  const configDir = getOpenCodeConfigDir({ binary: "opencode" })
  const userBasePath = path.join(configDir, "oh-my-opencode")
  const userDetected = detectConfigFile(userBasePath)
  const userConfigPath = userDetected.format !== "none"
    ? userDetected.path
    : userBasePath + ".json"

  // 2. Resolve project config path
  const projectBasePath = path.join(directory, ".opencode", "oh-my-opencode")
  const projectDetected = detectConfigFile(projectBasePath)
  const projectConfigPath = projectDetected.format !== "none"
    ? projectDetected.path
    : projectBasePath + ".json"

  // 3. Load user config (base)
  let config: OhMyOpenCodeConfig = loadConfigFromPath(userConfigPath, ctx) ?? {}

  // 4. Merge with project config (override)
  const projectConfig = loadConfigFromPath(projectConfigPath, ctx)
  if (projectConfig) {
    config = mergeConfigs(config, projectConfig)
  }

  return config
}
```

### File Detection

```typescript
// src/shared/jsonc-parser.ts
export function detectConfigFile(basePath: string): {
  format: "json" | "jsonc" | "none"
  path: string
} {
  const jsoncPath = `${basePath}.jsonc`
  const jsonPath = `${basePath}.json`

  if (existsSync(jsoncPath)) {
    return { format: "jsonc", path: jsoncPath }
  }
  if (existsSync(jsonPath)) {
    return { format: "json", path: jsonPath }
  }
  return { format: "none", path: jsonPath }
}
```

### JSONC Parsing

```typescript
// src/shared/jsonc-parser.ts
import { parse, ParseError, printParseErrorCode } from "jsonc-parser"

export function parseJsonc<T = unknown>(content: string): T {
  const errors: ParseError[] = []
  const result = parse(content, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  }) as T

  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => `${printParseErrorCode(e.error)} at offset ${e.offset}`)
      .join(", ")
    throw new SyntaxError(`JSONC parse error: ${errorMessages}`)
  }

  return result
}
```

### Config Merging

```typescript
// src/plugin-config.ts
export function mergeConfigs(
  base: OhMyOpenCodeConfig,
  override: OhMyOpenCodeConfig
): OhMyOpenCodeConfig {
  return {
    ...base,
    ...override,
    // Deep merge nested objects
    agents: deepMerge(base.agents, override.agents),
    categories: deepMerge(base.categories, override.categories),
    claude_code: deepMerge(base.claude_code, override.claude_code),
    
    // Union arrays (deduplicated)
    disabled_agents: [
      ...new Set([
        ...(base.disabled_agents ?? []),
        ...(override.disabled_agents ?? []),
      ]),
    ],
    disabled_mcps: [
      ...new Set([
        ...(base.disabled_mcps ?? []),
        ...(override.disabled_mcps ?? []),
      ]),
    ],
    // ... other arrays
  }
}
```

## Extending the Schema

### Adding a New Config Section

1. **Define the Schema**

```typescript
// src/config/schema.ts

// 1. Create the section schema
export const MyFeatureConfigSchema = z.object({
  enabled: z.boolean().default(false),
  setting_a: z.string().optional(),
  setting_b: z.number().min(0).max(100).optional(),
  nested: z.object({
    option_x: z.boolean().default(true),
    option_y: z.array(z.string()).optional(),
  }).optional(),
})

// 2. Export the type
export type MyFeatureConfig = z.infer<typeof MyFeatureConfigSchema>

// 3. Add to root schema
export const OhMyOpenCodeConfigSchema = z.object({
  // ... existing fields
  my_feature: MyFeatureConfigSchema.optional(),
})
```

2. **Regenerate JSON Schema**

```bash
bun run build:schema
```

This generates `schema.json` for IDE autocompletion.

3. **Use in Code**

```typescript
import { loadPluginConfig } from "./plugin-config"

const config = loadPluginConfig(process.cwd(), ctx)

if (config.my_feature?.enabled) {
  const settingA = config.my_feature.setting_a ?? "default"
  // Use configuration...
}
```

### Adding a New Agent Override Field

```typescript
// src/config/schema.ts

// 1. Add to AgentOverrideConfigSchema
export const AgentOverrideConfigSchema = z.object({
  // ... existing fields
  my_new_field: z.string().optional(),
})

// 2. Type is automatically updated
export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>
```

### Adding a New Disable List

```typescript
// 1. Define the enum
export const MyFeatureNameSchema = z.enum([
  "feature-a",
  "feature-b",
  "feature-c",
])

// 2. Add to root schema
export const OhMyOpenCodeConfigSchema = z.object({
  // ... existing fields
  disabled_my_features: z.array(MyFeatureNameSchema).optional(),
})

// 3. Handle in merge logic (plugin-config.ts)
disabled_my_features: [
  ...new Set([
    ...(base.disabled_my_features ?? []),
    ...(override.disabled_my_features ?? []),
  ]),
],
```

## Best Practices

### Schema Design

1. **Use optionals liberally**: All config should work with empty object `{}`
2. **Provide sensible defaults**: Use `.default()` or handle in code
3. **Validate ranges**: Use `.min()`, `.max()`, `.regex()` for constraints
4. **Document with descriptions**: Add comments in schema file

### Config File Organization

1. **User config for personal preferences**: Editor settings, API keys
2. **Project config for team standards**: Hooks, categories, agent overrides
3. **Keep secrets out**: Use environment variables via `${VAR}`

### Validation

1. **Check validation errors**: `safeParse()` returns errors, don't ignore
2. **Log meaningful messages**: Include file path and specific validation issues
3. **Graceful fallback**: Invalid config shouldn't crash the plugin

## File Reference

| File | Purpose |
|------|---------|
| `src/config/schema.ts` | Zod schema definitions (445 lines) |
| `src/config/index.ts` | Public exports |
| `src/plugin-config.ts` | Config loading and merging |
| `src/shared/jsonc-parser.ts` | JSONC parsing utilities |
| `src/shared/deep-merge.ts` | Recursive object merging |
| `script/build-schema.ts` | JSON Schema generation |

## Next Steps

- [07-mcp-integration.md](./07-mcp-integration.md) - Understand MCP integration
