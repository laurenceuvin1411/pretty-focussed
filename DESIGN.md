---
name: Pretty Focussed
description: The weekly operating system for women who run their own business. A soft field, one sharp thing.
colors:
  bone: "#F4F2EE"
  paper: "#EAE7E1"
  white: "#FFFFFF"
  stone: "#D6D1C7"
  ash: "#9A968E"
  muted: "#6B675F"
  slate: "#55534E"
  ink: "#14150F"
  ink-hover: "#1E1F17"
  ink-surface: "#1D1F18"
  ink-elevated: "#282B22"
  ink-border: "#2F332A"
  veil: "#E2E7DA"
  haze: "#C6D0B8"
  sage: "#98A886"
  focus: "#6E7F5E"
  depth: "#3E4936"
  shell: "#EFE3D8"
  flush: "#E0B8A4"
  travertine: "#F0E7DB"
  travertine-surface: "#E7DFD2"
  field: "#E9EFE2"
  field-surface: "#E0E7D8"
  air: "#E4EDF5"
  air-surface: "#DBE4EC"
typography:
  numeral:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(3rem, 2rem + 4vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  numeral-md:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 1.4rem + 1.5vw, 2.5rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  numeral-sm:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  display:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.125rem, 1.3rem + 3.2vw, 4rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.6875rem, 1.2rem + 2vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.1rem + 1vw, 1.875rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  subtitle:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "26px"
    letterSpacing: "0"
  small:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "0"
  button:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.005em"
  label:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.06em"
  overline:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "14px"
    letterSpacing: "0.14em"
  unit:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "max(0.35em, 11px)"
    fontWeight: 400
    letterSpacing: "0.02em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.02em"
    fontFeature: "tnum"
  wordmark:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.01em"
rounded:
  pill: "999px"
  input: "14px"
  card: "20px"
  panel: "24px"
  sheet: "32px"
  full: "50%"
spacing:
  "4": "4px"
  "6": "6px"
  "8": "8px"
  "10": "10px"
  "12": "12px"
  "14": "14px"
  "18": "18px"
  "20": "20px"
  "22": "22px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "36": "36px"
  "40": "40px"
  "44": "44px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.bone}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    height: "44px"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.slate}"
    typography: "{typography.button}"
    padding: "10px 6px"
    height: "44px"
  nav-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    rounded: "{rounded.pill}"
    padding: "6px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.full}"
    size: "36px"
  nav-item-active:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "36px"
  segments:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "4px"
  segment:
    backgroundColor: "transparent"
    textColor: "{colors.slate}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "40px"
  segment-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
  glass-pill:
    textColor: "{colors.slate}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "40px"
  chip-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
  chevron:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    size: "44px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "14px 16px"
  toggle:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.pill}"
    padding: "8px 8px 8px 16px"
    height: "44px"
  toggle-track:
    backgroundColor: "{colors.stone}"
    rounded: "{rounded.pill}"
    width: "40px"
    height: "24px"
  toggle-track-on:
    backgroundColor: "{colors.ink}"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px 22px"
  sheet:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "28px 30px 30px"
    width: "560px"
  content-post:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "10px 12px"
  skeleton:
    backgroundColor: "rgb(214 209 199 / .40)"
    rounded: "{rounded.card}"
    height: "48px"
  error:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.input}"
    padding: "12px 16px"
  circle-check:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.full}"
    size: "24px"
  circle-check-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
  day-dot:
    backgroundColor: "transparent"
    textColor: "{colors.slate}"
    typography: "{typography.mono}"
    rounded: "{rounded.full}"
    size: "32px"
  day-dot-pressed:
    backgroundColor: "{colors.haze}"
    textColor: "{colors.ink}"
  step-dot:
    backgroundColor: "transparent"
    rounded: "{rounded.full}"
    size: "8px"
  step-dot-done:
    backgroundColor: "{colors.ink}"
  ground-swatch:
    backgroundColor: "{colors.bone}"
    rounded: "{rounded.full}"
    size: "44px"
---

# Design System: Pretty Focussed

<!-- Recorded from the built code on 3 September 2026 after the Weekly Session finish review, updated on
     4 September 2026 after the app round (disposition: ship after one fix batch; three craft nits fixed after), and
     again on 4 September 2026 after the Money round (Sales and Finance under one segmented control, the Content page,
     Success habits as the product word; fix rounds closed).
     Ground truth: src/pf/pf.css, src/pf/PfShell.tsx, PfNav.tsx, Sheet.tsx, settingsStore.ts, Settings.tsx, Login.tsx,
     Aperture.tsx, SessionSteps.tsx, WeeklySession.tsx, Field.tsx, Today.tsx, Goals.tsx, Rituals.tsx, Money.tsx,
     Revenue.tsx, Sales.tsx, Finance.tsx, Content.tsx, Recap.tsx, recapCard.ts, src/store/pf/salesStore.ts,
     financeStore.ts, contentStore.ts, src/index.css (@theme and [data-theme="light"]), index.html, and the
     screenshots in .impeccable/review/app/ (sales-*, finance-*, content-* among them). The pinned brand kit v1.0 is the source the code implements; where the kit
     goes further than the code, this file says so under "Open items" rather than documenting it as built. -->

## Overview

**Creative North Star: "A Soft Field, One Sharp Thing"**

Pretty Focussed is built on depth of field. Nothing on a screen is removed, greyed or struck out; one plane is brought forward and everything else is held soft, warm and present. The whole app now lives in that world: the Field (home), Today, Goals, Money (Revenue, Sales and Finance as three readings of one page), Success habits, Content, Recap and Settings under one shell, the Login room in front of it, and the Weekly Session in its own fixed room at `/session`. Every page shows the idea the same way: a warm ground with a blurred sage-and-shell field under it, one overline and one declarative headline that ends in a full stop, three numerals with tiny mono units, hairline rows, an aperture for anything that is progress, one Ink line where a number has a history, and one small dense Ink object. The mood is relief, then competence. It never asks for urgency and never rewards with noise.

Density is low and deliberate. Every screen is one reading with one next step, phone first, a 560px reading column for most pages and a 1120px canvas only where the Field, Goals and Content need room to sit asymmetrically. The largest empty space sits above or beside the primary statement. Hierarchy comes from density and scale, not from colour: the whole system passes a greyscale test because green is a state marker and Ink is the only accent object. The floating Ink nav pill is the app's standing Full Stop; a page adds one Ink pill of its own only when it has a single obvious next step. She may change the room (four grounds: Plaster, Travertine, Field, Air); the instrument, the sage scale, Ink and the nav pill never change. The pre-existing Laurence OS pages remain reachable from Settings under "More", re-themed through `src/index.css` but not rebuilt to this component set.

Confirmed visual rejections, taken from the pinned kit and honoured by the build: no white ground, no pure black, no cool grey, no red or amber, no borders on cards, no radius under 14px, no horizontal progress bars, no spinners, no shimmer, no strikethrough, no confetti, no streaks, no illustration in empty states, no serif, no italics, no bold.

**Key Characteristics:**
- Warm ground (Bone by default, or Travertine, Field or Air) with an occupied atmosphere: a blurred radial field and 3.5 percent grain, never a flat void.
- One floating Ink nav pill, bottom-centre on phones and top-centre from 768px, that never animates on change; at most one further Ink pill per page, and exactly one inside any sheet.
- One nav item may hold several readings: Money switches Revenue, Sales and Finance with a Paper segmented pill whose chosen segment is Ink. That segment counts as the page's Ink object, so all three readings keep their primaries inside sheets.
- One grotesque, two weights (Instrument Sans 400 and 500) with a 6:1 scale jump from numeral to label; JetBrains Mono for units, times and counts only.
- Every screen opens the same way: one overline ("Section · qualifier"), one declarative headline ending in a full stop, then a stats row of three numerals with mono units.
- Green is the sage depth scale (Veil to Depth) and encodes state; Depth is the only green that carries type, and only for Held, Met, Complete, Posted and Paid.
- Progress is an arc from twelve o'clock; steps are a row of dots; loading is a single orbiting arc segment; history is a bubble field where blur and opacity are recency, or, over months, one 2px Ink curve on dotted scaffold.
- The periphery goes soft (opacity .55, blur 2px) or dim (opacity .55, no blur), the completed goes faded (opacity .4); nothing is hidden or crossed out, and hover or focus lifts anything soft back to sharp.
- Circles, pills and superellipses only; surfaces by tone and a warm-tinted shadow, never a border; kind is carried by hairline grammar, never by shade.
- Product motion under 300ms on one ease-out curve (sheets 260ms on the sheet curve); the brand mark alone runs on the 600 to 900ms brand clock; destructive actions hold to confirm for 1.6s.

## Colors

A warm, near-monochrome palette at hue 39 to 43 degrees: a bone ground she can retint, three warm neutrals for text, one green-black for the accent object, and a five-step sage scale that only ever means state.

### Primary
- **Ink** (`{colors.ink}`): the Full Stop. A green-black, never #000. Primary text, the nav pill, the single filled pill per page or sheet, the checked circle, done step dots, the priority dot, a toggle's on track, the hold-to-remove sweep, the focused input border, the tick of the aperture ring, the chosen segment of a segmented control, the 2px kept line with its 6px month dot, and the one-word "Due" caption on a conversation whose date has arrived. Hover darkens fractionally to `{colors.ink-hover}`.

### Secondary
- **Sage depth scale** (`{colors.veil}` Veil, `{colors.haze}` Haze, `{colors.sage}` Sage, `{colors.focus}` Focus, `{colors.depth}` Depth): green is a state, not a colour. Haze fills a chosen day dot in light mode and Focus fills it in dark. Sage (depth 2) is the fill of every bubble in the session and content bubble fields, and the Haze-to-Focus gradient is the value stroke of the aperture ring and the mark. Focus colours the large loading arcs (rebuild, recap, week draft). The four steps Haze to Depth mark the four cycle phases in the Rituals panel, each paired with a day label. Veil sits at 90 percent in the atmosphere field and at 60 percent on the recap card. Depth is the only green that carries text (`--text-brand`): "Held." beside a kept habit, "Met" inside the revenue ring, "Complete." inside a finished goal's ring, "Posted" on a content card, "Paid" inside the finance ring once what she kept reaches the pay target, and a held count on the recap. Focus at 12 percent fading to Veil at nothing is the fill under the kept line: the one place a sage tint sits under a value rather than in it. Sage on Bone is 2.27:1 and must never be text.

### Tertiary
- **Shell** (`{colors.shell}`): the warm error ground and the second radial of the atmosphere field. Errors are Ink type on Shell with a 1px Ink left rule. Never red.
- **Flush** (`{colors.flush}`): the single human accent, declared as a primitive and still unused anywhere in the app. When it is used: at most 3 percent of a frame, once per session.

### Neutral
- **Bone** (`{colors.bone}`): the Plaster ground (default) in light mode and the text, nav-item and pill colour in dark mode. Never white.
- **Paper** (`{colors.paper}`): panels, the toggle pill, content post cards and the light-mode surface under Plaster.
- **Grounds** (`{colors.travertine}` Travertine with `{colors.travertine-surface}`, `{colors.field}` Field with `{colors.field-surface}`, `{colors.air}` Air with `{colors.air-surface}`): the three other rooms, chosen in Settings as 44px discs and applied on `.pf-app[data-ground]` by re-valuing `--ground` and `--surface` only. Every other token, including the sage scale and Ink, is identical in all four rooms. In dark mode every ground collapses to the Ink room.
- **White** (`{colors.white}`): the elevated surface only: inputs, textareas, selects, the toggle knob and the sheet. It is never a page ground.
- **Stone** (`{colors.stone}`): hairlines, row dividers, the secondary button's inset ring, the dotted track of the aperture ring (as 16 percent Ink in the track token), the toggle's off track, the sheet's grab handle, the empty aperture outline and disabled fills. At 40 percent alpha it is the sunken well (`--sunken`) behind skeletons, hovered secondary buttons and hovered link rows; at 55 percent it is the soft rule.
- **Slate** (`{colors.slate}`): secondary text (body copy, leads, the tertiary button, day-dot labels, the recap card's hint). 6.87:1 on Bone.
- **Muted** (`{colors.muted}`): captions, overlines, units, placeholders, chevrons and the mark-less nav items' resting tone by opacity. 5.03:1 on Bone.
- **Ash** (`{colors.ash}`): dark-mode muted text only; 2.64:1 on Bone so never text in light mode.
- **Dark grounds** (`{colors.ink-surface}` surface, `{colors.ink-elevated}` elevated, `{colors.ink-border}` hairline): the dark theme keeps Ink as ground, steps surfaces up two tones, and inverts the Full Stop (nav pill and primary) to Bone. The sage scale does not change between themes.

### Named Rules
**The Full Stop Rule.** The nav pill is the app's standing Full Stop. A page may carry one more filled Ink pill, and only when it has a single next step ("Walk in", "Open today", "Plan a post", "Write the recap"); Today, Goals, Money (Revenue, Sales and Finance), Success habits and Settings carry none and put their primary inside a sheet, where the scrim has blurred the nav. A segmented control's chosen segment is an Ink fill and counts as the page's one, which is why Money never carries an Ink pill of its own. Never two filled buttons on one page or in one sheet. Ink may otherwise appear only as text or as a state mark under 24px. A chosen day dot fills with Haze, never Ink, so it cannot become a second full stop.

**The Instrument Never Changes Rule.** She picks the room, not the instrument. A ground re-values `--ground` and `--surface` and nothing else; the sage scale, Ink, Stone, the nav pill and the recap card are the same in every room and both themes.

**The Green Is a State Rule.** Sage tones appear only where a value is being encoded: the ring's arc, a chosen day, a bubble in a field, a cycle phase beside its day label, the fill under the kept line, the loading arc, the mark. Never as a surface tint for its own sake, never as text below Depth, and Depth text only for Held, Met, Complete, Posted and Paid.

**The No Red Rule.** There is no warning colour. Errors sit as Ink type on Shell; destructive actions are a two-step tertiary Remove or a hold-to-confirm sweep in Ink; attention is drawn by sharpness, not hue.

**The Warm Neutral Rule.** Every neutral is warm (hue 39 to 43). No Tailwind gray, slate or zinc; no pure black on pure white.

## Typography

**Display Font:** Instrument Sans (with Inter, system-ui, sans-serif)
**Body Font:** Instrument Sans (with Inter, system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace)

**Character:** One grotesque at two weights, 400 and 500, and nothing else: no bold, no italic, no serif. The drama comes entirely from ratio. A 72px tabular numeral sits beside an 11px mono unit and a 10px letterspaced overline; there are no bridging sizes between them. Tracking tightens as size grows (-0.04em at the numeral, +0.14em at the overline). Sentence case everywhere; uppercase only for the overline and the one bold word inside a glass pill. Loaded weights are exactly Instrument Sans 400 and 500 and JetBrains Mono 400.

### Hierarchy
- **Numeral** (500, clamp(3rem, 2rem + 4vw, 4.5rem), 0.92, -0.04em, tabular): the one typographic event on the session's slot screen ("20 min"). Always followed by its unit. `numeral-md` (clamp 1.875 to 2.5rem) is the stats row on the Field, Sales, Content and Recap and the value inside every aperture ring; `numeral-sm` (1.375rem) is a stat beside a ring (Target and Logged on Revenue; In, Out and Pay target on Finance), the fixed-costs total, the value of a sale just logged from a conversation, a goal ring's value, a habit's weekly count and a lane's count.
- **Display** (500, clamp(2.125rem, 1.3rem + 3.2vw, 4rem), 1.02, -0.03em, balanced): the session's closing line only ("Your week is set.").
- **Headline** (500, clamp(1.6875rem, 1.2rem + 2vw, 2.75rem), 1.12, -0.025em, max 18ch, balanced): the one headline per screen, declarative, ending in a full stop ("Close lightly, then off." "Your room." "What you protect." "Two lanes. Six goals at most." "3 conversations open. 4,200 eur in play." "You keep 2,400 eur this month."). Today appends the full stop to the current block's title if it lacks one.
- **Title** (500, clamp(1.375rem, 1.1rem + 1vw, 1.875rem), 1.2, -0.02em): sheet titles ("A conversation", "The cost", "The numbers") and the slot name on the schedule screen.
- **Subtitle** (500, 1.125rem, 1.3, -0.01em): goal titles, the week line in Content ("31 Aug to 6 Sep." with "week 36" as a mono caption on the same baseline), a cycle phase name, the assistant's proposed intention, day names in the week grid.
- **Body** (400, 16px/26px, Slate, max 56ch): leads under the headline and panel copy. Row labels use 15 to 16px Ink at 400, 500 when current or named; a conversation's name is 16px at 500.
- **Small** (400, 14px/22px, Slate): supporting lines, ground notes, limits ("Five is the limit. Fewer is more here."), a conversation's next step with its mono date, status lines after a logged sale ("Logged as revenue."), the line that holds a chart's place ("Two months of numbers and the line appears.").
- **Button** (500, 15px/1, +0.005em): all three button ranks and the segments of a segmented control.
- **Label** (500, 11px/16px, +0.06em, Muted, sentence case): field labels above inputs, section captions ("Your three", "Log a sale", "Kept, six months", "Fixed every month", "What worked"), stage captions with a mono count beside them ("In conversation 3", "Won 2"), lane labels, the count in a glass pill, a cost's kind beside its row, and the empty-state line "Nothing yet." Set in Ink it is the one-word "Due" at the right of a conversation whose date has arrived; set in Depth it is "Posted" and "Paid".
- **Overline** (500, 10px/14px, +0.14em, uppercase, Muted): one per screen, above the headline, in the form "Section · qualifier" ("Today · week 36", "Revenue · September", "Sales · September", "Finance · September", "Recap · week 36"); the Field uses the date and Success habits stands alone.
- **Unit** (JetBrains Mono 400, max(0.35em, 11px) of its numeral, +0.02em, Muted, 0.3em gap): "min", "eur", "/5", "blocks", "saves". A numeral never appears without one; the 11px floor keeps a unit legible beside a caption-sized numeral.
- **Mono** (JetBrains Mono 400, 11px, +0.02em, tabular): day-dot labels, block times, week numbers, day-of-week rows, sale dates, a conversation's value and next date, a cost's date and amount, the kept line's value captions ("4,200 eur" top-right, "0 eur" bottom-left), and inline counts in body copy ("20 minutes"). At 10px it is the kept line's month axis, the one place mono drops below 11px.
- **Wordmark** (500, 14px, -0.01em, -0.06em word spacing): "Pretty Focussed" beside the 22px mark in the shell header. The only place the name is set.

### Named Rules
**The Unit Rule.** Every numeral carries its unit in mono at 35 percent of its size with an 11px floor, set in Muted. "20" is never on screen; "20 min" is.

**The One Overline, One Headline Rule.** Each screen opens with exactly one overline and one headline. The overline names the section and its qualifier with a middle dot; the headline states a fact and ends in a full stop. Nothing else on the page uses either style.

**The Skip-a-Step Rule.** Adjacent sizes never sit together. A screen pairs numeral with label, headline with overline, never headline with title. One typographic event per screen.

**The Two Weights Rule.** 400 for reading, 500 for what is current, named or pressed. There is no third weight, no italic and no serif anywhere in the product.

## Layout

Phone first, single column, two rooms. The app room (`.pf-app`) is a normal-flow page at least the viewport tall with the atmosphere field and grain fixed behind it, a header (44px tall, 52px from 768px; 20px 20px 0 padding, 32px 40px 0 from 768px) holding the mark and wordmark top-left, a page column, and the fixed nav pill. The session and login rooms (`.pf-room`) are fixed full-viewport surfaces at z-index 400 that scroll inside themselves and sit over the app.

The page column is 1120px wide at most, centred, with 24px 20px padding and 120px plus the safe-area inset at the bottom on phones (32px 40px 140px from 768px) so content clears the nav pill. Reading pages (Today, Success habits, Revenue, Sales, Finance, Recap, Settings) and the sheet body narrow to 560px (`.pf-narrow`); the Field, Goals (all four horizons) and Content use the full 1120px so the aperture can sit left of centre with the rows beside it, the two lanes can sit side by side and the content week can run seven columns. Money stacks its segmented control 28px above whichever reading is chosen; the control is content-sized and left-aligned, never full width, and the reading beneath it opens with its own overline. The session column is 560px (1120px for the week grid) with 132px bottom padding for the dock.

Vertical rhythm: sections stack at clamp(40px, 6vw, 64px) (`.pf-stack-lg`; the Field tightens this to clamp(24px, 4vw, 56px)); inside a section, items stack at 12px (`.pf-stack`), and the overline, headline and lead sit 12 to 14px apart. Stats rows are wrapped flex rows with 20px 44px gaps (Field), 36px (Recap) or clamp(24px, 6vw, 48px) (Sales, Content). On Revenue and Finance the ring sits 28px from a 160px-minimum column of numeral-sm stats at 18px gaps, wrapping under it on phones. Field groups stack at 18 to 22px, row lists at 13px vertical padding per row (16 to 22px for rows that carry a ring or a day strip) with a 14px column gap, day grids at `repeat(7, 32px)` with 6px gaps, chips and inline grids at 10px, step dots and nav items at 10px and 4px, sheet actions at 18px. Values reused across the build: 4, 6, 8, 10, 12, 14, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48 and 64px; there is no strict 4px grid enforced in code.

Grids: the two-lane goal list (`repeat(auto-fit, minmax(300px, 1fr))`, 40px 48px gap), the working-day and days-off pair (`minmax(220px, 1fr)`, 22px), the sheet's start-and-end pair (`minmax(140px, 1fr)`), the target-now-unit triple, the offer-and-value pair (`minmax(0, 1fr) 120px`, 10px), the amount-and-kind pair (`120px minmax(0, 1fr)`, 10px), the five metric fields (`repeat(auto-fit, minmax(96px, 1fr))`, 10px), the week grid and the content week (single column on phones, seven equal columns from 900px, 14px gap). The kept line is a 320 by 96 viewbox drawn at the full column width with its six month labels in `repeat(6, 1fr)` beneath it. Hairline rows use a three-column `auto minmax(0,1fr) auto` grid by default and override the template where a row is a link, a ring row or a two-column strip.

The aperture ring is sized to the page: 62 percent of the viewport width capped at 300px on the Field, 200px (240px from 768px) on Revenue and Finance, 120px (140px from 768px) per goal. The empty aperture outline is 56 to 72px.

Breakpoints observed: 768px (nav position, sheet becomes a modal, page padding, ring sizes), 900px (seven-column weeks), and the `(hover: hover) and (pointer: fine)` gate for every hover state. Stacking: app content 1, session and login room 400, session dock 401, nav pill 402, scrim and sheet 500.

Ratios that hold on the built screens: the ground is roughly two thirds of the frame, the Ink objects 2 to 4 percent, the largest space above or beside the primary statement, and the aperture left of centre with the list hanging beside it on a desk and under it on a phone.

## Elevation & Depth

Depth is optical, not stacked. There are no borders on surfaces; a panel is Paper on the ground with a warm shadow, an input is White with a Stone hairline, a sheet is White with the largest warm shadow, and everything else is tone. The real depth cue is focus. The current block on Today is sharp while past blocks sit soft (opacity .55, blur 2px) and future ones dim (opacity .55, no blur); done rows, closed conversations (Won, Not now) and posted cards fade to 40 percent; a focused field pulls its sibling fields soft; hovering or focusing anything soft or dim lifts it back to sharp. The kept line's fill (Focus at 12 percent fading to nothing) is a tint under a value, not a surface. A sheet does not darken the page so much as put it out of focus: the scrim is Ink at 40 percent with an 8px backdrop blur. History is a bubble field where each circle's blur (up to 3px) and opacity (down to 35 percent) encode how long ago it happened, so the past is literally out of focus. Under everything a blurred radial field of Veil and Shell (10px blur, 90 percent) and a 3.5 percent overlay grain make the empty space read as atmosphere rather than a void.

### Shadow Vocabulary
- **Small** (`box-shadow: 0 1px 2px rgb(62 73 54 / .04)`): the toggle pill, its knob, content post cards and the segmented control's pill.
- **Medium** (`box-shadow: 0 4px 16px rgb(62 73 54 / .06)`): the primary pill, the panel and the recap card preview. Warm-tinted with Depth green, never grey.
- **Large** (`box-shadow: 0 8px 32px rgb(62 73 54 / .08)`): the nav pill.
- **Extra large** (`box-shadow: 0 16px 56px rgb(62 73 54 / .10)`): the sheet.
- **Glass** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / .45), 0 8px 32px rgb(62 73 54 / .08)`): the glass pill's single inner top highlight plus its lift.
- **Focus** (`box-shadow: 0 0 0 3px var(--ground), 0 0 0 5px rgb(20 21 15 / .4)`): a 3px ground gap and a 2px Ink ring at 40 percent on any focused field. Dark mode uses Bone at 40 percent.
- **Current step dot** (`box-shadow: 0 0 0 3px var(--ground), 0 0 0 4px rgb(20 21 15 / .25)`): the same construction at 1px for the 8px dot.
- **Chosen ground** (`box-shadow: 0 0 0 2px var(--ground), 0 0 0 3.5px var(--text)`): the ring around the chosen 44px ground disc; unchosen discs carry a 1px inset ring of Ink at 12 percent.
- Dark mode swaps every shadow to black at 30 to 42 percent.

### Named Rules
**The Tone-Not-Border Rule.** Surfaces are defined by tone and a warm shadow. The only 1px strokes are hairlines that mean something: a row divider, an input edge, a secondary button's ring, a dot's track, a toggle's off track.

**The Focal Plane Rule.** The periphery goes soft, never grey and never hidden: `opacity: .55; filter: blur(2px)` for what has passed, `opacity: .55` alone for what is still to come, `opacity: .4` for what is done. Blur never touches text being read or a control being operated, it is capped at 4px on product UI (3px in bubble fields), and hover or focus-within lifts a soft element to sharp. Under reduced motion the blur drops to none and opacity alone carries the hierarchy.

**The Out-of-Focus Scrim Rule.** A sheet or modal blurs the page behind it (8px) under Ink at 40 percent. The page is not dimmed to black; it goes soft, and the sheet is the one sharp plane.

**The Warm Shadow Rule.** Every shadow is `rgb(62 73 54 / a)` with a at 10 percent or below. Grey and black shadows exist only in the dark theme, where they are the ground's own colour.

## Shapes

Circles, pills and superellipses only. There is no radius below 14px: pills 999px (buttons, chips, the glass pill, the nav pill, the toggle, the segmented control and its segments, the dock's actions), inputs 14px (fields, selects, the error block, content post cards), cards 20px (skeletons, the recap card preview), panels 24px, sheets 32px (top corners only on phones, all four from 768px). Everything that marks state is a circle: the 24px check, the 32px day dot, the 8px step dot, the 8px cycle-phase dot, the 10px kind dot, the 36px nav item, the 44px ground disc, the 18px toggle knob, the aperture ring and the mark. The sheet's grab handle is a 36 by 4px Stone pill.

Hairlines are 1px and carry a grammar. Dotted is scaffold (row dividers, the ring's track at 1.5 on 5 off, the empty aperture outline, admin, rest and other blocks, content-day dividers, the three scaffold lines under the kept line). Dashed is a target (a habit's planned-but-not-yet-logged day, drawn as a dashed Muted ring). Solid is a value (a priority's filled Ink dot, an event's Slate ring, a habit's Muted ring, the inline input's baseline, the soft rule over the fixed-costs total, and the kept line itself). The kept line is the one stroke thicker than 1px (2px Ink, round caps) and the one that is not straight: a Catmull-Rom curve through six monthly values with a 6px Ink dot on the month being read, never a polyline, never bars. Lines are horizontal, radial or that one curve; there are no diagonals, triangles or sharp corners. Chevrons exist only as controls, never as decoration: the native select's 16px 1.5px Muted arrow, and the bare 44px month and week chevrons on Finance and Content (Lucide, 14 to 16px, 1.5px stroke, Muted, no border, Ink on hover, 35 percent when disabled). Icons are 1.5px outline strokes inside circles: the 18px nav icons in 36px items, the 15px pencil in a 32px day-dot circle.

The mark itself is a ring, r=42 on a 100 viewbox, sweeping 300 degrees from twelve with a Sage-to-Focus gradient stroke and a round cap, with a solid Ink dot (currentColor, r=10) at the centre. Below 24px it is the simplified cut: a uniform 9-unit Focus stroke, no taper. The progress ring's viewbox is `8 8 184 184` so the r=78 track fills its box edge to edge, and its needle is a 1px rim tick from y 34 to y 10 (r 66 to 90) that crosses the track at the current value.

## Components

The component set is small on purpose; every piece is either a control, a hairline row, a circle that means state, a sheet, or the aperture in one of its forms.

### Buttons
Quiet, tactile, one rank filled. Every pressable scales to 0.97 on press over 120ms.
- **Shape:** full pill (999px), 44px minimum height, 15px/1 at 500, +0.005em, 10px icon gap.
- **Primary:** Ink fill, Bone text, medium warm shadow, 14px 28px padding. One per page at most ("Walk in", "Open today", "Plan a post", "Write the recap", "Come in") and exactly one per sheet ("Save", "Take it", "Save the numbers", "Done"). Busy state swaps the label for a 20px loader arc and disables the button; disabled sits at 40 percent opacity.
- **Hover / Focus:** hover (pointer devices only) darkens to `{colors.ink-hover}` over 160ms; transitions are transform, background-color and opacity only.
- **Secondary:** transparent with a 1px Stone inset ring, Ink text; hover fills with the sunken well (Stone at 40 percent). In-flow and page actions: "Log", "Add an offer", "Add a habit", "New conversation", "Add a cost", "Rebuild the rest of today", "Sign out", "Share", "Keep", and the sheet's "Save" or "Add" on Today where the page's dense object is the nav pill.
- **Tertiary:** text only in Slate, underlined with a 4px offset in Ink at 30 percent, 10px 6px padding, hover to Ink. The second action everywhere: "Back", "Leave it", "+ block", "Download PNG", "Write it again", "Connect Google Calendar", "Let go", "Show 3 not now". Plain text buttons that are not pills get a 44px hit area via `.pf-hit` (12px above and below).
- **Remove, two-step:** a tertiary "Remove" that becomes "Remove for good" or "Yes, remove it" on the first press and acts on the second. Used in the offer, sale, conversation, cost and post sheets.
- **Hold to remove:** a secondary pill whose Ink fill sweeps across it by clip-path over 1600ms linear while pressed (pointer or Space/Enter), and snaps back over 200ms ease-out on release; releasing after the sweep completes removes the item. Used in the goal and habit sheets. Never a red button, never a confirm dialog.

### The Nav Pill (signature)
The app's standing Full Stop and the brand's most repeated device. A fixed Ink pill (6px padding, 4px gap, large warm shadow, z-index 402) centred 24px above the bottom edge plus the safe-area inset on phones, and at the top (26px down) from 768px with the wordmark split to the top-left. Eight 36px circular items (Field, Today, Goals, Money, Success habits, Content, Recap, Settings) each holding an 18px 1.5px Lucide outline icon in Bone at 55 percent opacity; the active item is a Bone circle with the icon inverted to Ink at full opacity; hover lifts an item to full opacity; press scales to 0.97. Width is content-sized, never full-bleed. It does not animate on change: no slide, no crossfade, no dot indicator, no colour. In dark mode it inverts to Bone with Ink items. Each item has a 44px hit area (`::after` inset -4px) and an `aria-label`.

### Segmented Control
One nav item, several readings. A Paper pill (4px padding, 2px gap, small warm shadow, `role="tablist"`) that sizes to its content and sits at the left of the column, 28px above the reading it chooses. Each segment is a pill button in the button style (15px/1 at 500, 10px 16px padding, 40px minimum height, Slate text); the chosen one (`aria-selected`) fills Ink with Bone text and is the page's Ink object. Press scales to 0.97; fill and colour change over 160ms; the reading beneath swaps without animation and each reading keeps its own overline ("Revenue · September", "Sales · September", "Finance · September"). No underline, no colour, no sliding indicator, never full width. Built once, for Money (`/money`, `/money/sales`, `/money/finance`; `/revenue` still resolves to the first).

### The Dock (session only)
A fixed bottom bar, z-index 401, portalled to a body-level host so viewport fixing survives the room's filters. Centred flex, 18px gap, 16px 20px padding plus the safe-area inset (32px bottom from 768px), with a gradient from the ground at 55 percent to transparent so content scrolls under it. Holds one primary pill and, optionally, one tertiary to its left. Never two filled buttons. The app pages do not use a dock; their actions sit in flow and the nav pill holds the fixed position.

### Sheets and Modals
- **Scrim:** fixed, z-index 500, Ink at 40 percent with `backdrop-filter: blur(8px)`; click or Escape closes.
- **Phone:** a bottom sheet, full width to 560px (760px wide variant), 88vh maximum with inner scroll, White elevated surface, 32px top corners, 14px 22px padding plus 28px and the safe-area inset at the bottom, extra-large warm shadow, a 36 by 4px Stone grab handle centred with 18px below it. Enters by `translateY(100%)` to 0 over 260ms on the sheet curve.
- **Desktop (from 768px):** the same surface centred as a modal with 24px scrim padding, 32px on all corners, 28px 30px 30px padding, no grab handle; enters from opacity 0 and `scale(.96)` over 260ms ease-out.
- **Inside:** an optional title in the title style with 18px below, then fields in a `.pf-fields` group at 16 to 22px gaps, then a row of actions 18px apart: one primary (or a secondary on Today) and one tertiary, or a primary and a hold-to-remove. When saving has a consequence the page should know about, the form gives way to a confirmation in the same sheet: the value in `numeral-sm` with its unit, one small status line entering with the resolve ("Logged as revenue."), and one primary "Done". The sheet is `role="dialog"` with `aria-modal`. There is no exit animation; the sheet unmounts.

### Glass Pill
- **Style:** pill, 8px 14px padding, `rgb(255 255 255 / .72)` fill with `backdrop-filter: blur(32px) saturate(1.2)`, the glass shadow with its 1px inner top highlight, 11px +0.06em Slate text at 500. The one uppercase word inside it is Ink at +0.14em ("WEEK" with a mono number in the session header; "NOW" beside the current block on Today).
- **State:** static; one per view, the kit's ceiling is two. Dark mode fills `rgb(40 43 34 / .68)` with a 12 percent white edge.

### Chips
- **Style:** pill, 40px minimum height, 10px 16px padding, 1px Stone inset ring, Ink 14px/1 at 500, an 11px mono unit inside for a price or unit ("+1 hours", "Strategy session 600 eur"). Press scales to 0.97; a 2px `::after` widens the hit area.
- **State:** `aria-pressed="true"` fills Ink with Bone text and drops the ring. On a page chips are one-tap actions (log a sale, add one to a goal, place an idea) and are never left pressed. Inside a sheet a chip row is a chooser (a conversation's stage, a post's status) and the chosen chip stays pressed; it is the sheet's only filled object besides its primary, and the scrim has already blurred the nav.

### Cards / Containers
- **Corner Style:** panel 24px; the error block and content post cards 14px; skeletons and the recap card preview 20px.
- **Background:** Paper for the panel (the cycle-aware planning panel, the Studio's "what you can leave" note) and for content post cards; Shell for the error; the sunken well for skeletons.
- **Shadow Strategy:** the panel and recap preview carry the medium warm shadow, content post cards the small one; the error and skeleton carry none.
- **Border:** none on any surface. The error has a 1px Ink left rule, the only border on any surface.
- **Internal Padding:** panel 20px 22px; error 12px 16px; content post 10px 12px.
- **Skeleton:** Stone at 40 percent, 20px radius, 48px minimum height, no shimmer.

### Inputs / Fields
- **Style:** White elevated surface, 1px Stone stroke, 14px radius, 14px 16px padding (10px 12px for time, date and small numeric fields), 16px/1.4 at 400 (16px minimum prevents iOS zoom), placeholders in Muted. Numeric, time and date inputs take `.pf-mono`. Textareas start at 88px (64px for a note) and resize vertically. Selects hide the native arrow and draw a 16px 1.5px Muted chevron at right 14px with 40px right padding. Labels sit above in the label style with an 8px gap; placeholders never replace them.
- **Inline:** a borderless variant with only a 1px Stone baseline, 6px 0 padding, inheriting the surrounding type (the target numeral on Revenue and the pay target on Finance, adding a goal to a lane, catching an idea, editing a block); focus turns the baseline Ink.
- **Focus:** stroke goes Ink and the focus shadow appears (3px ground gap, 2px Ink at 40 percent), 160ms. While any field in a `.pf-fields` group has focus, its sibling fieldsets drop to the soft state; the focused field stays sharp.
- **Toggle:** a Paper pill (44px tall, 8px 8px 8px 16px padding, small shadow, 14px label at left) holding a 40 by 24px track: Stone when off, Ink when on, with an 18px White knob (small shadow) that travels 16px over 160ms. Used for light or dark ("Bone room" / "Ink room"), a goal's done state, a habit's cycle-aware flag and a cost's "Repeats every month". `aria-pressed` carries the state.
- **Error / Disabled:** errors sit below or beside as the Shell block with `role="alert"`. Loading skeletons are the input shape filled with the sunken well and no border, and never shimmer.

### Ground Swatches
A `radiogroup` of four 44px discs in a wrapped row with 20px gaps, each filled with its ground's rest colour and ringed by 1px Ink at 12 percent inset; the chosen disc carries a 2px ground gap and a 1.5px Ink ring, and its label (caption style, 8px below) turns Ink. Press scales to 0.97. One line of small text below names the chosen room ("Bone, unchanged. The room the brand was built in.").

### Chevrons
Month and week navigation only: bare 44px circular buttons with no border and no fill, a 14 to 16px 1.5px Lucide chevron in Muted, Ink on hover, 35 percent when the next period is not yet reachable, 0.97 on press. They sit in a pair at the right of the overline on Finance (8px apart) and of the week line on Content (6px apart).

### Circle Check
A 24px circle with a 1px Stone ring and a 44px invisible touch target. Checked: Ink fill, Ink ring, and an 11px Bone hairline check (2.4 stroke) fading in over 160ms. The row it sits in fades to 40 percent when done; nothing is struck through.

### Day Dot
A 32px circle, 1px Stone ring, 11px mono label at 500 in Slate, 44px touch target. Pressed (a logged habit day, a day off, a times-a-week choice, an energy score): Haze fill with Ink text at 500 in light mode, Focus fill with Bone text in dark. Planned but not yet logged: a dashed Muted ring (the target hairline). Disabled (a future day) at 40 percent. Also used unpressed as the numbered marker beside each priority slot and, holding a 15px pencil, as the edit control on a Today block.

### Step Dots
A row of 8px circles, 10px apart, in the session header while a session runs. Upcoming: Stone hairline. Done: Ink fill, clickable to return. Current: Ink fill with a soft ring (3px ground gap, 1px Ink at 25 percent) and `aria-current="step"`. Each dot has a 36px touch target.

### Hairline Rows
The list primitive: a three-column grid (marker, text, mono count or caption), 13px vertical padding, a 1px dotted Stone divider that the last row drops. Variants: `--solid` for rows that carry values; `--link` (a router link, hover fills the sunken well); `--press` (a pressable row, 0.99 on press). Rows override the column template when they are a ring row (`auto minmax(0,1fr)`, 18px padding), a strip (single column, 16px padding), a link list (single column), a conversation (`minmax(0,1fr) auto`) or a fixed cost (`minmax(0,1fr) auto auto`). A row that opens a sheet is a button with the chrome removed (no background, no border but its dotted bottom, text left) and the `--press` variant. On Today the current block's row is sharp, past rows soft, future rows dim, done rows faded. Row lists are sectioned by a caption label ("Your three", "Today", "Calendar", "Success habits", "Offers", "This month", "Ideas", "The honest version", "Fixed every month", "What worked"), or by a stage caption with its mono count ("In conversation 3", "Won 2", "Not now 1").

### Conversation and Cost Rows
The grouped list, twice. On Sales, open conversations sit in three stage groups (New, In conversation, Proposal out), 36px apart, each row a name (16px, 500) over a caption line (offer · mono value in eur) over a small line (next step and its mono date); a row whose date is today or past carries the one-word "Due" in the label style set in Ink at its right, and nothing else changes. Won and Not now are separate groups faded to 40 percent with "Won" or "Closed" and the mono date in place of the next step; Not now stays behind a tertiary "Show 3 not now" until asked for. On Finance, fixed costs are rows of label, kind caption and mono amount with an 11px unit, ordered by amount, closed by a total ("Every month" caption, `numeral-sm`) over a solid soft rule; one-off costs are rows with a 44px-minimum mono date at left, the label over its kind caption, and the mono amount at right. Every row opens its sheet; there is no swipe, no inline edit, no drag.

Superseded on Sales on 4 September 2026 by the conversation card (below); the row form survives for Won and Not now, with a closed stage ring in place of the check. Finance keeps the rows as described.

### Focus, corrected (12 September 2026)

Laurence's correction: the four worlds (Business, Brand, Life, Clients) were my structure, not hers, and hiding the habit, project and content systems behind Search read as removing them. Focus now carries her four segments in one Haze segmented pill: **Your focus**, **Your habits**, **Your projects**, **Your content**. The world switcher is gone from the shell (the context store stays for later).

- **Your focus** (`src/pf/now/YourFocus.tsx`) is four chapters, one open at a time and the others visible and soft, exactly as the look back: 01 Who you are (the word for the year, up to four values as chips, one line about the woman running this), 02 What you want (three outcomes per lane as chips with an inline line to add, the quarter's six goals with their bars, the month's number), 03 What's getting in the way (obstacles as chips proposed from the week: a plan that did not hold, habits that slip, conversations waiting, what she let go; six common ones; one field for her own; stored in `focusStore.obstacles`), 04 Your next 30 days (the month's focus proposed from the first open goal and the first obstacle, the goals that get the month, the habits that hold it, the session as the next step).
- **Your habits, Your projects, Your content** mount the full Laurence OS systems, restyled to the brand on 12 September in place (same code, same features): the old gold, green and blue accents map to the sage scale (`--pf-depth-text` for anything read as text or state, `--pf-sage` for fills, one soft sage tint for washes), every 600 to 800 weight becomes 500, no radius under 14, cards lose their hairline and gain the warm shadow, the 90 degree gradient bars become flat sage and the 135 degree card washes go, and the pages set Instrument Sans throughout. The fixed 100 talking-heads goal in Content became a weekly posting goal she sets herself (already how the Bora variant worked). (`HabitTracker`, `Projects`, `ContentCreation`) inside the room, in a wide column (`.pf-one--wide`) with their own inner styling for now; the shell runs the Supabase data sync so they hold real data. Project detail pages still open in the older shell at `/projects/:id/…`. Restyling these three to the brand is a separate, later round.

### The Navigation Model (proposal, 5 September 2026)

Depth of field applied to the whole app: at any moment there is one thing her attention should be on, and everything else is present but held back. Built for a brain with a small working memory, no feel for time, and a threshold at starting rather than at saving. The interface answers; it never asks.

- **Home is Now, not an overview.** `/now` is one column that says three things: what is on, what is next, and the three that count today. The headline is the current block with its full stop, the lead is "Until 15:00. 28 min left. Then Admin at 15:30.", and the one Ink pill is the next step ("Done", "Start it now", "Plan today", "Start the session", "Close the day"). No widgets, nothing to interpret.
- **Five words of navigation, always text.** Now, Today, Week, Focus, Me. A bottom bar on the phone (Paper at 90 percent, 56px targets, the active word in Ink with a 5px Ink dot), a static row under the header from 768px. No icon without its word, no floating dock, no nesting. The old nav pill is retired; the Field lives at `/field` behind search.
- **Worlds are a switcher, not menu rows.** Business, Brand, Life, Clients sit in one Haze-filled segmented pill at the top; the five words under it never change. Only Focus reads differently per world (Business: the month's gap as a bar, the business goals, "Log a sale"; Brand: Content; Life: the life goals and Success habits; Clients: Sales). Now, Today, Week and Me are the same in every world.
- **Everything rare sits behind search.** Cmd+K, or the word "Search" at the top right, opens a sheet with every place in the app, typed and filtered, arrows and enter. Nothing is removed; it stops taking up room.
- **Time is always visible.** The strip under the switcher shows the clock (mono, Ink), what is on and until when, how long is left, and what comes next. It reads calendar events as well as planned blocks and ticks once a minute.
- **No badges, no counters, no dots of unread.** The only counts on screen are numerals with units that she asked to see.
- **The app remembers.** `/` returns to the screen she left (`pf-context-v1.lastRoute`), and half-typed lines survive closing (`useDraft`, used first on the Now screen's one line for today).
- **One primary per screen.** One Ink pill; the switcher's chosen segment fills Haze so it cannot compete. Everything else is text or a secondary outline.
- **Checking off is felt.** The circle fills Ink at once and the row fades over 200ms; nothing is struck through, nothing celebrates.
- **One column, generous space, big targets.** `.pf-page--one` narrows every screen in the new shell to 640px, left-aligned; rows in Now are 16px tall at the padding with 26px checks.

Built: the shell (`src/pf/now/NowShell.tsx`), Now (`Now.tsx`), Focus · Business (`Focus.tsx`), and on 5 September the three others in the same pattern:

- **Today** (`TodayScreen.tsx`): the day's intention as the headline, one line of count and what is on, one pill "Change today" (a sheet that offers the studio's rebuild as primary and "Add a block by hand" as text), then the day as rows of planned blocks and calendar events in one list (the block that is on sharp, the past soft, the future dim; 17px titles, 44px rows, a circle check per block), then the habits for today. Without a session it says so and offers "Start the session". The older Today with its separate calendar section lives at `/today/plan`.
- **Week** (`WeekScreen.tsx`): one next step for the week as the pill, chosen in order: Start the session, Finish the session, Write the recap (Friday and Saturday, or a past week), See the recap. Under it the three with the goal each serves, the seven days as rows (day in numeral-sm, the intention or the block count, done over total; today is a link to Today and sharp, the days behind soft, the days ahead dim), and the habits' weekly counts. Chevrons move a week at a time, one week ahead at most.
- **Me** (`MeScreen.tsx`): the room (four grounds), light, working day and days off, one row to Success habits, one secondary "Search ⌘K" that opens the palette for everything rare, and sign out as text. No Ink pill on this screen.

Focus in the other worlds, same day:

- **Brand**: the headline is the next piece ("Five conversations, no pitch." today, or "Sunday session, live on Sunday."), the lead is what worked best this month in saves; the pill is "Posted" when today's piece is still open, otherwise "Plan a post" (a sheet: one line, the seven day dots, the format chips). Under it one inline line to catch an idea (a draft survives closing), this week's pieces as day rows with a circle check for posted (today sharp, the past soft, the rest dim), the ideas with "Plan" and "Let go", the three that worked, and one text link to the full plan with numbers.
- **Life**: the headline is the habit for today ("Run today."), or "Today is kept."; the lead is the cycle phase and what it asks, or the week's count. The pill is "Done" for that habit; "Habits and cycle" is text. Under it every habit with today's check, seven small day dots (Focus when done, a Slate ring when planned, dotted otherwise, today circled) and the weekly count, then the life goals with their bars.
- **Look back, rebuilt** (`src/pf/LookBack.tsx`, 5 September, on Laurence's brief: four empty boxes were four times "think of something"): three questions, one at a time, with the count in the overline ("Look back · 30 sec · 1 of 3"). Each question is answered by tapping chips the week already knows: priorities that stood or did not, blocks done, habits kept or missed with their counts, conversations won or parked, pieces posted or not, and last week's drop suggestion; the lessons are proposed from the pattern of the week ("Three, not six. It held.", "Mornings carry the work.", "Run slips when the week fills."). What can be confirmed is pre-selected; she adjusts. One small field per question for her own words, labelled, with no placeholder text. The two questions still to come sit under the current one at 55 percent with their number and "next"; the one done shows its answer and "change". Energy sits on the third question as five day dots. The dock holds "Next" in Ink and "Nothing this week" as an outline of the same size, so skipping is visible and free of guilt. "Say it instead" listens for twenty seconds (Web Speech, where the browser has it), then the studio sorts the transcript over the three; without a key it lands in the current question. The step promises 30 sec, not 3 min.
- **The other steps, same principle** (5 September): Money opens with the answer ("5,900 eur to go in September.") and the gap as a depth bar; without a target it offers three to tap (same as last month, a step up, a stretch) and one labelled field; sales are one-tap offer chips and the dock offers "Nothing sold" as an outline beside "Continue". Your three arrives filled: a business step, a life step and the strongest of the rest, drawn from the quarter goals' milestones, last week's undone priorities, the open conversations and the pieces planned this week; the studio proposes on top when it is connected. Each slot is tap-to-edit with "Swap", more chips sit under "More to choose from", one labelled field takes her own, and "Last week's three" is the outline. Success habits comes with the days filled (last week's, else preferred, else spread), habit ideas as chips with their times, one labelled field for her own, the working day and days off from Settings, and "Same as last week" as the outline. Your week falls back to a local draft (`src/lib/pf/localDraft.ts`: habits before nine, the three in working mornings, admin after lunch) when the studio is not connected, with one line saying so. No placeholder text anywhere in the session. The session promises six minutes now, not twenty, and the header counts down from six.
- **Recap, in the pattern** (`src/pf/Recap.tsx`, 5 September): the week is read back before she does anything. A draft from the data stands at once (the local recap), the studio's words land on top when it is connected, and every line is a Haze chip she confirms or taps away: Moved (priorities done, conversations won, priority blocks done), Protected (habits kept, habits partly kept with their count, rest held), Left (priorities open, the week's drop suggestion, habits missed). The headline is a chip too, three proposed from the numbers plus the studio's, with one labelled field for her own; next week's line is one labelled field, prefilled. The card redraws live from what stands. One Ink pill "Share the card" saves the recap and shares it; "Keep it here" is the outline that closes the week without a card; "Save as PNG" is text under the card. The honest version sits under it at 55 percent. An empty week says "Nothing to look back on yet." and, for the current week, offers "Start the session". No placeholder text.
- **Weekly Session** (`/session`, same day): the ritual keeps its own room and its dock, and takes the pattern's rules. The step dots are gone; the header carries text only: the clock, "step 2 of 5, Money" and the minutes left of the twenty, counted from the moment she walked in. The slot screen answers before it asks: "Twenty minutes. Then the week knows what it is for.", or "Continue at your three." when she left mid-way, or "Your week is set." The five steps stay as rows, the current one sharp. Every keystroke in Look back is kept as she types, so leaving mid-sentence and coming back finds the sentence. Step titles are the page's h1. The way out is "Not tonight" or "Back to Now".
- **Clients**: Sales in its focus reading (`<Sales focus />`): the h1 headline, "New conversation" as the pill in the header, the ring alone with one line explaining solid and dashed, and the swipe cards as before.

### The Depth Bar (goal progress)

Founder decision, 4 September 2026: goal progress is a bar; time stays an arc. Laurence did not resonate with rings for goals and asked for something with more pull and more relief when it lands. The bar keeps the system's grammar so it reads as the same brand: a 1px dotted Stone scaffold across the row, a 14px dashed tick at the right edge where the target is, and a 6px solid pill of value (`clip-path` inset, 320ms strong ease-out, never width) that deepens through the sage scale as it grows (Haze under 33 percent, Sage to 66, Focus to 99, Depth at 100). The numeral sits above it at left ("14 /21 km", numeral-sm, the number popping to 1.08 for 200ms when it changes) with "7 to go · tap for one more" at right; the whole block is a 44px button that adds one. Landing: the fill goes Depth over 600ms, then the Ink dot arrives at the end in 80ms with no easing (the same snap as the mark), the target tick fades, the row holds sharp while its lane-mates go soft for 2.6 seconds, the caption reads "Landed. 21 km." and the title takes its full stop; only then does the row fade to the done state. A goal without a number shows the empty scaffold and "tap the title to give it a number". The same bar, 4px and without numerals, marks year outcomes (56px) and the goal chips on Month (24px). Rings remain for time (year, quarter, month, week), for revenue and for Finance.

### Horizons (Goals)

Goals is one ladder seen at four distances, switched by the same Paper segmented pill Money uses (Year, Quarter, Month, Week; `/goals/year`, `/goals`, `/goals/month`, `/goals/week`). Every horizon opens with an overline that counts time ("2026 · day 247 of 365", "2026-Q3 · day 66 of 92", "September · day 4 of 30", "Week 36 · 31 Aug to 6 Sep") and carries an aperture ring of the time elapsed with radial hairline ticks for the divisions inside it (quarters on the year, months on the quarter, weeks on the month, days on the week); the ring's centre reads the days left as a numeral with its mono unit. Nothing is a bar.

- **Year.** The word for the year is the one typographic event (`.pf-word`, clamp 2.75 to 5.5rem, -0.035em), typed straight into the page as an inline line and read back as text; one line under it in body. Two lanes of at most three outcomes, each row a 56px depth bar that fills with the share of quarter goals serving it (Depth with the Ink dot when landed), the title in h4 and a caption listing those goals ("Now: Launch the group programme · Q4: …"). Outcomes are added inline and edited in a sheet.
- **Quarter.** The two lanes as before, with the count now reading "0 /2 done". A measurable goal's bar block is the tap target for one more (`.pf-goalbtn`, scale 0.985 on press); the title opens the sheet. A landed goal shows the full Depth bar with the Ink dot and "Landed." A new goal typed inline opens its sheet at once under "Make it real.", where a preview bar fills live as she sets Now and Target, unit chips (clients, members, eur, km, sessions, posts, hours, days) sit under the fields, and "Serves this year" offers the lane's outcomes.
- **Month.** The focus is an inline h2 line ("What September is about"), given its full stop on save. "In play this month" is the quarter's goals as Haze chips, each with a 24px depth bar of its progress; a chosen chip fills Haze, never Ink. Under it, every ISO week touching the month as a row: W-number in numeral-sm over the mono date span, the three priorities (done ones faded) each with its lane in Depth, and "1/3 done" at right. The current week is sharp; the others sit at 55 percent. Chevrons move month by month, two months ahead at most.
- **Week.** The three priorities of the chosen week with circle checks, each captioned with the goal it serves and, through that goal, the year outcome ("serves Three new 1:1 clients · this year: Fewer 1:1 clients, deeper work"). The month focus leads the body line. A current week without priorities points to the session; a drafted week says so.

Chips on a page that can be chosen fill Haze (`.pf-chip--haze`), never Ink; Ink-filled chips stay inside forms.

### The Conversation Card (signature)

Sales is the one page where a thing moves under her finger. An open conversation is a Paper card (radius 20, 16px 18px padding, warm `--sh-md`, no border; a due card lifts to the elevated surface and `--sh-lg`) laid out as a stage ring, the text column and a circle check. The stage ring (22px) is the aperture in miniature: a dotted Stone track, a solid sage arc that fills as the conversation moves (New 25 percent in Haze, In conversation 50 percent in Haze, Proposal out 78 percent in Sage, Won closed in Focus with the Ink dot at the centre; Not now is the bare track). Green encodes depth towards Won and is always paired with the stage label, never the sole carrier.

The gesture. Dragging right reveals the next stage's name on a Haze wash under the card; dragging left reveals "Not now" on a sunken wash. The wash and the label arrive in proportion to the drag (the label slides 8px into place), and at 96px the label turns Ink to say the card is armed. Past 132px the card gains friction (a quarter of the movement); a card at Proposal out has friction to the right from the first pixel, since Won is a decision. Release at 96px or a flick faster than 0.11px per ms commits: the card leaves in 180ms (transform and opacity only), the stage changes, and the card resolves in its new group with the standard 200ms enter; anything less snaps back over 260ms on the strong ease-out. While dragging there is no transition at all; the value is the finger. Vertical intent within the first 6px hands the gesture back to the scroll (`touch-action: pan-y`). Arrow keys do the same from the keyboard; a tap opens the sheet; a drag, committed or not, never also opens it. Each move except Won writes a one-line status beside the New conversation button ("Anke V. to Proposal out. Undo") for six seconds.

The check. Tapping the circle says the next step is done and crossfades the card (140ms blur to 2px and opacity, then the new state resolves) into the next-step form: the name and "done. Next" as a caption, one input, three chips (Tomorrow, In 3 days, Next week) beside a mono date field, "Nothing for now" as a tertiary at left and Back plus a small secondary Save at right. A conversation without a next step reads "No next step yet." in Muted; it is never red.

The Won moment. Won never happens on the page. The commit opens a sheet titled "Won." with the Aperture mark at 64px playing its brand motion (the field resolves from blur over 600ms, the arc sweeps over 900ms, the dot snaps at 720ms), the value in the page numeral counting up over 700ms on a cubic ease-out, one line ("Sofie D., group programme. Logged as revenue when you tap done.") and the distance to the target in small. "Not yet" returns the card to its stage; Done, or closing the sheet, logs the sale in Revenue once. Reduced motion shows the final number at once. This is the one place the brand's slow clock is allowed inside the product, because it happens a few times a month.

Above the cards the page reads the close: the headline counts the conversations due today, the lead line adds the value behind them and the forecast ("Close all 4 and the month lands at 6,300 eur. 1,700 eur short of 8,000."), and the aperture ring shows logged revenue as the solid value with the open pipeline continuing as a 2px dashed Focus arc (dashed is a target, solid is a value) to the month target, "in play" and its numeral at the centre, Logged, Target and Won beside it. When there are due cards the other open groups dim to 55 percent and return on hover or focus.

### Stats Row
Three numerals in `numeral-md`, each with a caption label above (6 to 8px) and its mono unit beside it, in a wrapped flex row: "This week 0 /3 priorities · Habits 0 /7 · To go 5,900 eur" on the Field, "Priorities · Habits · Sessions" on the Recap, "Posted · Reach · Saves" on Content (Sales moved its three readings beside the ring as `numeral-sm` on 4 September 2026: Logged, Target, Won) and "Posted · Reach · Saves" on Content, where a zero stat sits at 40 percent opacity. A met target replaces the numeral with "Met" in Depth. Revenue and Finance use the ring plus `numeral-sm` stats beside it instead (Target and Logged; In, Out and Pay target, the last an inline field until it is set).

### Kind Dots
A 10px circle beside a block or priority whose kind is carried by hairline grammar, never by shade: priority is a solid Ink dot, habit a Muted ring, event a Slate ring, admin, rest and other a dotted Stone ring. Used in the week grid, Today's block rows, the rebuild proposal and the recap's honest list (done priorities filled Ink).

### Week Grid and Blocks
Seven day sections, one column on phones and seven from 900px. A day header is the subtitle day name, a mono date and a "today" label; today's column is the sharp one. Blocks are a kind dot beside a mono time range and a 15px title, divided by dotted hairlines. An empty day reads "Nothing planned. That's allowed." in the label style. On Today, a block row adds the "NOW" glass tag beside the current time range, a pencil day-dot to edit, and a circle check; the title is 500 when current, faded when past or done.

### Content Week
The same seven-column rhythm (12px gaps, 14px from 900px) as a list of days, each a column of 8px gaps with a dotted bottom divider. Its header is one line: the week in the subtitle style ("31 Aug to 6 Sep.") with "week 36" as a mono caption on the same baseline, and the pair of bare chevrons at the right. A day's head is a text button with a 44px minimum height (15px, Slate, Ink when today at 500) with the mono date beside it that opens the post sheet for that day. Posts are Paper cards (14px radius, 10px 12px, small shadow, 0.98 on press) with a caption line (the format in Muted, or "Posted" in Depth) over a 14px title; posted cards fade to 40 percent. Above the week, "What worked" is up to three pressable rows (title at 15px with its format caption, a mono "reach" caption, a mono saves count with its unit), sorted by saves, shown only once a posted piece has numbers.

### Bubble Fields
A row of circles that is data, never decoration: one circle per completed session on the Field (14px plus 8px per done priority, 18px gaps, 80px tall) or per posted piece with numbers on Content (12 to 52px by reach, 10px gaps, 72px tall, bottom-aligned). Every bubble is Sage (`--depth-2`); opacity (down to 35 percent) and blur (up to 3px) encode recency so the oldest is the softest. The field carries `role="img"` with a count label and shows nothing below two data points. Each bubble's title names its week or post.

### Empty States
A faint aperture outline and one line. The outline is a dotted Stone (or currentColor at 30 percent) ring at 56 to 72px, 1.5 on 5 or 6 off, with no illustration; the line is "Nothing yet." in the label or small style, or a sentence in the brand's voice ("Nothing to look back on yet." "Your week is not set yet." "No offers yet. Add one and a sale takes one tap." "No conversations yet." "No costs yet. Add the fixed ones first."). Exactly one action follows, and only when there is one obvious next step: a primary where the page has no other Ink object ("Walk in", "Walk into a session"), a secondary where it already has one ("New conversation", "Add a cost" under the Money segments).

### The Aperture (signature)
Three forms of one device, all drawn from twelve o'clock.
- **The mark:** the 300-degree tapering sage ring with the Ink dot at centre; 22px in the shell header (simplified cut), 64px on Login and 72px on the session's closing screen where it plays its one animation: the field resolves from 8px blur over 600ms, the arc sweeps over 900ms, and at 720ms the dot snaps in over 80ms with no easing. The dot is never rotated, recoloured, animated otherwise or blurred.
- **The ring:** progress is an arc, never a bar. A `8 8 184 184` viewbox on r=78 so the track fills the box, a 2px dotted track in Ink at 16 percent (1.5 on 5 off), a 12px (10px per goal) round-capped value stroke in the Haze-to-Focus gradient, and a 1px currentColor rim tick (y 34 to 10) that turns with the value. The dial sweeps 294 degrees and never closes. Inside: a caption state word above ("Open", "In focus", "Held", "Set", "to go", "Set a target", "Kept") and the value in `numeral-md` or `numeral-sm` with its mono unit; a finished goal shows "Complete." in Depth and the finance ring's caption turns to "Paid" in Depth once what she kept reaches the pay target (the arc is clamped at zero and never draws a loss). Value changes animate the dash offset and the tick over 200ms ease-out. Sizes: 62vw to 300px on the Field, 200 to 240px on Revenue and Finance, 120 to 140px per goal.
- **The loader:** a single 8-unit arc segment (80 of 252) over the dotted track, orbiting at 900ms linear. 20px inside buttons (in the button's text colour), 40 to 44px in Focus beside a line of copy while the assistant rebuilds a day or writes the recap, 64px for the week draft with a rotating line. Never a spinner.

### The Kept Line (signature)
A number's history over months, drawn the way the ring draws progress: scaffold dotted, value solid, green only under the value. Six months ending at the month being read, in a 320 by 96 SVG viewbox at the full column width. Three dotted Stone scaffold lines (1.5 on 5, non-scaling) at the top, middle and bottom of a 16 to 88 band; the value as a Catmull-Rom cubic curve, 2px Ink, round caps and joins, non-scaling; under it an area fill in a gradient from Focus at 12 percent to Veil at nothing (x 0 to .3, y 0 to 1); on the month being read a 6px Ink dot. The range is padded 12 percent so the curve never rides a scaffold line, and the floor is zero unless a month kept less than nothing. Beneath, the month names in 10px mono, `repeat(6, 1fr)` and centred, the read month Ink and the rest Muted; over the SVG, two 11px mono captions in HTML, the peak ("4,200 eur") top-right and the floor ("0 eur") bottom-left. No axis line, no tick marks, no tooltip, no second series, no animation. The SVG is `role="img"` with a labelled count of months. Until two months have data the line is not drawn and one small line holds its place: "Two months of numbers and the line appears."

### The Recap Card (signature)
The Friday reward, brand-locked: it looks the same in every room and both themes. A 4:5 card (1080 by 1350 on canvas; on screen a 400px-wide container-query preview in `cqw` units with a 20px radius and the medium shadow) on Bone with a Veil radial at 60 percent top-left. Top: the mark (150 canvas px) top-left and "WEEK" plus a mono number (26px, +0.14em, Muted) on its centre line at right. A headline at 84/92px, -0.03em, 500, Ink, three lines at most, starting 292px down. Three lists (Moved, Protected, Left), each a 26px caption over up to three 38/48px Ink items, or "Still." in Muted; the lists compress to fit above the foot with fonts unchanged. Foot: next week's hint in 34/42px Slate at left, two lines at most, and the one dense object, a 54px Ink pill reading "Pretty Focussed" in 30px Bone, bottom-right. Revenue is deliberately not on the card. Shared through the system share sheet where it exists, otherwise downloaded as `pretty-focussed-week-N.png`.

### Motion
One product clock: press 120ms, fast 160ms (hover, focus, fills, the toggle knob), base 200ms (the resolve, ring value changes, focal-plane shifts, hold-to-remove release), slow 260ms (sheets and modals), on `cubic-bezier(.23, 1, .32, 1)`; the sheet's slide alone uses `cubic-bezier(.32, .72, 0, 1)`. Only transform, opacity, filter and clip-path animate on surfaces; inputs transition border-color and box-shadow. A view, step or logged status line enters with the resolve (from opacity 0, blur 3px, 4px down, 200ms); a phone sheet slides up from `translateY(100%)`, a desktop modal grows from `scale(.96)`; there is no exit animation, the next view simply resolves or the sheet unmounts. The nav pill never animates on change, and neither does a segmented control beyond its 160ms fill; the kept line draws without animation. The hold-to-remove sweep is the one slow product motion, 1600ms linear while she is deciding, 200ms back when she lets go. Hover is gated to pointer devices. The brand clock (600 to 900ms) runs only on the mark (Login and the closing screen) and the loader's orbit. Under `prefers-reduced-motion` every animation and transition collapses to 0.01ms and the peripheral blur is removed with opacity kept. Declared and not yet used: `--ease-in-out cubic-bezier(.77, 0, .175, 1)`.

## Do's and Don'ts

### Do:
- **Do** treat the nav pill as the standing Full Stop: at most one further Ink pill per page, only for the single next step, and exactly one primary inside a sheet.
- **Do** open every screen with one overline ("Section · qualifier", 10px, +0.14em, uppercase) and one declarative headline that ends in a full stop.
- **Do** set every numeral with its unit in JetBrains Mono at max(0.35em, 11px), Muted, +0.02em, and build a stats row as three such numerals with caption labels.
- **Do** use the depth scale for chosen or planned state (Haze light, Focus dark), Sage for bubbles, Focus at 12 percent under the kept line, and Depth text only for Held, Met, Complete, Posted and Paid.
- **Do** soften what has passed with `opacity: .55; filter: blur(2px)`, dim what is to come with `opacity: .55`, fade what is done to `opacity: .4`, and let hover or focus lift anything soft back to sharp.
- **Do** carry kind by hairline grammar: solid Ink dot for a priority, Muted ring for a habit, Slate ring for an event, dotted ring for admin and rest, dashed ring for a planned day.
- **Do** draw progress as an arc from twelve o'clock in a `8 8 184 184` viewbox with a dotted track, a gradient value and a rim tick; draw loading as one orbiting arc segment at 900ms; draw history as a bubble field where blur and opacity are recency.
- **Do** draw a number's history over months as the kept line: three dotted Stone scaffold lines, one 2px Ink Catmull-Rom curve, a Focus fill at 12 percent fading to nothing, a 6px Ink dot on the month being read, 10px mono month labels and mono value captions at the corners, and only once two months have data.
- **Do** switch readings inside one nav item with the segmented control (a content-sized Paper pill, 4px padding, one Ink segment in the button style) and count the chosen segment as the page's Ink object.
- **Do** put a sheet's page out of focus (Ink 40 percent, 8px backdrop blur), slide it up on phones over 260ms on the sheet curve and grow it from `scale(.96)` on desktop.
- **Do** make destruction a two-step tertiary Remove or a 1600ms hold-to-remove sweep in Ink.
- **Do** scale every pressable to 0.97 on `:active` over 120ms, give every control a 44px hit area, and gate hover behind `(hover: hover) and (pointer: fine)`.
- **Do** keep every radius at 14px or above: pill 999, input 14, card 20, panel 24, sheet 32.
- **Do** tint every shadow with Depth green `rgb(62 73 54)` at 10 percent or below in light mode: small for toggles and post cards, medium for pills and panels, large for the nav pill, extra large for the sheet.
- **Do** put field labels above the input in the label style (11px, +0.06em, Muted) and keep placeholders as hints only.
- **Do** re-value only `--ground` and `--surface` when adding a room; consume semantic tokens (`--ground`, `--text-2`, `--action`, `--depth-1`) in components; primitives (`--pf-*`) are reached only by the token map and the focus ring.
- **Do** give every empty state a dotted aperture outline, one line ("Nothing yet.") and at most one action.
- **Do** write copy declarative and spare, opening with the answer: "Three is enough. Finish one first."

### Don't:
- **Don't** use a white page ground, pure black, a cool grey, red or amber anywhere; White is the elevated surface only (inputs, the toggle knob, the sheet).
- **Don't** put a second filled button on a page or in a sheet, leave a page chip pressed, or animate the nav pill on change.
- **Don't** use Sage, Haze or Veil as text; Depth is the only green that may carry type, and only for Held, Met, Complete, Posted and Paid.
- **Don't** draw a horizontal progress bar, a spinner, a shimmer, a strikethrough, a badge, a streak, confetti or an illustration in an empty state.
- **Don't** put a border on a panel, card, sheet or post card; the error block's 1px Ink left rule is the only surface border.
- **Don't** introduce a third weight, an italic, a serif or a display face; the loaded set is Instrument Sans 400 and 500 and JetBrains Mono 400.
- **Don't** blur text being read or a control being operated, and never exceed 4px blur on product UI (3px in a bubble field).
- **Don't** animate a high-frequency action, exceed 300ms on product UI (the hold-to-remove sweep is the one exception), use `ease-in`, or `transition: all`.
- **Don't** let green be the sole carrier of meaning; pair every state colour with a numeral and its unit, a hairline mark or a label.
- **Don't** use a chevron as decoration; the only chevrons are the select arrow and the bare 44px period controls.
- **Don't** draw a chart with bars, an axis line, tick marks, a gridline heavier than the dotted scaffold, a second series, a tooltip or a value colour other than Ink.
- **Don't** give a segmented control an underline, a colour, a sliding indicator or the full column width, and don't add an Ink pill to a page whose segment is already Ink.
- **Don't** let a ground change anything but `--ground` and `--surface`, or let the recap card follow the room or the theme.
- **Don't** use exclamation marks, emoji, ellipses, question-mark headlines or softeners in product copy.

## Open items

The pinned kit goes further than the code in these places. They are not built and are recorded here so they are not mistaken for existing rules.

- **The Room.** The four grounds exist and are chosen in Settings, but a ground is static: it does not drop to half chroma on session start, travel cooler over 90 minutes, or return over 260ms at session end. `--ground` is the rest value (light) or Ink (dark). The dominance-law test is not shipped.
- **The depth gradient as a slice.** `--gradient-depth` (155deg Veil to Sage to Focus) is declared and unused; the ring, mark, kept line and recap card draw their own SVG and canvas gradients (the mark's mid stop #8B9C79 is an interpolation, not a primitive; the kept line's stops are written as hex rather than the depth tokens). Rendering the gradient at 120 to 200 percent scale with 2 to 4 percent noise is not built.
- **FOCUSED as the resting state.** Today has it (current block sharp, past soft, future dim). The Field, Goals, Money (Revenue, Sales, Finance), Success habits, Content and Recap are OPEN at rest; the focal plane there applies only to done rows, closed conversations, the non-due groups on Sales while something is due, posted cards, focused field groups, bubble fields and the week grid's today column.
- **Sheet exit and drag.** Sheets unmount with no exit animation (the kit wants 180ms) and have no spring drag-to-dismiss.
- **Declared, unused tokens:** `--ease-in-out`, `--depth-0` as a fill (Veil appears only inside the field gradient), `--gradient-depth`, `--pf-flush`. They are the kit's values and are kept for the surfaces that will need them.
- **Legacy in `src/index.css` and `index.html`:** the global stylesheet still carries confetti, shimmer, bar-grow and glow keyframes and, in its light block, badge and dot colours outside the palette (#4E7A6E, #7A6048, #4A6A80) for the Laurence OS pages reachable from Settings under "More"; `index.html` still loads Archivo, Instrument Serif italic and Space Mono for those pages. None of this is part of the system and none of it may be used on a Pretty Focussed surface.
