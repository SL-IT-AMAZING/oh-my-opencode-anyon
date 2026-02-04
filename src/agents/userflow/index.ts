import { USERFLOW_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { USERFLOW_INTERVIEW_MODE } from "./interview-mode"
import { USERFLOW_DOCUMENT_GENERATION } from "./document-generation"
import { USERFLOW_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { USERFLOW_TEMPLATE } from "./template"
import { USERFLOW_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

export const USERFLOW_SYSTEM_PROMPT = `${USERFLOW_IDENTITY_CONSTRAINTS}
${USERFLOW_INTERVIEW_MODE}
${USERFLOW_DOCUMENT_GENERATION}
${USERFLOW_HIGH_ACCURACY_MODE}
${USERFLOW_TEMPLATE}
${USERFLOW_BEHAVIORAL_SUMMARY}`

export const USERFLOW_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

export { USERFLOW_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { USERFLOW_INTERVIEW_MODE } from "./interview-mode"
export { USERFLOW_DOCUMENT_GENERATION } from "./document-generation"
export { USERFLOW_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { USERFLOW_TEMPLATE } from "./template"
export { USERFLOW_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
