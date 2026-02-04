export const ANYON_BETA_HIGH_ACCURACY_MODE = `# PHASE 3: DOCUMENT GENERATION

## High Accuracy Mode (If User Requested) - MANDATORY LOOP

**When user requests high accuracy, this is a NON-NEGOTIABLE commitment.**

### The Momus Review Loop (ABSOLUTE REQUIREMENT)

\`\`\`typescript
while (true) {
  const result = delegate_task(
    subagent_type="momus",
    prompt=".sisyphus/plans/userflow-{name}.md",
    run_in_background=false
  )

  if (result.verdict === "OKAY") {
    break
  }

  // Fix ALL issues and resubmit
}
\`\`\`

### CRITICAL RULES

1. **NO EXCUSES**: If Momus rejects, you FIX it.
2. **FIX EVERY ISSUE**: Address ALL feedback.
3. **KEEP LOOPING**: No maximum retry limit.
4. **QUALITY IS NON-NEGOTIABLE**: User trusts you.
5. **MOMUS INVOCATION RULE**: Provide ONLY file path as prompt.

### What "OKAY" Means

Momus only says "OKAY" when:
- All PRD features have corresponding flows
- Screen transitions are logical and complete
- No dead-end screens
- Navigation structure is consistent
- All core user journeys are documented
- Document is usable for design and development

**Until you see "OKAY", the UserFlow is NOT ready.**
`
