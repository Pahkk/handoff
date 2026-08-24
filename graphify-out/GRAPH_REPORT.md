# Graph Report - handoff  (2026-08-24)

## Corpus Check
- 27 files · ~7,586 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 137 nodes · 179 edges · 17 communities (14 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `438bee60`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `useEarlyAccess()` - 8 edges
3. `scripts` - 7 edges
4. `SectionIntro()` - 4 edges
5. `AccountControls()` - 3 edges
6. `Pricing()` - 3 edges
7. `FinalCTA()` - 3 edges
8. `Hero()` - 3 edges
9. `LegalDocument()` - 3 edges
10. `LegalSection()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  app/auth/callback/route.ts → lib/supabase/server.ts
- `Hero()` --calls--> `useEarlyAccess()`  [EXTRACTED]
  components/hero.tsx → components/early-access.tsx
- `Navbar()` --calls--> `useEarlyAccess()`  [EXTRACTED]
  components/navigation.tsx → components/early-access.tsx
- `Pricing()` --calls--> `useEarlyAccess()`  [EXTRACTED]
  components/closing-sections.tsx → components/early-access.tsx
- `FinalCTA()` --calls--> `useEarlyAccess()`  [EXTRACTED]
  components/closing-sections.tsx → components/early-access.tsx

## Import Cycles
- None detected.

## Communities (17 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (17): areas, Hero(), Independence(), RoleBuilder(), roleGroups, VacationReadiness(), HowItWorks(), interruptions (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (17): dependencies, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js, name (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.20
Nodes (11): after, Audience(), audiences, before, Comparison(), FAQ(), faqs, FinalCTA() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (10): AccountControls(), AuthContext, AuthContextValue, AuthProvider(), useAuth(), Footer(), links, Navbar() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (4): ContextValue, EarlyAccessContext, EarlyAccessProvider(), Submission

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, metadata, mono

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (4): isSubmission(), POST(), requiredFields, Submission

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (4): LegalDocument(), LegalSection(), metadata, metadata

## Knowledge Gaps
- **65 isolated node(s):** `requiredFields`, `Submission`, `geist`, `mono`, `metadata` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `requiredFields`, `Submission`, `geist` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._