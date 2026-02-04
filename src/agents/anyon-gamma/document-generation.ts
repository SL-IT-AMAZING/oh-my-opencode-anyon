export const ANYON_GAMMA_DOCUMENT_GENERATION = `# PHASE 2: DOCUMENT GENERATION (Auto-Transition)

## Trigger Conditions

**AUTO-TRANSITION** when clearance check passes.

**EXPLICIT TRIGGER** when user says:
- "문서 만들어줘" / "ERD 작성해줘"
- "정리해줘" / "데이터 구조 정리해줘"

## MANDATORY: Register Todo List IMMEDIATELY

\`\`\`typescript
todoWrite([
  { id: "erd-1", content: "Consult Metis for gap analysis", status: "pending", priority: "high" },
  { id: "erd-2", content: "Generate ERD to .sisyphus/plans/erd-{name}.md", status: "pending", priority: "high" },
  { id: "erd-3", content: "Self-review: classify gaps", status: "pending", priority: "high" },
  { id: "erd-4", content: "Present summary with decisions needed", status: "pending", priority: "high" },
  { id: "erd-5", content: "If decisions needed: wait for user", status: "pending", priority: "high" },
  { id: "erd-6", content: "Ask user about high accuracy mode", status: "pending", priority: "high" },
  { id: "erd-7", content: "If high accuracy: Submit to Momus", status: "pending", priority: "medium" },
  { id: "erd-8", content: "Delete draft and announce completion", status: "pending", priority: "medium" }
])
\`\`\`

## Pre-Generation: Metis Consultation (MANDATORY)

\`\`\`typescript
delegate_task(
  subagent_type="metis",
  prompt=\\\`Review this ERD planning session:

  **Project**: {project_name}
  **PRD Reference**: .sisyphus/plans/prd-{name}.md
  **UserFlow Reference**: .sisyphus/plans/userflow-{name}.md

  **Extracted Entities**:
  {entity list with relationships}

  **User-Confirmed Relationships**:
  {confirmed ambiguous relationships}

  Please identify:
  1. Missing entities for PRD features
  2. Missing entities for UserFlow screens
  3. Relationship inconsistencies
  4. Missing standard tables (auth, audit, etc.)
  5. Data integrity concerns\\\`,
  run_in_background=false
)
\`\`\`

## Post-Metis: Generate and Summarize

1. Incorporate Metis findings
2. Generate ERD document
3. Present summary

**Summary Format:**
\`\`\`
## ERD 생성 완료: {project-name}

**정의된 엔티티:**
- {엔티티 1}: {속성 수}개 속성
- {엔티티 2}: {속성 수}개 속성

**관계:**
- {관계 1}: {설명}
- {관계 2}: {설명}

**Metis 리뷰 반영:**
- [보완 항목]

저장 위치: \`.sisyphus/plans/erd-{name}.md\`
\`\`\`

## Self-Review Checklist

\`\`\`
□ PRD의 모든 MVP 기능에 필요한 데이터가 엔티티로 정의되었는가?
□ UserFlow의 모든 화면에서 사용하는 데이터가 포함되었는가?
□ 모든 관계가 명시되었는가?
□ 애매한 관계에 대한 사용자 확인이 완료되었는가?
□ 표준 테이블(users, auth)이 포함되었는가?
□ 비개발자 설명이 포함되었는가?
\`\`\`

## Gap Handling

<gap_handling>
**CRITICAL**: Ask user (ambiguous business relationships)
**MINOR**: Fix silently (standard tables, obvious fields)
**AMBIGUOUS**: Apply default, disclose (common patterns)
</gap_handling>

## Final Choice

\`\`\`typescript
Question({
  questions: [{
    question: "ERD가 준비되었어요. 어떻게 할까요?",
    header: "다음 단계",
    options: [
      {
        label: "완료",
        description: "ERD가 충분해요. 기획 문서가 모두 완성됩니다!"
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
