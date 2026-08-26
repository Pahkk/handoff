# Graph Report - handoff  (2026-08-25)

## Corpus Check
- 111 files · ~45,954 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 434 nodes · 809 edges · 30 communities (26 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b5bbff8f`
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
1. `getRequestContext()` - 40 edges
2. `createClient()` - 35 edges
3. `apiError()` - 29 edges
4. `requireAdminContext()` - 18 edges
5. `requireAppContext()` - 16 edges
6. `compilerOptions` - 16 edges
7. `PageHeading()` - 14 edges
8. `POST()` - 10 edges
9. `showAppToast()` - 10 edges
10. `getOpenAI()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `ProductLayout()` --calls--> `requireAppContext()`  [INFERRED]
  app/app/layout.tsx → lib/app-context.ts
- `RolePage()` --calls--> `requireAdminContext()`  [INFERRED]
  app/app/roles/[id]/page.tsx → lib/app-context.ts
- `InvitePage()` --calls--> `createClient()`  [EXTRACTED]
  app/invite/[token]/page.tsx → lib/supabase/server.ts
- `POST()` --calls--> `apiError()`  [EXTRACTED]
  app/api/ask/route.ts → lib/api.ts
- `POST()` --calls--> `getRequestContext()`  [EXTRACTED]
  app/api/ask/route.ts → lib/api.ts

## Import Cycles
- None detected.

## Communities (30 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (41): AccountControls(), AuthContext, AuthContextValue, AuthProvider(), useAuth(), after, Audience(), audiences (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): allowScripts, ffmpeg-static@5.3.0, dependencies, ffmpeg-static, lucide-react, next, openai, react (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (48): OPENAI_MODELS, OPENAI_TEXT_REASONING, extractProcessFromTranscript(), logAI(), suggestRuleFromOwnerAnswer(), transcribeAudio(), POST(), schema (+40 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (27): getOpenAI(), companyAnswerSchema, employeeImageCaseSchema, ExtractedProcess, extractedProcessSchema, ProcessRecommendations, processRecommendationsSchema, suggestedRuleSchema (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (11): CaptureProcess(), formatDuration(), InitialCapture, Role, textStages, AuthForm(), Mode, InviteAccept() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, mono, metadata

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (4): isSubmission(), POST(), requiredFields, Submission

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (37): POST(), schema, metadata, AppShell(), ProductLayout(), DashboardPage(), EmployeeHome(), greeting() (+29 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (7): Member, memberName(), MemberNode(), RankedMember, Role, TeamManager(), trainingPercent()

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (9): inputExtensions, PreparedAudio, prepareTranscriptionAudio(), runFfmpeg(), safeFileName(), ALLOWED_MEDIA_MIME_TYPES, AUDIO_MIME_TYPES, VIDEO_MIME_TYPES (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (8): groupChunks(), KnowledgeChunk, KnowledgeGap, KnowledgeProcess, ProcessBranch(), ProcessDetailGuide(), ProcessIdeas(), Recommendation

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (4): OnboardingForm(), steps, getOptionalAppContext, OnboardingPage()

### Community 23 - "Community 23"
Cohesion: 0.28
Nodes (7): AskOpryn(), AttachedImage, canvasBlob(), Message, prepareQuestionImage(), Prompt, readDataUrl()

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (5): BusinessDiscoveryForm(), CreateRole(), OwnerAnswer(), Invite, showAppToast()

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (5): Clarification, ProcessData, ProcessReview(), Rule, Step

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (4): LegalDocument(), LegalSection(), metadata, metadata

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (4): Assignment, Person, Process, TrainingManager()

### Community 28 - "Community 28"
Cohesion: 0.47
Nodes (4): items, Props, AppToastMessage, readAppToast()

## Knowledge Gaps
- **125 isolated node(s):** `allowedImageTypes`, `imageSchema`, `schema`, `requiredFields`, `Submission` (+120 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 15` to `Community 3`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.260) - this node is a cross-community bridge._
- **Why does `getRequestContext()` connect `Community 3` to `Community 4`, `Community 15`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 5` to `Community 0`, `Community 28`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getRequestContext()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`getRequestContext()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `apiError()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`apiError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `requireAppContext()` (e.g. with `ProductLayout()` and `DashboardPage()`) actually correct?**
  _`requireAppContext()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `allowedImageTypes`, `imageSchema`, `schema` to the rest of the system?**
  _125 weakly-connected nodes found - possible documentation gaps or missing edges._