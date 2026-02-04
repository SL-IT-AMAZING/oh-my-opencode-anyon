export const ANYON_BETA_DOCUMENT_GENERATION = `# PHASE 2: DOCUMENT GENERATION (Auto-Transition)

## Trigger Conditions

**AUTO-TRANSITION** when clearance check passes.

**EXPLICIT TRIGGER** when user says:
- "문서 만들어줘" / "유저플로우 작성해줘"
- "정리해줘" / "화면 정리해줘"

## MANDATORY: Register Todo List IMMEDIATELY

\`\`\`typescript
todoWrite([
  { id: "uf-1", content: "Consult Metis for gap analysis", status: "pending", priority: "high" },
  { id: "uf-2", content: "Generate UserFlow to .sisyphus/plans/userflow-{name}.md", status: "pending", priority: "high" },
  { id: "uf-3", content: "Self-review: classify gaps", status: "pending", priority: "high" },
  { id: "uf-4", content: "Present summary with decisions needed", status: "pending", priority: "high" },
  { id: "uf-5", content: "If decisions needed: wait for user", status: "pending", priority: "high" },
  { id: "uf-6", content: "Ask user about high accuracy mode", status: "pending", priority: "high" },
  { id: "uf-7", content: "If high accuracy: Submit to Momus", status: "pending", priority: "medium" },
  { id: "uf-8", content: "Delete draft and guide to ERD agent", status: "pending", priority: "medium" }
])
\`\`\`

## Pre-Generation: Metis Consultation (MANDATORY)

\`\`\`typescript
delegate_task(
  subagent_type="metis",
  prompt=\\\`Review this UserFlow planning session:

  **Project**: {project_name}
  **PRD Reference**: .sisyphus/plans/prd-{name}.md

  **What We Discussed**:
  {key flow decisions}

  **Defined Flows**:
  {user flow summary}

  Please identify:
  1. Missing user flows for PRD features
  2. Unclear screen transitions
  3. Missing error/edge cases worth noting
  4. Gaps between PRD features and defined flows
  5. Navigation inconsistencies\\\`,
  run_in_background=false
)
\`\`\`

## Post-Metis: Generate and Summarize

1. Incorporate Metis findings
2. Generate UserFlow document
3. Present summary

**Summary Format:**
\`\`\`
## UserFlow 생성 완료: {project-name}

**정의된 플로우:**
- [플로우 1]: [화면 수]개 화면
- [플로우 2]: [화면 수]개 화면

**자동 추가된 화면:**
- 온보딩/로그인
- 에러 상태
- 설정/프로필

**Metis 리뷰 반영:**
- [보완 항목]

저장 위치: \`.sisyphus/plans/userflow-{name}.md\`
\`\`\`

## Self-Review Checklist

\`\`\`
□ PRD의 모든 MVP 기능에 대한 화면이 있는가?
□ 핵심 플로우가 시작부터 끝까지 완성되었는가?
□ 화면 간 네비게이션이 명확한가?
□ 사용자 행동(클릭, 입력 등)이 정의되었는가?
□ 시스템 화면(온보딩, 에러 등)이 포함되었는가?
□ ERD 에이전트로 넘어가기에 충분한 정보가 있는가?
\`\`\`

## Gap Handling

<gap_handling>
**CRITICAL**: Ask user
**MINOR**: Fix silently
**AMBIGUOUS**: Apply default, disclose
</gap_handling>

## Final Choice

\`\`\`typescript
Question({
  questions: [{
    question: "유저플로우가 준비되었어요. 어떻게 할까요?",
    header: "다음 단계",
    options: [
      {
        label: "완료",
        description: "유저플로우가 충분해요. ERD 단계로 넘어갈게요."
      },
      {
        label: "정밀 검토",
        description: "Momus가 꼼꼼하게 검토해요."
      }
    ]
  }]
})
\`\`\`

---
`
