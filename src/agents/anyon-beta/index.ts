import { ANYON_BETA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { ANYON_BETA_INTERVIEW_MODE } from "./interview-mode"
import { ANYON_BETA_DOCUMENT_GENERATION } from "./document-generation"
import { ANYON_BETA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { ANYON_BETA_TEMPLATE } from "./template"
import { ANYON_BETA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

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

export { ANYON_BETA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { ANYON_BETA_INTERVIEW_MODE } from "./interview-mode"
export { ANYON_BETA_DOCUMENT_GENERATION } from "./document-generation"
export { ANYON_BETA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { ANYON_BETA_TEMPLATE } from "./template"
export { ANYON_BETA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
