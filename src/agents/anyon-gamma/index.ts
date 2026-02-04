import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "../types"
import { isGptModel } from "../types"
import { createAgentToolRestrictions } from "../../shared/permission-compat"
import { ANYON_GAMMA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { ANYON_GAMMA_INTERVIEW_MODE } from "./interview-mode"
import { ANYON_GAMMA_DOCUMENT_GENERATION } from "./document-generation"
import { ANYON_GAMMA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { ANYON_GAMMA_TEMPLATE } from "./template"
import { ANYON_GAMMA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

const MODE: AgentMode = "all"

export const ANYON_GAMMA_SYSTEM_PROMPT = `${ANYON_GAMMA_IDENTITY_CONSTRAINTS}
${ANYON_GAMMA_INTERVIEW_MODE}
${ANYON_GAMMA_DOCUMENT_GENERATION}
${ANYON_GAMMA_HIGH_ACCURACY_MODE}
${ANYON_GAMMA_TEMPLATE}
${ANYON_GAMMA_BEHAVIORAL_SUMMARY}`

export const ANYON_GAMMA_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

export const ANYON_GAMMA_PROMPT_METADATA: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Anyon Gamma",
  triggers: [
    { domain: "Data Modeling", trigger: "ERD creation, database schema design from PRD+UserFlow" },
  ],
  useWhen: [
    "PRD and UserFlow are complete",
    "Need to design database structure / ERD",
    "Planning data model before development",
  ],
  avoidWhen: [
    "No PRD exists yet (use anyon-alpha first)",
    "No UserFlow exists yet (use anyon-beta first)",
    "Technical implementation or code writing",
  ],
}

export function createAnyonGammaAgent(model: string): AgentConfig {
  const restrictions = createAgentToolRestrictions([
    "call_omo_agent",
  ])

  const base = {
    description: "Anyon Gamma - ERD Agent (Anyon - OhMyOpenCode)",
    mode: MODE,
    model,
    temperature: 0.3,
    maxTokens: 32000,
    prompt: ANYON_GAMMA_SYSTEM_PROMPT,
    permission: {
      ...ANYON_GAMMA_PERMISSION,
      ...restrictions.permission,
    },
    color: "#9C27B0",
  } as AgentConfig

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "high", textVerbosity: "high" } as AgentConfig
  }

  return { ...base, thinking: { type: "enabled", budgetTokens: 16000 } } as AgentConfig
}
createAnyonGammaAgent.mode = MODE

export { ANYON_GAMMA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { ANYON_GAMMA_INTERVIEW_MODE } from "./interview-mode"
export { ANYON_GAMMA_DOCUMENT_GENERATION } from "./document-generation"
export { ANYON_GAMMA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { ANYON_GAMMA_TEMPLATE } from "./template"
export { ANYON_GAMMA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
