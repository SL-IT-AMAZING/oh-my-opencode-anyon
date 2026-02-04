import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "../types"
import { isGptModel } from "../types"
import { createAgentToolRestrictions } from "../../shared/permission-compat"
import { ANYON_ALPHA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { ANYON_ALPHA_INTERVIEW_MODE } from "./interview-mode"
import { ANYON_ALPHA_DOCUMENT_GENERATION } from "./document-generation"
import { ANYON_ALPHA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { ANYON_ALPHA_TEMPLATE } from "./template"
import { ANYON_ALPHA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

const MODE: AgentMode = "all"

export const ANYON_ALPHA_SYSTEM_PROMPT = `${ANYON_ALPHA_IDENTITY_CONSTRAINTS}
${ANYON_ALPHA_INTERVIEW_MODE}
${ANYON_ALPHA_DOCUMENT_GENERATION}
${ANYON_ALPHA_HIGH_ACCURACY_MODE}
${ANYON_ALPHA_TEMPLATE}
${ANYON_ALPHA_BEHAVIORAL_SUMMARY}`

export const ANYON_ALPHA_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

export const ANYON_ALPHA_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Anyon Alpha",
  triggers: [
    { domain: "Product Planning", trigger: "PRD creation, idea refinement, requirement gathering" },
  ],
  useWhen: [
    "User has vague product idea",
    "Need to create PRD document",
    "Non-technical founder needs planning help",
  ],
  avoidWhen: [
    "Technical implementation or code writing",
    "Already have clear, detailed requirements",
    "Need UI/UX wireframes (use anyon-beta)",
  ],
}

export function createAnyonAlphaAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "call_omo_agent",
  ])

  const base = {
    description: "Anyon Alpha - PRD Agent (Anyon - OhMyOpenCode)",
    mode: MODE,
    model,
    temperature: 0.3,
    maxTokens: 32000,
    prompt: ANYON_ALPHA_SYSTEM_PROMPT,
    permission: {
      ...ANYON_ALPHA_PERMISSION,
      ...restrictions.permission,
    },
    color: "#2196F3",
  } as AgentConfig

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "high", textVerbosity: "high" } as AgentConfig
  }

  return { ...base, thinking: { type: "enabled", budgetTokens: 16000 } } as AgentConfig
}
createAnyonAlphaAgent.mode = MODE

export { ANYON_ALPHA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { ANYON_ALPHA_INTERVIEW_MODE } from "./interview-mode"
export { ANYON_ALPHA_DOCUMENT_GENERATION } from "./document-generation"
export { ANYON_ALPHA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { ANYON_ALPHA_TEMPLATE } from "./template"
export { ANYON_ALPHA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
