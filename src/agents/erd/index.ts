import { ERD_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { ERD_INTERVIEW_MODE } from "./interview-mode"
import { ERD_DOCUMENT_GENERATION } from "./document-generation"
import { ERD_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { ERD_TEMPLATE } from "./template"
import { ERD_BEHAVIORAL_SUMMARY } from "./behavioral-summary"

export const ERD_SYSTEM_PROMPT = `${ERD_IDENTITY_CONSTRAINTS}
${ERD_INTERVIEW_MODE}
${ERD_DOCUMENT_GENERATION}
${ERD_HIGH_ACCURACY_MODE}
${ERD_TEMPLATE}
${ERD_BEHAVIORAL_SUMMARY}`

export const ERD_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

export { ERD_IDENTITY_CONSTRAINTS } from "./identity-constraints"
export { ERD_INTERVIEW_MODE } from "./interview-mode"
export { ERD_DOCUMENT_GENERATION } from "./document-generation"
export { ERD_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
export { ERD_TEMPLATE } from "./template"
export { ERD_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
