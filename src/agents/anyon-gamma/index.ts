import { ANYON_GAMMA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { ANYON_GAMMA_INTERVIEW_MODE } from "./interview-mode"
import { ANYON_GAMMA_DOCUMENT_GENERATION } from "./document-generation"
import { ANYON_GAMMA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { ANYON_GAMMA_TEMPLATE } from "./template"
import { ANYON_GAMMA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

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

export { ANYON_GAMMA_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { ANYON_GAMMA_INTERVIEW_MODE } from "./interview-mode"
export { ANYON_GAMMA_DOCUMENT_GENERATION } from "./document-generation"
export { ANYON_GAMMA_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { ANYON_GAMMA_TEMPLATE } from "./template"
export { ANYON_GAMMA_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
