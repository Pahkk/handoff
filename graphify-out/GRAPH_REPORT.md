# Graph Report - handoff  (2026-08-24)

## Corpus Check
- 97 files · ~35,380 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 348 nodes · 637 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d7134006`
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
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `getRequestContext()` - 36 edges
2. `createClient()` - 33 edges
3. `apiError()` - 27 edges
4. `requireAppContext()` - 16 edges
5. `requireAdminContext()` - 16 edges
6. `compilerOptions` - 16 edges
7. `PageHeading()` - 13 edges
8. `scripts` - 9 edges
9. `useEarlyAccess()` - 8 edges
10. `getOpenAI()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ProductLayout()` --calls--> `requireAppContext()`  [INFERRED]
  app/app/layout.tsx → lib/app-context.ts
- `ProcessDetailPage()` --calls--> `requireAppContext()`  [INFERRED]
  app/app/processes/[id]/page.tsx → lib/app-context.ts
- `RolePage()` --calls--> `requireAdminContext()`  [INFERRED]
  app/app/roles/[id]/page.tsx → lib/app-context.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  app/api/invites/accept/route.ts → lib/supabase/server.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  app/api/onboarding/route.ts → lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (24 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (40): after, Audience(), audiences, before, Comparison(), FAQ(), faqs, FinalCTA() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (32): dependencies, lucide-react, next, openai, react, react-dom, @supabase/ssr, @supabase/supabase-js (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (31): answerCompanyQuestion(), embedKnowledge(), suggestRuleFromOwnerAnswer(), POST(), schema, DELETE(), PATCH(), schema (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (5): Clarification, ProcessData, ProcessReview(), Rule, Step

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (16): AppShell(), items, Props, CaptureProcess(), InitialCapture, mediaStages, Role, textStages (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, mono, metadata

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (4): isSubmission(), POST(), requiredFields, Submission

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (34): POST(), schema, metadata, BusinessDiscoveryForm(), CreateRole(), ProductLayout(), OwnerAnswer(), DashboardPage() (+26 more)

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): Invite, Member, Role, TeamManager()

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (23): getOpenAI(), companyAnswerSchema, ExtractedProcess, extractedProcessSchema, ProcessRecommendations, processRecommendationsSchema, suggestedRuleSchema, extractProcess() (+15 more)

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (5): OnboardingForm(), steps, getOptionalAppContext, requireUser(), OnboardingPage()

### Community 23 - "Community 23"
Cohesion: 0.50
Nodes (3): AskOpryn(), Message, prompts

## Knowledge Gaps
- **108 isolated node(s):** `schema`, `requiredFields`, `Submission`, `schema`, `schema` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 15` to `Community 3`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.247) - this node is a cross-community bridge._
- **Why does `getRequestContext()` connect `Community 3` to `Community 21`, `Community 15`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getRequestContext()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`getRequestContext()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `apiError()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`apiError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `requireAppContext()` (e.g. with `ProductLayout()` and `DashboardPage()`) actually correct?**
  _`requireAppContext()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `schema`, `requiredFields`, `Submission` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.062310949788263764 - nodes in this community are weakly interconnected._