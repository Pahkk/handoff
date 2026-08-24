# Graph Report - handoff  (2026-08-24)

## Corpus Check
- 18 files · ~238,990 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 108 nodes · 139 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `useEarlyAccess()` - 8 edges
3. `scripts` - 7 edges
4. `SectionIntro()` - 4 edges
5. `Pricing()` - 3 edges
6. `FinalCTA()` - 3 edges
7. `Hero()` - 3 edges
8. `Navbar()` - 3 edges
9. `AppWindow()` - 3 edges
10. `ProductButton()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Pricing()` --calls--> `useEarlyAccess()`  [EXTRACTED]
  components/closing-sections.tsx → components/early-access.tsx
- `FinalCTA()` --calls--> `useEarlyAccess()`  [EXTRACTED]
  components/closing-sections.tsx → components/early-access.tsx
- `Hero()` --calls--> `useEarlyAccess()`  [EXTRACTED]
  components/hero.tsx → components/early-access.tsx
- `Navbar()` --calls--> `useEarlyAccess()`  [EXTRACTED]
  components/navigation.tsx → components/early-access.tsx

## Import Cycles
- None detected.

## Communities (14 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (16): after, Audience(), audiences, before, Comparison(), FAQ(), faqs, FinalCTA() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (15): dependencies, lucide-react, next, react, react-dom, name, private, scripts (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (10): areas, Independence(), RoleBuilder(), roleGroups, VacationReadiness(), AppWindow(), Insight(), Logo() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (6): HowItWorks(), interruptions, LearningLoop(), PainSection(), process, SectionIntro()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (4): ContextValue, EarlyAccessContext, EarlyAccessProvider(), Submission

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (3): geist, metadata, mono

## Knowledge Gaps
- **57 isolated node(s):** `geist`, `mono`, `metadata`, `audiences`, `before` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `geist`, `mono`, `metadata` to the rest of the system?**
  _57 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._