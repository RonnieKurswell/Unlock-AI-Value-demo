# Insurance — Unlock AI Value · status 2 Sep

Build link : https://ronniekurswell.github.io/Unlock-AI-Value-demo/
Figma : V3 — current build (31 Aug)
Due : **29 September** · look and feel review Thursday 3 Sep · framework visual due today

---

## ⚠️ VISUAL DIRECTION — blocks everything this week

* Client killed the 3D. Three.js hexagon read as "low-poly and dated". New direction is PNG.
* Evelyn + Tarun design the hexagon, Kai splits to 6 PNGs, target **today**
* Conflict not resolved: client says "blue text on crisp white", our build is dark glass panels. Someone lands this before John and Evelyn spend Thursday on it.
* `scene.js` is 1082 lines. Rebalancing the diagnostic to 30:70 already shrank the board, so a PNG swap is less work than it was, but it is still a layout job on six pool screens.
* My recommendation: keep the motion, drop the 3D. PNG hexagon with parallax and slow glow.

## ⚠️ OFFLINE vs EMAIL — can hard-fail on the day

* Brief says fully offline. ITC Vegas has no NFC, so results are email only, via Mailgun.
* Mailgun needs a network. Nobody has said whether the kiosk gets wifi or queues locally and flushes later.
* Jamil builds it, Huw briefs this week. Not my code, but my flow breaks if the answer is "no network".

---

## UX (Ronaldo)

* ✅ Insurance in the headline
* ✅ Jump straight to diagnostic
* ✅ Progress bar, "Question 1 of 6"
* ✅ Arrows either side of the pool dots, and they work as buttons
* ✅ Infosys logo white, doubles as restart
* ✅ 18 questions → 6, one drag slider per pool, five labelled stops
* ✅ Transitions and staggered entrances on every screen
* ✅ Fills the window on non-16:9 displays, no more black bars
* ✅ **Case study on each question screen**, for that question's own pool, tap to read the full case
* ✅ **Diagnostic rebalanced 30:70.** Board shrunk and lifted, question grew, slider capped so the drag is not an arm's length
* ⬜ Diagnostic CTA still not centred. Two of them, neither is the focal point. ⚠️
* ⬜ Framework intro screen: retain but redesign, flagged as maybe redundant with the pool screen
* ⬜ Physical AI's question carries no case study, because there is no case study to carry ⚠️

## UI

* ✅ Contrast audit passes every screen, nothing under 15px on the diagnostic
* ✅ Bright saturated blue palette, glass panels, no white containers
* ✅ Animated attract film, 9.6MB
* ⬜ All 15 backgrounds are placeholder. John and Evelyn producing the real set. ⚠️
* ⬜ Hexagon still the PowerPoint-looking one. Top priority, not mine. ⚠️
* ⬜ QR page still reads "QR · PLACEHOLDER", no destination URL

## Content

* ✅ Six questions rewritten plainer, one per pool, five stops each
* ✅ Attract now says "Two minutes", which is what six questions actually take
* ✅ Content spreadsheet re-exported with the new case study placement
* ✅ Every em dash removed
* ⬜ **8 client names still live on the public repo.** Anshul said mask all of them. 13 mentions in `data.js`, and they are now on screen during the diagnostic too. ⚠️
* ⬜ 6 of 18 case study tiles empty. Physical AI has zero, Trust has one and it is a substitute. ⚠️
* ⬜ Benchmark numbers are internal R&D. Anshul wants ISG, Gartner, Forrester, HFS, WEF. ⚠️
* ⬜ Five-year results screen: three columns become one paragraph per persona. Rewrites part of 30 band blocks.
* ⬜ Anshul's consolidated feedback after the Deepak meeting never arrived

## Build and deployment

* ✅ Runs offline, no build step, ships to Pages
* ✅ Framework reusable, swap `data.js` per vertical
* ✅ Figma has all 21 screens, though the diagnostic screens there are now the old 50:50 layout
* ✅ Dev server threaded, so two browsers can hit it at once without it looking like a crash
* ⬜ Two configs, NFC and no-NFC. No-NFC first.
* ⬜ Email backend is Jamil's, brief not sent yet
* ⬜ 3 commits unpushed on main

---

## Decisions needed

1. White or glass. Client said white, you said glass. Cannot have both.
2. Does Three.js stay in any form, or does all motion go with it
3. Mask the carriers now with generic descriptors, or wait for Anshul's cleared list
4. Who chases Anshul for the missing case studies, Physical AI especially
5. Does the kiosk get wifi at ITC Vegas, or does email queue locally
6. Where do the benchmark numbers actually come from
