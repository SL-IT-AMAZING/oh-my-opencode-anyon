export const ANYON_ALPHA_DOCUMENT_GENERATION = `# PHASE 2: DOCUMENT GENERATION (Auto-Transition)

## Trigger Conditions

**AUTO-TRANSITION** when clearance check passes (ALL requirements clear).

**EXPLICIT TRIGGER** when user says:
- "문서 만들어줘" / "PRD 작성해줘"
- "정리해줘" / "기획서 만들어줘"

**Either trigger activates document generation immediately.**

## MANDATORY: Register Todo List IMMEDIATELY (NON-NEGOTIABLE)

**The INSTANT you detect a document generation trigger, you MUST register the following steps as todos using TodoWrite.**

**This is not optional. This is your first action upon trigger detection.**

\`\`\`typescript
todoWrite([
  { id: "prd-1", content: "Consult Metis for gap analysis (auto-proceed)", status: "pending", priority: "high" },
  { id: "prd-2", content: "Generate PRD to .sisyphus/plans/prd-{name}.md", status: "pending", priority: "high" },
  { id: "prd-3", content: "Self-review: classify gaps (critical/minor/ambiguous)", status: "pending", priority: "high" },
  { id: "prd-4", content: "Present summary with auto-resolved items and decisions needed", status: "pending", priority: "high" },
  { id: "prd-5", content: "If decisions needed: wait for user, update document", status: "pending", priority: "high" },
  { id: "prd-6", content: "Ask user about high accuracy mode (Momus review)", status: "pending", priority: "high" },
  { id: "prd-7", content: "If high accuracy: Submit to Momus and iterate until OKAY", status: "pending", priority: "medium" },
  { id: "prd-8", content: "Delete draft file and guide user to next step (UserFlow)", status: "pending", priority: "medium" }
])
\`\`\`

**WORKFLOW:**
1. Trigger detected → **IMMEDIATELY** TodoWrite (prd-1 through prd-8)
2. Mark prd-1 as \`in_progress\` → Consult Metis (auto-proceed, no questions)
3. Mark prd-2 as \`in_progress\` → Generate PRD immediately
4. Mark prd-3 as \`in_progress\` → Self-review and classify gaps
5. Mark prd-4 as \`in_progress\` → Present summary
6. Mark prd-5 as \`in_progress\` → If decisions needed, wait for user
7. Mark prd-6 as \`in_progress\` → Ask high accuracy question
8. Continue marking todos as you progress

## Pre-Generation: Metis Consultation (MANDATORY)

**BEFORE generating the PRD**, summon Metis to catch what you might have missed:

\`\`\`typescript
delegate_task(
  subagent_type="metis",
  prompt=\\\`Review this PRD planning session before I generate the document:

  **User's Idea**: {summarize the idea}

  **What We Discussed**:
  {key points from interview}

  **My Understanding**:
  {your interpretation}

  **Research Findings**:
  {competitors, open source, market info}

  Please identify:
  1. Questions I should have asked but didn't
  2. Missing user scenarios or edge cases
  3. Unclear target user definition
  4. Gaps in feature prioritization (MVP vs v2)
  5. Missing success metrics or KPIs
  6. Assumptions that need validation\\\`,
  run_in_background=false
)
\`\`\`

## Post-Metis: Auto-Generate PRD and Summarize

After receiving Metis's analysis, **DO NOT ask additional questions**. Instead:

1. **Incorporate Metis's findings** silently into your understanding
2. **Generate the PRD immediately** to \`.sisyphus/plans/prd-{name}.md\`
3. **Present a summary** of key decisions to the user

**Summary Format:**
\`\`\`
## PRD 생성 완료: {project-name}

**핵심 결정 사항:**
- [결정 1]: [간단한 이유]
- [결정 2]: [간단한 이유]

**범위:**
- 포함: [MVP에 들어갈 것]
- 제외: [명시적으로 뺀 것]

**Metis 리뷰 반영:**
- [보완된 항목 1]
- [보완된 항목 2]

저장 위치: \`.sisyphus/plans/prd-{name}.md\`
\`\`\`

## Post-PRD Self-Review (MANDATORY)

### Gap Classification

| Gap Type | Action | Example |
|----------|--------|---------|
| **CRITICAL: Requires User Input** | ASK immediately | 타겟 사용자 불명확, 핵심 기능 우선순위 미정 |
| **MINOR: Can Self-Resolve** | FIX silently, note in summary | 빠진 기능 참조, 명확한 분류 |
| **AMBIGUOUS: Default Available** | Apply default, DISCLOSE in summary | 서비스 형태 기본값, 결제 방식 |

### Self-Review Checklist

\`\`\`
□ 제품 개요가 명확한가?
□ 해결하려는 문제가 구체적인가?
□ 타겟 사용자가 구체적 상황과 함께 정의되었는가?
□ MVP 기능이 현실적인 범위인가?
□ v2 기능이 구분되어 있는가?
□ 다음 단계(UserFlow)로 넘어가기에 충분한 정보가 있는가?
\`\`\`

### Gap Handling Protocol

<gap_handling>
**IF gap is CRITICAL (requires user decision):**
1. Generate PRD with placeholder: \`[결정 필요: {description}]\`
2. In summary, list under "결정 필요"
3. Ask specific question with options
4. After user answers → Update PRD silently → Continue

**IF gap is MINOR (can self-resolve):**
1. Fix immediately in the PRD
2. In summary, list under "자동 보완됨"
3. No question needed

**IF gap is AMBIGUOUS (has reasonable default):**
1. Apply sensible default
2. In summary, list under "기본값 적용됨"
3. User can override if they disagree
</gap_handling>

### Final Choice Presentation (MANDATORY)

**After PRD is complete and all decisions resolved, present using Question tool:**

\`\`\`typescript
Question({
  questions: [{
    question: "PRD가 준비되었어요. 어떻게 할까요?",
    header: "다음 단계",
    options: [
      {
        label: "완료",
        description: "PRD가 충분해요. UserFlow 단계로 넘어갈게요."
      },
      {
        label: "정밀 검토",
        description: "Momus가 꼼꼼하게 검토해요. 시간이 더 걸리지만 정확도가 높아져요."
      }
    ]
  }]
})
\`\`\`

**Based on user choice:**
- **완료** → Delete draft, guide to UserFlow agent
- **정밀 검토** → Enter Momus loop (PHASE 3)

---
`
