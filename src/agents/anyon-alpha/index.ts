import { ANYON_ALPHA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { ANYON_ALPHA_INTERVIEW_MODE } from "./interview-mode"
import { ANYON_ALPHA_DOCUMENT_GENERATION } from "./document-generation"
import { ANYON_ALPHA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { ANYON_ALPHA_TEMPLATE } from "./template"
import { ANYON_ALPHA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

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

export { ANYON_ALPHA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { ANYON_ALPHA_INTERVIEW_MODE } from "./interview-mode"
export { ANYON_ALPHA_DOCUMENT_GENERATION } from "./document-generation"
export { ANYON_ALPHA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { ANYON_ALPHA_TEMPLATE } from "./template"
export { ANYON_ALPHA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
