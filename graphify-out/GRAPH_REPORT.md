# Graph Report - handoff  (2026-08-26)

## Corpus Check
- 132 files · ~64,219 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 531 nodes · 1116 edges · 30 communities (27 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ee6ddd5`
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
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
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
- `POST()` --calls--> `getRequestContext()`  [INFERRED]
  app/api/calls/[id]/learn/route.ts → lib/api.ts
- `POST()` --calls--> `getRequestContext()`  [INFERRED]
  app/api/processes/[id]/learn/route.ts → lib/api.ts
- `CallReviewPage()` --calls--> `requireFeature()`  [INFERRED]
  app/app/calls/[id]/page.tsx → lib/billing/subscription.ts
- `DashboardPage()` --calls--> `hasFeature()`  [INFERRED]
  app/app/page.tsx → lib/billing/plans.ts
- `RolePage()` --calls--> `requireAdminContext()`  [INFERRED]
  app/app/roles/[id]/page.tsx → lib/app-context.ts

## Import Cycles
- None detected.

## Communities (30 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (51): annualBillingConfigured(), billingConfigured(), AccountControls(), AuthContext, AuthContextValue, AuthProvider(), useAuth(), after (+43 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (36): allowScripts, ffmpeg-static@5.3.0, dependencies, ffmpeg-static, lucide-react, next, openai, react (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (49): analyzeEmployeeQuestionImage(), answerCompanyQuestion(), embedKnowledge(), EmployeeQuestionImage, RetrievedKnowledge, suggestRuleFromOwnerAnswer(), POST(), schema (+41 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (48): OPENAI_MODELS, OPENAI_TEXT_REASONING, extractVideoFrames(), inputExtensions, PreparedAudio, prepareTranscriptionAudio(), runFfmpeg(), safeFileName() (+40 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (29): BillingSettings(), Props, CallPrivacy(), CallRow(), CallsLocked(), CallUploader(), CaptureProcess(), formatDuration() (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, mono, metadata

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (4): isSubmission(), POST(), requiredFields, Submission

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (43): POST(), schema, metadata, CallReview(), Finding, ProductLayout(), DashboardPage(), EmployeeHome() (+35 more)

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (3): Opryn deployment configuration, Stripe billing, Team invitation emails

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (7): Member, memberName(), MemberNode(), RankedMember, Role, TeamManager(), trainingPercent()

### Community 20 - "Community 20"
Cohesion: 0.27
Nodes (12): isPlanId(), getAppUrl(), getStripe(), getStripePriceId(), planFromStripePrice(), POST(), schema, POST() (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (8): groupChunks(), KnowledgeChunk, KnowledgeGap, KnowledgeProcess, ProcessBranch(), ProcessDetailGuide(), ProcessIdeas(), Recommendation

### Community 22 - "Community 22"
Cohesion: 0.28
Nodes (7): AskOpryn(), AttachedImage, canvasBlob(), Message, prepareQuestionImage(), Prompt, readDataUrl()

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (5): BusinessDiscoveryForm(), CreateRole(), OwnerAnswer(), Invite, showAppToast()

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (5): Clarification, ProcessData, ProcessReview(), Rule, Step

### Community 25 - "Community 25"
Cohesion: 0.10
Nodes (9): AuthForm(), Mode, OnboardingForm(), steps, OprynLogo(), Props, sizes, getOptionalAppContext (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.47
Nodes (7): recommendProcesses(), fallbackRecommendations(), prepareRecommendations(), POST(), schema, POST(), schema

### Community 27 - "Community 27"
Cohesion: 0.38
Nodes (5): AppShell(), items, Props, AppToastMessage, readAppToast()

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (4): Assignment, Person, Process, TrainingManager()

## Knowledge Gaps
- **144 isolated node(s):** `allowedImageTypes`, `imageSchema`, `schema`, `schema`, `schema` (+139 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 15` to `Community 26`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `getRequestContext()` connect `Community 3` to `Community 26`, `Community 4`, `Community 20`, `Community 15`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `OprynLogo()` connect `Community 25` to `Community 0`, `Community 27`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `getRequestContext()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`getRequestContext()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `apiError()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`apiError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `requireAdminContext()` (e.g. with `CallReviewPage()` and `RolePage()`) actually correct?**
  _`requireAdminContext()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getOrganizationPlan()` (e.g. with `ProductLayout()` and `DashboardPage()`) actually correct?**
  _`getOrganizationPlan()` has 2 INFERRED edges - model-reasoned connections that need verification._