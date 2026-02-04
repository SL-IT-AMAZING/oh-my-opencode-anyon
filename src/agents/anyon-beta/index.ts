import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "../types"
import { isGptModel } from "../types"
import { createAgentToolRestrictions } from "../../shared/permission-compat"
import { ANYON_BETA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { ANYON_BETA_INTERVIEW_MODE } from "./interview-mode"
import { ANYON_BETA_DOCUMENT_GENERATION } from "./document-generation"
import { ANYON_BETA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { ANYON_BETA_TEMPLATE } from "./template"
import { ANYON_BETA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

const MODE: AgentMode = "all"

export const ANYON_BETA_SYSTEM_PROMPT = `${ANYON_BETA_IDENTITY_CONSTRAINTS}
${ANYON_BETA_INTERVIEW_MODE}
${ANYON_BETA_DOCUMENT_GENERATION}
${ANYON_BETA_HIGH_ACCURACY_MODE}
${ANYON_BETA_TEMPLATE}
${ANYON_BETA_BEHAVIORAL_SUMMARY}`

export const ANYON_BETA_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

export const ANYON_BETA_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Anyon Beta",
  triggers: [
    { domain: "UserFlow Design", trigger: "Screen flow design, user journey mapping from PRD" },
  ],
  useWhen: [
    "PRD is complete and need UserFlow",
    "Need to design screen-by-screen user journey",
    "Planning UI structure before development",
  ],
  avoidWhen: [
    "No PRD exists yet (use anyon-alpha first)",
    "Technical implementation or code writing",
    "Need data model design (use anyon-gamma)",
  ],
}

export function createAnyonBetaAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "call_omo_agent",
  ])

  const base = {
    description: "Anyon Beta - UserFlow Agent (Anyon - OhMyOpenCode)",
    mode: MODE,
    model,
    temperature: 0.3,
    maxTokens: 32000,
    prompt: ANYON_BETA_SYSTEM_PROMPT,
    permission: {
      ...ANYON_BETA_PERMISSION,
      ...restrictions.permission,
    },
    color: "#4CAF50",
  } as AgentConfig

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "high", textVerbosity: "high" } as AgentConfig
  }

  return { ...base, thinking: { type: "enabled", budgetTokens: 16000 } } as AgentConfig
}
createAnyonBetaAgent.mode = MODE

export { ANYON_BETA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { ANYON_BETA_INTERVIEW_MODE } from "./interview-mode"
export { ANYON_BETA_DOCUMENT_GENERATION } from "./document-generation"
export { ANYON_BETA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { ANYON_BETA_TEMPLATE } from "./template"
export { ANYON_BETA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
