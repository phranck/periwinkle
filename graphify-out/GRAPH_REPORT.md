# Graph Report - periwinkle  (2026-07-23)

## Corpus Check
- 44 files · ~25,620 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 508 nodes · 899 edges · 24 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `321fda73`
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `buildApiReference()` - 18 edges
2. `resolveConfig()` - 15 edges
3. `isRecord()` - 14 edges
4. `compilerOptions` - 14 edges
5. `setupPeriwinkle()` - 12 edges
6. `cx()` - 10 edges
7. `DocsData` - 10 edges
8. `prepareDocsData()` - 9 edges
9. `ResolvedConfig` - 8 edges
10. `fail()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `printVersion()` --calls--> `require`  [INFERRED]
  src/cli.ts → scripts/verify-exports.mjs
- `prepareDocsData()` --calls--> `buildApiReference()`  [EXTRACTED]
  src/render/prepare.ts → src/model/api-reference.ts
- `runBuild()` --calls--> `loadConfig()`  [EXTRACTED]
  src/cli.ts → src/config/load-config.ts
- `runPreview()` --calls--> `startPreviewServer()`  [EXTRACTED]
  src/cli.ts → src/preview/serve.ts
- `setupPeriwinkle()` --calls--> `bindOpenApiContractDialog()`  [EXTRACTED]
  src/client/client.ts → src/client/openapi-contract-dialog.ts

## Import Cycles
- None detected.

## Communities (24 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (31): ApiOperationGroup, ApiParameter, ApiRequestBody, ApiResponse, ApiSchemaField, ApiSchemaVariant, assertKnownSchemaRefs(), buildApiReference() (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (75): ApiDocs(), sectionsAt(), ContentCard, ContentPanel, EndpointBlock(), ArrowCircleDownIcon, ArrowCircleUpIcon, Book1Icon (+67 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (47): author, bin, periwinkle, bugs, dependencies, iconsax-react, jiti, marked (+39 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (26): bindCollapsibles(), bindCopyButtons(), bindSchemaCard(), bindSchemaTabs(), bindSidebarScrollState(), bindThemeToggle(), bindToggleAll(), ClipboardWriter (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (39): content, description, content, description, content, description, description, schema (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (39): assertKnownKeys(), assertOptionalString(), CUSTOM_SECTION_POSITIONS, CustomSectionPosition, DEFAULT_DARK_COLORS, DEFAULT_FONTS, DEFAULT_LIGHT_COLORS, defineConfig() (+31 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (16): addTextMatches(), buildDocumentSearchIndex(), clearDocumentSearchHighlight(), DocumentSearchEntry, DocumentSearchResult, DocumentSearchResultGroup, escapeRegularExpression(), excludedHighlightParent() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (21): source, assist, actions, files, includes, formatter, enabled, indentStyle (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (18): description, in, name, type, description, scheme, type, components (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.30
Nodes (11): BaseProps, ContentCardBody(), ContentCardBodyCopy(), ContentCardBodyIntro(), ContentCardBodyStack(), ContentCardFooter(), ContentCardHeader(), ContentCardHeaderAddon() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (15): compilerOptions, jsx, lib, module, moduleResolution, noEmit, noImplicitOverride, noUncheckedIndexedAccess (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (12): Architecture, Configuration, Consumer equality (hard rule), Display model, Goal, Interactivity, Licensing and distribution, Output (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.20
Nodes (10): description, properties, required, type, type, name, website, Author (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.20
Nodes (10): description, properties, required, type, description, type, $ref, id (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (9): type, properties, required, type, authorId, title, BookInput, description (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (8): CLI, Configuration, Deploying, Embedding in an existing app, License, periwinkle, Quickstart, Reference

### Community 16 - "Community 16"
Cohesion: 0.39
Nodes (7): joinClasses(), SegmentedControl, SegmentedControlItem(), SegmentedControlItemIcon(), SegmentedControlItemLabel(), SegmentedControlRoot(), WithClassName

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (8): $ref, properties, $ref, author, category, rating, description, type

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (8): description, required, type, schemas, Book, SearchResult, description, oneOf

### Community 19 - "Community 19"
Cohesion: 0.25
Nodes (8): type, properties, required, type, type, code, message, ErrorResponse

### Community 20 - "Community 20"
Cohesion: 0.50
Nodes (4): type, tags, items, type

### Community 23 - "Community 23"
Cohesion: 0.36
Nodes (8): BaseProps, ContentPanelContent(), ContentPanelFooter(), ContentPanelHeader(), ContentPanelHeaderTitle(), ContentPanelRoot(), cx(), PanelProps

## Knowledge Gaps
- **168 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `includes` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `components` connect `Community 8` to `Community 18`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `schemas` connect `Community 18` to `Community 8`, `Community 12`, `Community 13`, `Community 14`, `Community 19`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **What connects `$schema`, `enabled`, `clientKind` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.050637730820483534 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.07822410147991543 - nodes in this community are weakly interconnected._