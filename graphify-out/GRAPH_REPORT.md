# Graph Report - handoff  (2026-08-26)

## Corpus Check
- 132 files · ~63,019 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 527 nodes · 1110 edges · 24 communities (21 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `073eb703`
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
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `getRequestContext()` - 52 edges
2. `createClient()` - 38 edges
3. `apiError()` - 31 edges
4. `requireAdminContext()` - 22 edges
5. `getOrganizationPlan()` - 18 edges
6. `requireFeature()` - 17 edges
7. `PageHeading()` - 16 edges
8. `requireAppContext()` - 16 edges
9. `compilerOptions` - 16 edges
10. `POST()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `requireFeature()`  [INFERRED]
  app/api/calls/[id]/learn/route.ts → lib/billing/subscription.ts
- `POST()` --calls--> `getRequestContext()`  [INFERRED]
  app/api/calls/[id]/learn/route.ts → lib/api.ts
- `POST()` --calls--> `requireFeature()`  [INFERRED]
  app/api/processes/[id]/learn/route.ts → lib/billing/subscription.ts
- `POST()` --calls--> `getRequestContext()`  [INFERRED]
  app/api/processes/[id]/learn/route.ts → lib/api.ts
- `DELETE()` --calls--> `getRequestContext()`  [EXTRACTED]
  app/api/team/invites/route.ts → lib/api.ts

## Import Cycles
- None detected.

## Communities (24 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (45): annualBillingConfigured(), billingConfigured(), AccountControls(), AuthContext, AuthContextValue, AuthProvider(), useAuth(), after (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (36): allowScripts, ffmpeg-static@5.3.0, dependencies, ffmpeg-static, lucide-react, next, openai, react (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (46): ProcessRecommendations, embedKnowledge(), recommendProcesses(), POST(), schema, DELETE(), PATCH(), schema (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (53): OPENAI_MODELS, OPENAI_TEXT_REASONING, extractVideoFrames(), inputExtensions, PreparedAudio, prepareTranscriptionAudio(), runFfmpeg(), safeFileName() (+45 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (25): AppShell(), items, Props, CallPrivacy(), CallRow(), CallsLocked(), CallUploader(), CaptureProcess() (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, mono, metadata

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (4): isSubmission(), POST(), requiredFields, Submission

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (45): POST(), schema, metadata, BusinessDiscoveryForm(), CallReview(), Finding, ProductLayout(), DashboardPage() (+37 more)

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (3): Opryn deployment configuration, Stripe billing, Team invitation emails

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (29): AskOpryn(), AttachedImage, canvasBlob(), Message, prepareQuestionImage(), Prompt, readDataUrl(), CreateRole() (+21 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (30): BillingSettings(), Props, BillingInterval, getTeamLimit(), isPlanId(), PLAN_DETAILS, PLAN_FEATURES, PlanFeature (+22 more)

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (8): groupChunks(), KnowledgeChunk, KnowledgeGap, KnowledgeProcess, ProcessBranch(), ProcessDetailGuide(), ProcessIdeas(), Recommendation

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (4): LegalDocument(), LegalSection(), metadata, metadata

## Knowledge Gaps
- **142 isolated node(s):** `allowedImageTypes`, `imageSchema`, `schema`, `schema`, `schema` (+137 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 15` to `Community 3`, `Community 5`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `getRequestContext()` connect `Community 3` to `Community 4`, `Community 20`, `Community 15`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `OprynLogo()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `getRequestContext()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`getRequestContext()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `apiError()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`apiError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `requireAdminContext()` (e.g. with `CallReviewPage()` and `RolePage()`) actually correct?**
  _`requireAdminContext()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getOrganizationPlan()` (e.g. with `ProductLayout()` and `DashboardPage()`) actually correct?**
  _`getOrganizationPlan()` has 2 INFERRED edges - model-reasoned connections that need verification._