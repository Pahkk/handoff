# Graph Report - handoff  (2026-08-24)

## Corpus Check
- 99 files · ~35,881 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 354 nodes · 665 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59d7f16c`
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
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]

## God Nodes (most connected - your core abstractions)
1. `getRequestContext()` - 36 edges
2. `createClient()` - 33 edges
3. `apiError()` - 27 edges
4. `requireAppContext()` - 16 edges
5. `requireAdminContext()` - 16 edges
6. `compilerOptions` - 16 edges
7. `PageHeading()` - 13 edges
8. `showAppToast()` - 9 edges
9. `scripts` - 9 edges
10. `useEarlyAccess()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ProductLayout()` --calls--> `requireAppContext()`  [INFERRED]
  app/app/layout.tsx → lib/app-context.ts
- `RolePage()` --calls--> `requireAdminContext()`  [INFERRED]
  app/app/roles/[id]/page.tsx → lib/app-context.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  app/api/invites/accept/route.ts → lib/supabase/server.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  app/api/onboarding/route.ts → lib/supabase/server.ts
- `PATCH()` --calls--> `apiError()`  [INFERRED]
  app/api/processes/[id]/route.ts → lib/api.ts

## Import Cycles
- None detected.

## Communities (27 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (40): AccountControls(), AuthContext, AuthContextValue, AuthProvider(), useAuth(), after, Audience(), audiences (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (32): dependencies, lucide-react, next, openai, react, react-dom, @supabase/ssr, @supabase/supabase-js (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (47): getOpenAI(), companyAnswerSchema, ExtractedProcess, extractedProcessSchema, ProcessRecommendations, processRecommendationsSchema, suggestedRuleSchema, answerCompanyQuestion() (+39 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (5): Clarification, ProcessData, ProcessReview(), Rule, Step

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, mono, metadata

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (4): isSubmission(), POST(), requiredFields, Submission

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (31): POST(), schema, BusinessDiscoveryForm(), DashboardPage(), EmployeeHome(), greeting(), EmptyState(), PageHeading() (+23 more)

### Community 16 - "Community 16"
Cohesion: 0.27
Nodes (7): metadata, AppShell(), items, Props, ProductLayout(), AppToastMessage, readAppToast()

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (7): CreateRole(), OwnerAnswer(), Invite, Member, Role, TeamManager(), showAppToast()

### Community 21 - "Community 21"
Cohesion: 0.47
Nodes (7): recommendProcesses(), fallbackRecommendations(), prepareRecommendations(), POST(), schema, POST(), schema

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (5): OnboardingForm(), steps, getOptionalAppContext, requireUser(), OnboardingPage()

### Community 23 - "Community 23"
Cohesion: 0.50
Nodes (3): AskOpryn(), Message, prompts

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (6): CaptureProcess(), InitialCapture, mediaStages, Role, textStages, createClient()

### Community 26 - "Community 26"
Cohesion: 0.29
Nodes (5): LegalDocument(), LegalSection(), Logo(), metadata, metadata

## Knowledge Gaps
- **107 isolated node(s):** `schema`, `requiredFields`, `Submission`, `schema`, `schema` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 15` to `Community 16`, `Community 3`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 25` to `Community 16`, `Community 0`, `Community 5`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `getRequestContext()` connect `Community 3` to `Community 21`, `Community 15`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getRequestContext()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`getRequestContext()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `apiError()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`apiError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `requireAppContext()` (e.g. with `ProductLayout()` and `DashboardPage()`) actually correct?**
  _`requireAppContext()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `schema`, `requiredFields`, `Submission` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._