# Graph Report - plannerpsi  (2026-07-12)

## Corpus Check
- 110 files · ~64,068 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 635 nodes · 655 edges · 90 communities (58 shown, 32 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9d519fa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- i
- uc
- temp.js
- ec
- index.ts
- App.tsx
- get
- yc
- $
- compilerOptions
- react
- devDependencies
- constructor
- dependencies
- compilerOptions
- add
- gp
- compilerOptions
- Header.tsx
- motion.ts
- then
- manifest.json
- drive.ts
- zl
- rf
- .oxlintrc.json
- sr
- TimelineView.tsx
- package.json
- spotifyAuth.ts
- studyStats.ts
- ProcedureFlow.tsx
- Planning.tsx
- radioStore.ts
- sw.js
- stoicQuotes.ts
- KanbanBoard.tsx
- StudyMediaManager
- Tasks.tsx
- mo
- StudyTranscript.tsx
- CalendarView.tsx
- procedureParser.ts
- pushManager.ts
- MindMapBoard.tsx
- StudySidebar.tsx
- notificationManager.ts
- mindMapStore.ts
- spotifyStore.ts
- taskStore.ts
- index.ts
- React + TypeScript + Vite
- ExamCountdownWidget.tsx
- NotionEditor.tsx
- ToastContainer.tsx
- migration.ts
- Procedures.tsx
- Stats.tsx
- toastStore.ts
- fd
- AgendaWidget.tsx
- WeatherWidget.tsx
- CommandPalette.tsx
- StudyPlayer.tsx
- access.ts
- spotifyApi.ts
- authStore.ts
- focusStore.ts
- gamificationStore.ts
- patientStore.ts
- date-fns

## God Nodes (most connected - your core abstractions)
1. `react` - 43 edges
2. `compilerOptions` - 19 edges
3. `compilerOptions` - 15 edges
4. `compilerOptions` - 12 edges
5. `scripts` - 7 edges
6. `PlannerPSI` - 7 edges
7. `ErrorBoundary` - 6 edges
8. `beginLogin()` - 5 edges
9. `StudyMediaManager` - 5 edges
10. `sendToSW()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `TaskComments()` --indirect_call--> `profile()`  [INFERRED]
  src/components/tasks/TaskComments.tsx → src/lib/access.test.ts
- `Flow()` --indirect_call--> `MindMapNode()`  [INFERRED]
  src/components/mindmaps/MindMapBoard.tsx → src/components/mindmaps/MindMapNode.tsx
- `StoicQuoteWidget()` --references--> `STOIC_QUOTES`  [EXTRACTED]
  src/components/dashboard/StoicQuoteWidget.tsx → src/lib/stoicQuotes.ts
- `TaskForm()` --references--> `SMART_DATE_TAGS`  [EXTRACTED]
  src/components/tasks/TaskForm.tsx → src/types/index.ts
- `Study()` --references--> `COURSES`  [EXTRACTED]
  src/pages/Study.tsx → src/lib/drive.ts

## Import Cycles
- None detected.

## Communities (90 total, 32 thin omitted)

### Community 0 - "i"
Cohesion: 0.04
Nodes (45): clsx, @dagrejs/dagre, date-fns, framer-motion, @hello-pangea/dnd, hls.js, lucide-react, dependencies (+37 more)

### Community 1 - "uc"
Cohesion: 0.05
Nodes (33): TaskForm(), AppModule, DailyNote, DATE_FILTER_TABS, DateTagConfig, DateTagId, FlowEdge, FlowPosition (+25 more)

### Community 2 - "temp.js"
Cohesion: 0.06
Nodes (35): jsdom, oxlint, devDependencies, jsdom, oxlint, puppeteer, tailwindcss, @tailwindcss/vite (+27 more)

### Community 3 - "ec"
Cohesion: 0.07
Nodes (21): Focus, Leaderboard, MindMaps, Patients, Planning, Procedures, Settings, Stats (+13 more)

### Community 4 - "index.ts"
Cohesion: 0.07
Nodes (29): DOM, DOM.Iterable, ./src/*, vite/client, vitest/globals, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly (+21 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 7 - "yc"
Cohesion: 0.12
Nodes (16): WebWorker, compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit (+8 more)

### Community 8 - "$"
Cohesion: 0.17
Nodes (10): AppShellProps, getGreeting(), Header(), RadioControls(), NAV_ITEMS, NAV_MODULES, Sidebar(), SpotifyControls() (+2 more)

### Community 9 - "compilerOptions"
Cohesion: 0.12
Nodes (16): checkboxVariants, dragVariants, fadeIn, modalContent, modalOverlay, pageTransition, scaleIn, sidebarVariants (+8 more)

### Community 10 - "react"
Cohesion: 0.13
Nodes (14): background_color, categories, description, display, icons, lang, name, scope (+6 more)

### Community 11 - "devDependencies"
Cohesion: 0.17
Nodes (13): Course, COURSES, DriveFile, DriveModule, DriveTopic, fetchFolderContents(), fetchFolderTree(), fetchMarkdownContent() (+5 more)

### Community 12 - "constructor"
Cohesion: 0.17
Nodes (11): ignorePatterns, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, TaskForm_remote.tsx (+3 more)

### Community 13 - "dependencies"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, dev, lint, preview, test (+3 more)

### Community 14 - "compilerOptions"
Cohesion: 0.18
Nodes (6): PRIORITY_BAR_COLORS, STATUS_GROUP_ORDER, StatusGroupProps, TimelineBarProps, TooltipData, ZOOM_LEVELS

### Community 15 - "add"
Cohesion: 0.38
Nodes (8): base64UrlEncode(), beginLogin(), generateCodeChallenge(), generateCodeVerifier(), getRedirectUri(), handleCallbackIfPresent(), randomState(), TokenResponse

### Community 16 - "gp"
Cohesion: 0.27
Nodes (8): buildHeatmap(), computeModuleProgress(), computeStudyStreak(), countModuleLessons(), HeatmapDay, ModuleProgress, toDateKey(), WeeklyHours

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (4): edgeTypes, NODE_COLOR_PALETTE, nodeTypes, ProcedureFlowProps

### Community 18 - "Header.tsx"
Cohesion: 0.32
Nodes (3): DailyNotes(), MOOD_OPTIONS, NotesHistory()

### Community 19 - "motion.ts"
Cohesion: 0.25
Nodes (6): API_MIRRORS, CURATED_STATIONS, RadioState, RadioStation, searchCache, useRadioStore

### Community 20 - "then"
Cohesion: 0.29
Nodes (3): StoicQuoteWidget(), STOIC_QUOTES, StoicQuote

### Community 21 - "manifest.json"
Cohesion: 0.38
Nodes (5): COLUMN_COLORS, formatDueDate(), isOverdue(), KanbanCard(), KanbanCardProps

### Community 22 - "drive.ts"
Cohesion: 0.33
Nodes (5): hasModuleAccess(), ROLE_ACCESS, expected, modules, profile()

### Community 24 - "rf"
Cohesion: 0.33
Nodes (4): filterByDateTag(), Tasks(), VIEW_COMPONENTS, VIEW_OPTIONS

### Community 27 - "TimelineView.tsx"
Cohesion: 0.60
Nodes (5): getPushStatus(), isPushSupported(), subscribeToPush(), unsubscribeFromPush(), urlBase64ToUint8Array()

### Community 29 - "spotifyAuth.ts"
Cohesion: 0.60
Nodes (3): countLessons(), StudySidebar(), TopicNode()

### Community 30 - "studyStats.ts"
Cohesion: 0.80
Nodes (4): escapeRegExp(), highlightMatches(), StudyTranscript(), timestampToSeconds()

### Community 31 - "ProcedureFlow.tsx"
Cohesion: 0.60
Nodes (4): fetchICSEvents(), ICSEvent, parseICS(), parseICSDate()

### Community 32 - "Planning.tsx"
Cohesion: 0.60
Nodes (3): checkAndNotifyTasks(), getSentLog(), saveSentLog()

### Community 33 - "radioStore.ts"
Cohesion: 0.40
Nodes (4): initialNodes, MindMapNodeData, MindMapState, useMindMapStore

### Community 34 - "sw.js"
Cohesion: 0.40
Nodes (4): SpotifyPlaybackState, SpotifyPlaylist, SpotifyState, useSpotifyStore

### Community 37 - "StudyMediaManager"
Cohesion: 0.70
Nodes (3): public.can_access_module(), public.profiles, public.user_module_access

### Community 38 - "Tasks.tsx"
Cohesion: 0.50
Nodes (3): public.log_task_activity(), public.task_activity, tasks_log_activity

### Community 39 - "mo"
Cohesion: 0.50
Nodes (4): on_auth_user_created, profiles, public.handle_new_user(), tasks

### Community 41 - "CalendarView.tsx"
Cohesion: 0.83
Nodes (3): EXAM_KEYWORDS, ExamCountdownWidget(), isExamEvent()

### Community 47 - "notificationManager.ts"
Cohesion: 0.67
Nodes (3): heatColor(), Stats(), WEEKDAY_LABELS

### Community 48 - "mindMapStore.ts"
Cohesion: 0.50
Nodes (3): Toast, ToastState, useToastStore

### Community 49 - "spotifyStore.ts"
Cohesion: 0.67
Nodes (3): public.patients, public.task_comments, public.tasks

### Community 50 - "taskStore.ts"
Cohesion: 0.67
Nodes (3): public.task_comments, public.task_proposals, public.tasks

### Community 78 - "date-fns"
Cohesion: 0.25
Nodes (7): Banco e migrations, Deploy, Desenvolvimento local, PlannerPSI, Requisitos, Scripts, Variáveis de ambiente

## Knowledge Gaps
- **278 isolated node(s):** `$schema`, `temp.js`, `TaskForm_remote.tsx`, `typescript`, `oxc` (+273 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `get` to `ec`, `$`, `devDependencies`, `constructor`, `compilerOptions`, `compilerOptions`, `Header.tsx`, `then`, `manifest.json`, `rf`, `.oxlintrc.json`, `package.json`, `spotifyAuth.ts`, `studyStats.ts`, `CalendarView.tsx`, `procedureParser.ts`, `pushManager.ts`, `icsParser.ts`, `notificationManager.ts`, `index.ts`, `React + TypeScript + Vite`, `ExamCountdownWidget.tsx`, `NotionEditor.tsx`, `ToastContainer.tsx`, `migration.ts`, `procedureStore.ts`, `delegationPulse.test.ts`, `Leaderboard.tsx`, `Patients.tsx`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `TaskForm()` connect `uc` to `get`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `$schema`, `temp.js`, `TaskForm_remote.tsx` to the rest of the system?**
  _278 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `i` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `uc` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `temp.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `ec` be split into smaller, more focused modules?**
  _Cohesion score 0.07130124777183601 - nodes in this community are weakly interconnected._