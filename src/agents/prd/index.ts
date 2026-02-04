import { PRD_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { PRD_INTERVIEW_MODE } from "./interview-mode"
import { PRD_DOCUMENT_GENERATION } from "./document-generation"
import { PRD_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { PRD_TEMPLATE } from "./template"
import { PRD_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

export const PRD_SYSTEM_PROMPT = `${PRD_IDENTITY_CONSTRAINTS}
${PRD_INTERVIEW_MODE}
${PRD_DOCUMENT_GENERATION}
${PRD_HIGH_ACCURACY_MODE}
${PRD_TEMPLATE}
${PRD_BEHAVIORAL_SUMMARY}`

export const PRD_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

export { PRD_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { PRD_INTERVIEW_MODE } from "./interview-mode"
export { PRD_DOCUMENT_GENERATION } from "./document-generation"
export { PRD_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { PRD_TEMPLATE } from "./template"
export { PRD_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
