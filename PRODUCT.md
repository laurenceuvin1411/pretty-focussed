# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a woman of 25 to 35 who runs her own service or creator business (coach, consultant, designer, photographer, studio owner, small agency of one), earning roughly €2k to €15k a month with spikes around launches, living in Belgium, the Netherlands, the UK or Germany. Mostly solo, sometimes one VA. She already pays €25 to €100 a month for business tools (Flodesk, Canva, Google Workspace, a membership) and has abandoned Notion templates and paper planners. She plans Sunday evening in her head, which is why Monday feels heavy. She trains, travels, has friends and wants all of it; she refuses the "despite your busy life" frame.

Her job: turn what she wants this quarter (business and life) into this week's plan, keep it in front of her every day, and see at the end whether the money and the goals moved. Emotionally: feel calm and in charge on Sunday night, and feel seen as the CEO, not as someone who "needs help staying organised". ADHD status is irrelevant to the pitch and central to the design: one place, few decisions, visible progress, a system that forgives a missed week.

Secondary (confirmed by the founder, served later): creators with an offer (24 to 32, irregular income) and mothers running a business (32 to 45). Not for: students and "that girl" template buyers, teams, ADHD-clinical use.

Binding decision (3 September 2026): the 25 to 35 business-owner target replaces the 22 to 30 target in brand kit v1.

## Product Purpose

Pretty Focused is the weekly operating system for women who run their own business: one guided 20-minute session that turns 90-day goals, a revenue target and a handful of life rituals into a week she believes in, with a daily companion that keeps it in front of her and a Friday recap she can share.

It exists because her business, her money, her goals and her life live in five tools and one head, so every week starts vague and ends unexamined. Success is the North Star metric: the share of paying members who complete their Weekly Session in a given week (target 55% or higher), with four consecutive sessions as the retention event.

This repository (laurence-os-clients) becomes the Pretty Focused product. Its current 26-route personal system (recipes, team boards, CRM, finance, marketing) is the starting codebase and the anti-reference: the strategy explicitly warns against shipping it as the product.

## Positioning

"For women who run their own business and want a life to match, Pretty Focused is the operating system that turns quarter goals, revenue targets and life rituals into one calm week, so you run your business and your life on purpose. Unlike productivity apps that manage tasks and business tools that manage clients, Pretty Focused manages the woman in charge of both."

Category to avoid: productivity app. Frame to borrow: the CEO frame ("Become the CEO of your own life", already Laurence's line), priced and perceived like a membership, never like a $9.99 utility. The defensible mechanism is the weekly ritual plus longitudinal memory of her business and life together: after six months the review knows which weeks she earned, what she protected and what she dropped.

## Operating Context

- The weekly habit loop: Sunday (or Monday) session to plan, daily Today view to execute, Friday recap card to reward and share, then Sunday again.
- The Weekly Session steps: review last week, check revenue against the monthly target, choose three priorities, protect life rituals, generate the week.
- Her real calendar (Google, Apple) is a fixed input; the assistant plans around it and never auto-moves things.
- Trial is 14 days precisely because it contains two Weekly Sessions; the paywall comes after the second.
- Distribution is founder-led: Laurence's Instagram, podcast, CEO Club and BORA community, plus "plan the week with me" content and micro-creator partnerships. The first 500 founding members are chosen carefully.
- Money is logged in seconds (target, offers, sales, gap). There is no accounting, invoicing or VAT in the product.

## Capabilities and Constraints

MVP scope (seven features, from the strategy):
1. The Weekly Session (guided 20-minute flow).
2. Today: three priorities, timeboxed day, calendar events, one-tap consensual re-plan.
3. 90-day sprint goals in two lanes, business and life, maximum three per lane.
4. Revenue view: monthly target, offers, quick sales log, gap to target.
5. Rituals: up to five, weekly frequency, optional cycle-aware scheduling.
6. Studio assistant (AI): drafts the week and writes the Friday recap. No open chat.
7. Shareable recap card in brand style.

Never build: full CRM with automation, invoicing or accounting, team seats and permissions, project boards, email marketing, recipes or meal planning, a general AI chat, a social feed, a free tier.

Founder decisions (4 September 2026) that extend the MVP, in the same world and with the same limits:
- Sales: a five-stage list of conversations (New, In conversation, Proposal out, Won, Not now) with a next step and date, no automation, no tasks, no pipeline reports; winning a conversation logs the sale in Revenue.
- Finance: what comes in, goes out and is kept per month, a pay target, fixed costs that repeat; no VAT, invoices or bookkeeping.
- Content: ideas caught in one line, posts placed in the week, the numbers added after posting (reach, saves, comments, follows, clicks) so the page reads back what worked; no scheduling, no platform integration.
- Success habits (the product word for rituals): up to five, cycle-aware.

Limits are the design: three priorities, five rituals, ninety days, one decision per screen. If a feature needs a tutorial, it is not ready.

Language: English only (decision 3 September 2026). No Dutch in the product. The existing codebase is Dutch-first, so every screen that becomes part of Pretty Focused is rewritten in English; Dutch and German localisation are not planned for the MVP.

Technical: React 19 + Vite + Tailwind v4 + Zustand + Supabase, deployed on Netlify (laurence-os-clients.netlify.app). AI calls go through the Netlify function so the key stays server-side. Data must be per account; seed content belongs to the owner account only. Mobile-first web layout first; native iOS is a later phase.

Pricing (from the strategy, not yet live): 14-day trial without card, €24 a month or €199 a year, founding members €149 a year locked, Studio tier €49 a month from month six. Billing is a brand surface: prices in full, cancel in one tap.

Open decisions: trademark clearance for "Pretty Focussed" in the Benelux (prettyfocused.app is an existing ADHD tool with the American spelling); whether the current Laurence OS guest pages remain reachable during the transition; Apple Calendar integration approach.

## Brand Commitments

Binding brand system (pinned by Laurence on 3 September 2026): the "Pretty Focussed Brand Kit" v1.0, published artifact https://claude.ai/code/artifact/8d463535-bcef-4840-9632-f6bae6b1ccb3. It replaces the earlier cream/rose kit entirely and governs the whole app.

- Name and mark: Pretty Focussed, British double-s, never the American spelling. The Aperture mark: a sage ring sweeping 300 degrees from twelve o'clock and tapering, one solid Ink dot at the centre. Never rotate it, fill the ring, recolour, animate or blur the dot.
- Brand idea: depth of field. Nothing is removed, one plane is brought forward. Essence: attention is the most valuable thing she owns. Dominant emotion: relief. Archetype: Creator 60, Lover 30, Ruler 10. Never guilt, urgency, shame, overwhelm, cuteness, hype.
- Colour: warm bone ground #F4F2EE (never white), Paper #EAE7E1, Stone #D6D1C7 for hairlines, Slate #55534E and Muted #6B675F for secondary text, Ink #14150F (a green-black) for text and the one accent object. Green is a state, not a colour: Veil #E2E7DA, Haze #C6D0B8, Sage #98A886 (surface only, never text), Focus #6E7F5E (active, filled progress), Depth #3E4936 (the only green safe for text). Flush #E0B8A4 is the single human accent, max 3 percent of a frame, once per session. Sky and Mist exist for atmosphere plates only. Grounds she can pick: Plaster, Travertine, Field, Air. No red, no amber, no cool grey, no pure black on pure white. Dark mode inverts ground and Ink.
- Type: one grotesque, two weights (400 and 500), no bold, no italics, no serif. Open fallback and what the kit is set in: Instrument Sans for display and body, JetBrains Mono for units, axes and timestamps. Extreme scale contrast (6 to 1) and no bridging sizes. Tracking inversely proportional to size. Sentence case everywhere; uppercase only for the single overline and one word in a glass pill. One typographic event per screen. A numeral never appears without its unit.
- Hierarchy: density, not scale or colour. Exactly one Ink pill (the Full Stop) per view at 2 to 4 percent of the frame, always the densest object. The periphery goes soft (blur up to 4px in product, opacity 55 percent), never grey, never struck through, never hidden.
- Graphic language: circle, pill, superellipse only; no radius below 14px (pills 999, inputs 14, cards 20, panels 24, sheets 32). No borders on cards; surfaces by tone and a warm-tinted shadow at 10 percent max. Progress in time is an arc; goal progress is a depth bar (founder decision 4 September 2026: dotted scaffold, dashed target tick, solid sage value that deepens, Ink dot when it lands). Hairlines: dotted is scaffold, dashed is a target, solid is a value; horizontal or radial only. Glass pill: 72 percent fill, 32px blur, one inner top highlight, max two per view. Icons 1.5px outline in circular containers. No illustration, no emoji, no badges, ribbons, streak counters or confetti, no arrows or chevrons as decoration, no diagonals.
- Motion: product UI under 300ms, enters 200ms, exits 150ms, ease-out cubic-bezier(.23,1,.32,1), sheets cubic-bezier(.32,.72,0,1). Press scales to 0.97. Only transform, opacity and filter animate. Frequent actions do not animate. Destructive actions hold-to-confirm (1.6s sweep). Brand motion (the mark) may run 400 to 900ms.
- Product behaviour: no streaks, leaderboards or re-engagement guilt. Completed items fade rather than being struck through. One filled button per view. Errors sit on warm Shell with Ink type. Cancellation is one tap.
- Voice: English, declarative, spare, dry, average eleven words, the full stop as favourite punctuation. No exclamation marks, no emoji, no ellipses, no question marks in headlines, no softeners (just, simply, maybe). Open with the answer, never the problem. Banned: girlboss, hustle, grind, slay, queen, bestie, main character, self-care, manifest, soft life, that girl, unlock, supercharge, game-changer, seamless, effortless, empower, elevate, journey, mindset. Examples: "Everything else can wait." "No sessions this week. That's allowed." "You've been away. Nothing's changed."
- Imagery: no eye contact, no smiling at camera, no laptops, cafes, journals, desks or wellness signifiers; material still life and atmosphere instead. Skin never desaturated or smoothed.
- Kept from the strategy: membership language ("your session"), money shown never bragged, no income claims. Must never become: a pink productivity app, a manifestation brand, a team tool, an everything-app with a sidebar of sixteen modules.

## Evidence on Hand

- Market and positioning research: /Users/laurence/pretty-focused/strategy/pretty-focused-strategy-lu.html (published artifact "Pretty Focused Strategy · LU"), with research notes in /Users/laurence/pretty-focused/strategy/research-notes/ and the five-year model in model.js. 45 competitors checked on 3 September 2026; none combines goals, habits, revenue, calendar and a weekly review for women.
- Founder audience: Laurence Uvin's Instagram, podcast, CEO Lifestyle alumni, CEO Club and BORA members are the launch channel.
- Not on hand, do not fabricate: customer testimonials, founding-member numbers, usage data, press, app-store ratings. Interviews with 20 women in segment A are planned, not done.

## Product Principles

1. One ritual, kept: everything exists to make the Weekly Session better or its results visible.
2. Standards and softness in the same sentence: high expectations, kind delivery, no shame mechanics.
3. Fewer, better: three priorities, five rituals, ninety days; limits are the product.
4. Business and life are two lanes that both win; rest and training are protected like revenue.
5. She decides, the assistant proposes: AI drafts inside the ritual with her data, never chats, never auto-moves.

## Accessibility & Inclusion

ADHD-friendly by default: visible time, low text density, one decision per screen, forgiving re-planning, no red for errors or misses. Cycle-aware scheduling is optional and stays private to her account.
