# Narrative cursor — feature brief

Handoff doc for a fresh session. Branch: `narrative-cursor` (off `main`).
Nothing is implemented yet. Delete this file when the feature ships.

---

## Goal

One single **"Paula" cursor**, home only (`HomeScrollExperience` / `home-scroll`),
that accompanies the viewer through the whole scrubbed home journey:

- **Narrates** as you scroll — it moves to where it makes sense per section and
  drops a first-person comment ("Paula" talking to the viewer).
- **Follows the transition ribbon** as it draws (greeting → purpose); around the
  middle of the draw the bubble says **`Hey, ¡espérame!`**.
- **Idle nudge** — if the user stops completely, contextual comments fire.
- Does **not** leave the home (about / work / cv / contacto stay untouched).

Voice: first person, informal, Paula speaking (like the current idle copy and
`Hey, ¡espérame!`).

---

## Two ways Paula "talks" — keep these distinct

| | Fires because | Reverts | Driver |
|---|---|---|---|
| **Beat** | scroll reached a point on the pinned timeline | yes — scroll back past it and it undoes | the scrub (NOT a timer) |
| **Idle** | user stopped + N seconds passed | cancelled the moment they move | one wall-clock timer chain |

Beats already exist in the code (e.g. in `animateGreeting`: "at 6 % of the greeting
slice, box 1 types", positions like `A(0.06)`). Narration beats are added the same
way. The ribbon-follow is a scrubbed `onUpdate` using
`path.getPointAtLength(len * ribbonProgress)` (+ the strip proxy's `y` translate,
since the stage-level cursor is not itself translated).

**Constraint (from the original home-scroll spec): only ONE autonomous timer** —
the idle nudge chain, cleaned up in `dispose()`. Narration rides the scrub.

---

## Content model — `src/components/home-scroll/home-copy.ts`

Serializable, `es` + `en`, tolerant of missing / new scene keys.

```ts
// one phrase per beat FOR NOW; array so it can grow to several later
narration: {
  transition: [{ say: 'Hey, ¡espérame!' }],   // during the ribbon draw
  // premise / board / figma / code / ai / manifesto / identity: added from the
  // storyboard. A scene with no entry = cursor parks there silently.
},

idle: {
  greeting: ['¿Continuamos...?', 'Vamos, haz scroll...', 'Hey, ¿sigues ahí?'],
  // es / en. Covers every non-greeting section until it gets its own line.
  _default: ['Sigo aquí. Cuando quieras, seguimos.'],
  // per-scene keys override _default as the storyboard matures, e.g.
  // board: ['something board-specific'],
}
// en._default: ['Still here. Whenever you're ready.']
```

Scene list (unchanged, in `home-progress.ts`):
`greeting · purpose · premise · board · figma · code · ai · manifesto · identity`.
The storyboard is **not final** — sections may be added to the home; the model
must not break when a new scene has no `narration` / `idle` entry.

Copy-contract test (`tests/home-copy.test.mjs`) checks: both locales have the same
keys, and the full narrative strings are NOT hard-coded in `home-scroll.ts`
source. Extend it for the new keys.

---

## Idle behaviour (decided)

| Zone | Behaviour |
|---|---|
| **greeting** | Unchanged: 3 escalating messages (`¿Continuamos...?` → `Vamos, haz scroll...` → `Hey, ¿sigues ahí?`). Timing 2.8 / 2.4 / 3.4 s. It is the onboarding "did you realise you have to scroll?" moment. |
| **any other section** | **One soft line** (`idle._default` unless the scene overrides). First person, low pressure. Fires later (~4 s of stillness), **once**, no escalation. Hidden on scroll (reuse the existing `data-idle-hidden` mechanism), does not re-fire until the user leaves the section and comes back. |
| **end of journey** (`trigger.progress >= 0.95`, identity) | Nothing. |

Also suppress the idle nudge while a narration beat's line is currently showing,
and during active scene choreography.

### `_default` line — CHOSEN: option A

- ES: **`Sigo aquí. Cuando quieras, seguimos.`**
- EN: **`Still here. Whenever you're ready.`**

(Rejected: B `Tómate tu tiempo… hay más abajo.` / C `¿Te quedaste pensando? Sigue bajando.`)

---

## Current cursor landscape (to be consolidated)

Six cursor elements, two implementations, all using `src/assets/home-scroll/cursor.svg`:

| Where | What | Label |
|---|---|---|
| greeting, purpose | `NarrativeCursor.astro` (pointer + purple "Paula" pill + `[data-cursor-msg]` bubble w/ per-glyph typing + blink) — classes `narrative-cursor--greeting` / `--purpose` | `copy.intro.cursorLabel` = `Paula` |
| board, figma, code, ai | ad-hoc `<div class="{scene}-cursor" data-motion="{scene}-cursor">` (pointer `<img>` + `<span>`) in each scene component | `copy.board.cursor` = `Paula` (both locales) |
| manifesto, identity | none | — |

The bubble typing mechanism (already built for greeting):
per-glyph `.text-mark__char` spans via a `glyphFill()` helper, revealed width 0 →
natural with `steps(1)` stagger. `cursorShort` reveal is fired wall-clock from a
`tl.call` at the settled greeting; idle swaps use standalone `gsap.to`. Bubble is
`width: max-content`, celeste (`--color-brand-cyan-500`), dark ink, top-left
corner square (`border-radius: 0 8px 8px 8px`) — Figma node `16138:105150`.

---

## Rollout — smallest-blast-radius first

- **P1 — unify the component.** Replace the 4 ad-hoc `.{scene}-cursor` divs with
  `<NarrativeCursor label="Paula" class="narrative-cursor--{scene}">`. Pure visual
  consolidation, no behaviour change, `copy.board.cursor` already `Paula`. One CSS
  block instead of four. Commit.
- **P2 — one traveling cursor.** Introduce a single `<NarrativeCursor>` at
  `.home-stage` level (stage-space coords). Retire `--greeting` / `--purpose`
  instances; fold their behaviour into the one element. Wire:
  greeting typing → **follow the ribbon draw** (`getPointAtLength` + strip `y`) →
  `Hey, ¡espérame!` at ~50 % of the draw → purpose. Make the idle controller
  scene-aware; give `purpose` the soft `_default` line. Commits by part.
- **P3 — fold in the scene cursors.** board / figma / code / ai use the shared
  stage-level cursor + their per-section narration + scene-aware idle. Remove the
  per-scene cursor CSS.
- **P4 — post-purpose continuation.** A second line after the purpose screen with
  its own narration — spec comes later from the storyboard.

After P1+P2 the intermediate state is fine: 1 traveling cursor
(greeting → ribbon → purpose) + 4 scene cursors (unified component, still separate
instances) until P3 absorbs them.

---

## Coordinate frames — watch out

- Each scene is `position: absolute; inset: 0` inside `.home-stage`
  (`overflow: clip`), scenes cross-fade (they don't stack vertically).
- Scene `animateX()` functions currently measure geometry relative to their own
  container (`.home-greeting__layout`, `.home-purpose__stage`, inside the tool
  windows…). A stage-level cursor needs every target expressed in stage-space:
  `targetRelToStage = elRect - stageRect`. Add one helper.
- The **strip proxy** (in the `if (cinematic)` caller block) translates
  `.home-greeting__layout` + the ribbon `<svg>` + `.home-purpose__stage` upward
  together during the transition (`gsap.set([...], { y })`). The stage-level
  cursor is NOT translated by it, so following the ribbon (whose path lives in the
  translated SVG's space) means applying the same `y` to the cursor.
- The ribbon `<svg>` uses `preserveAspectRatio="none"`, viewBox `0 0 round(w)
  round(ch)` where `ch = stageHeight * RIBBON_SPAN` (1.9), origin = stage
  top-left, so 1 viewBox unit ≈ 1 CSS px.
- `animateTransition` runs **before** `animateGreeting` in the caller on purpose:
  `animateGreeting` collapses the greeting glyphs to width 0 at build, which
  recentres the flex row and shifts the hero logo (the ribbon start is anchored
  to the logo — `[data-motion="hero-logo"]` centre, X centred, Y = logo bottom +
  16 + half stroke).
- Build-time race seen occasionally: `.home-stage` rect can be `0×0` on the very
  first `initialize`, giving `viewBox="0 0 0 0"` and a degenerate ribbon path
  until a resize/rebuild. Pre-existing, not caused by cursor work — but if you
  touch `animateTransition`, consider hardening (bail if `s.width < 1` only if you
  guarantee a later rebuild re-runs it).

---

## Key files

- `src/components/home-scroll/NarrativeCursor.astro` — the component.
- `src/components/home-scroll/home-scroll.ts` — the timeline + `initialize` +
  `animateGreeting` / `animateTransition` / `animatePurpose` / `animateBoard` /
  `animateFigma` / `animateCode` / `animateAI` / `animateManifesto` /
  `animateIdentity`, and the idle controller (near the scroll-hint controller:
  `armIdle` / `clearIdle` / `typeBubble` / `glyphFill`, timers `idleA/idleB/idleC`
  cleared in `dispose()`).
- `src/components/home-scroll/home-scroll.css` — `.narrative-cursor*`,
  `.text-mark__*`, `.home-ribbon`, `.{scene}-cursor`.
- `src/components/home-scroll/home-copy.ts` — the content contract.
- `src/components/home-scroll/{Board,Figma,Code,AI}Scene.astro` — the ad-hoc
  cursors to remove in P1/P3.
- `src/components/home-scroll/home-progress.ts` — scene list + `snapshotAt` /
  `progressFor` (do not change the scene names).

## Verification

- Preview daemon (memory `pr-portfolio-preview-daemon`): from repo root —
  `npx astro preview stop ; lsof -ti tcp:4322 | xargs kill -9 ; npx astro build ;
  nohup npx astro preview --host 127.0.0.1 --port 4322 &` — served at
  `http://127.0.0.1:4322/portfolio/`.
- `node --test tests/home-copy.test.mjs tests/home-progress.test.mjs tests/split-flap.test.mjs`
  (currently 22/22).
- `npm run check` — 1 pre-existing error only (`src/pages/about.astro` missing
  `type` prop). `npm run build` must stay clean.
- Browser e2e (`tests/browser/home.spec.ts`) is pre-broken by `base: '/portfolio'`
  — kept structurally correct; real verification is unit + check + build + a
  visual pass on mobile 390 / 320 via the preview daemon.
- The in-app Browser pane often renders desktop widths black and freezes the
  scrub between screenshots (each screenshot pumps one scrub frame); mobile
  390/320 composites; standalone `gsap.to` (wall-clock) can stall when the pane is
  hidden. Verify with programmatic `getBoundingClientRect` reads + measured
  deltas, not only screenshots.

## Where to start

- P1 first (safe: unify the component), then P2 (traveling cursor +
  ribbon-follow + `Hey, ¡espérame!` + soft idle in purpose).
- P3 / P4 wait on the storyboard.
- No open decisions — `idle._default` is settled (option A above).
