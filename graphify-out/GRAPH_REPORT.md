# Graph Report - handoff  (2026-08-25)

## Corpus Check
- 110 files · ~43,860 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 422 nodes · 787 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5668ebdb`
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
- [[_COMMUNITY_Community 26|Community 26]]

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
10. `scripts` - 9 edges

## Surprising Connections (you probably didn't know these)
- `LearnBusinessPage()` --calls--> `requireAdminContext()`  [EXTRACTED]
  app/app/getting-started/learn/page.tsx → lib/app-context.ts
- `ProductLayout()` --calls--> `requireAppContext()`  [INFERRED]
  app/app/layout.tsx → lib/app-context.ts
- `RolePage()` --calls--> `requireAdminContext()`  [INFERRED]
  app/app/roles/[id]/page.tsx → lib/app-context.ts
- `InvitePage()` --calls--> `createClient()`  [EXTRACTED]
  app/invite/[token]/page.tsx → lib/supabase/server.ts
- `POST()` --calls--> `answerCompanyQuestion()`  [EXTRACTED]
  app/api/ask/route.ts → lib/ai/services.ts

## Import Cycles
- None detected.

## Communities (24 total, 4 thin omitted)

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
Cohesion: 0.09
Nodes (36): embedKnowledge(), suggestRuleFromOwnerAnswer(), POST(), schema, DELETE(), PATCH(), schema, DELETE() (+28 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (34): OPENAI_MODELS, OPENAI_TEXT_REASONING, inputExtensions, PreparedAudio, prepareTranscriptionAudio(), runFfmpeg(), safeFileName(), ALLOWED_MEDIA_MIME_TYPES (+26 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (10): CaptureProcess(), InitialCapture, Role, textStages, AuthForm(), Mode, InviteAccept(), InviteSessionBridge() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, mono, metadata

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (4): isSubmission(), POST(), requiredFields, Submission

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (40): POST(), schema, metadata, AppShell(), CreateRole(), ProductLayout(), OwnerAnswer(), DashboardPage() (+32 more)

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (26): items, Props, AskOpryn(), Message, Prompt, BusinessDiscoveryForm(), Clarification, ProcessData (+18 more)

### Community 20 - "Community 20"
Cohesion: 0.47
Nodes (7): recommendProcesses(), fallbackRecommendations(), prepareRecommendations(), POST(), schema, POST(), schema

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (11): groupChunks(), KnowledgeChunk, KnowledgeGap, KnowledgeProcess, KnowledgeTree(), ProcessBranch(), ProcessDetailGuide(), ProcessIdeas() (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (4): LegalDocument(), LegalSection(), metadata, metadata

## Knowledge Gaps
- **122 isolated node(s):** `schema`, `requiredFields`, `Submission`, `schema`, `schema` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 15` to `Community 5`, `Community 3`, `Community 20`, `Community 21`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Why does `getRequestContext()` connect `Community 3` to `Community 4`, `Community 20`, `Community 15`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 5` to `Community 0`, `Community 19`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getRequestContext()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`getRequestContext()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `apiError()` (e.g. with `DELETE()` and `PATCH()`) actually correct?**
  _`apiError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `requireAppContext()` (e.g. with `ProductLayout()` and `DashboardPage()`) actually correct?**
  _`requireAppContext()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `schema`, `requiredFields`, `Submission` to the rest of the system?**
  _122 weakly-connected nodes found - possible documentation gaps or missing edges._