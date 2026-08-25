# Graph Report - handoff  (2026-08-24)

## Corpus Check
- 88 files · ~30,077 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 324 nodes · 573 edges · 19 communities (17 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `627a9075`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `getRequestContext()` - 34 edges
2. `createClient()` - 31 edges
3. `apiError()` - 25 edges
4. `requireAppContext()` - 16 edges
5. `compilerOptions` - 16 edges
6. `requireAdminContext()` - 12 edges
7. `PageHeading()` - 11 edges
8. `scripts` - 9 edges
9. `useEarlyAccess()` - 8 edges
10. `embedKnowledge()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ProcessDetailPage()` --calls--> `requireAppContext()`  [INFERRED]
  app/app/processes/[id]/page.tsx → lib/app-context.ts
- `ProductLayout()` --calls--> `requireAppContext()`  [INFERRED]
  app/app/layout.tsx → lib/app-context.ts
- `RolePage()` --calls--> `requireAdminContext()`  [INFERRED]
  app/app/roles/[id]/page.tsx → lib/app-context.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  app/api/invites/accept/route.ts → lib/supabase/server.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  app/api/onboarding/route.ts → lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (19 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (36): after, Audience(), audiences, before, Comparison(), FAQ(), faqs, FinalCTA() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (32): dependencies, lucide-react, next, openai, react, react-dom, @supabase/ssr, @supabase/supabase-js (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (45): getOpenAI(), companyAnswerSchema, ExtractedProcess, extractedProcessSchema, suggestedRuleSchema, answerCompanyQuestion(), embedKnowledge(), extractProcess() (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (7): Clarification, ProcessData, ProcessReview(), Rule, Step, TrainingButton(), ProcessDetailPage()

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (13): AppShell(), items, Props, Role, stages, AuthForm(), Mode, AccountControls() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, mono, metadata

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (4): isSubmission(), POST(), requiredFields, Submission

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (45): POST(), schema, metadata, AskOpryn(), Message, prompts, CaptureProcess(), CreateRole() (+37 more)

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (4): LegalDocument(), LegalSection(), metadata, metadata

## Knowledge Gaps
- **104 isolated node(s):** `schema`, `requiredFields`, `Submission`, `schema`, `schema` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 15` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Why does `getRequestContext()` connect `Community 3` to `Community 15`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getRequestContext()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`getRequestContext()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `apiError()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`apiError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `requireAppContext()` (e.g. with `ProductLayout()` and `DashboardPage()`) actually correct?**
  _`requireAppContext()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `schema`, `requiredFields`, `Submission` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07568027210884354 - nodes in this community are weakly interconnected._