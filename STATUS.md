# Insurance — Unlock AI Value · status 1 Sep

Build link : https://ronniekurswell.github.io/Unlock-AI-Value-demo/
Figma : V3 — current build (31 Aug)
Due : **29 September** · look and feel review Thursday 3 Sep · framework visual 2 Sep

---

## ⚠️ VISUAL DIRECTION — blocks everything this week

* Client killed the 3D. Three.js hexagon read as "low-poly and dated". New direction is PNG.
* Evelyn + Tarun design the hexagon, Kai splits to 6 PNGs, target **2 Sep**
* Conflict not resolved: client says "blue text on crisp white", our build is dark glass panels. Someone lands this before John and Evelyn spend Thursday on it.
* `scene.js` is 1082 lines. If 3D goes, the left half of six pool screens is empty and it is a layout rebuild, not a swap.
* My recommendation: keep the motion, drop the 3D. PNG hexagon with parallax and slow glow.

## ⚠️ OFFLINE vs EMAIL — can hard-fail on the day

* Brief says the kiosk runs fully offline. ITC Vegas has no NFC, so results are email only, via Mailgun.
* Mailgun needs a network. Nobody has said whether the kiosk gets wifi or queues locally and flushes later.
* Jamil builds it, Huw briefs this week. Not my code, but my flow breaks if the answer is "no network".

---

## UX (Ronaldo)

* ✅ Insurance in the headline
* ✅ Jump straight to diagnostic
* ✅ Progress bar, "Question 1 of 6"
* ✅ Arrows either side of the pool dots, and they work as buttons
* ✅ Infosys logo white, doubles as restart
* ✅ 18 questions → 6, one drag slider per value pool, five labelled stops
* ✅ Transitions and staggered entrances on every screen
* ✅ Fills the window on non-16:9 displays, no more black bars
* ⬜ Diagnostic CTA still not centred. Two of them, neither is the focal point. ⚠️
* ⬜ Case studies mid-quiz, after Q2 and Q4. Client wants it, we lose that argument. Blocked on content.
* ⬜ Framework intro screen: retain but redesign, flagged as maybe redundant with the pool screen
* ⬜ Attract still says "Three minutes" for six questions

## UI

* ✅ Contrast audit passes every screen, nothing under 13px
* ✅ Bright saturated blue palette, glass panels, no white containers
* ✅ Animated attract film, 9.6MB
* ⬜ All 15 backgrounds are placeholder. John and Evelyn producing the real set. ⚠️
* ⬜ Hexagon still the PowerPoint-looking one. Top priority, not mine. ⚠️
* ⬜ QR page still reads "QR · PLACEHOLDER", no destination URL

## Content

* ✅ Six questions rewritten plainer, one per pool, five stops each
* ✅ Content spreadsheet sent to Anshul, 10 sheets
* ✅ Every em dash removed
* ⬜ **8 client names still live on the public repo.** Anshul said mask all of them. 13 mentions in `data.js`. ⚠️
* ⬜ 6 of 18 case study tiles empty. Physical AI has zero, Trust has one and it is a substitute. ⚠️
* ⬜ Benchmark numbers are internal R&D. Anshul wants ISG, Gartner, Forrester, HFS, WEF. ⚠️
* ⬜ Five-year results screen: three columns become one paragraph per persona. Rewrites part of 30 band blocks.
* ⬜ Anshul's consolidated feedback after the Deepak meeting never arrived

## Build and deployment

* ✅ Runs offline, no build step, ships to Pages
* ✅ Framework reusable, swap `data.js` per vertical
* ✅ Figma has all 21 screens
* ⬜ Two configs, NFC and no-NFC. No-NFC first.
* ⬜ Email backend is Jamil's, brief not sent yet

---

## Decisions needed

1. White or glass. Client said white, you said glass. Cannot have both.
2. Does Three.js stay in any form, or does all motion go with it
3. Mask the carriers now with generic descriptors, or wait for Anshul's cleared list
4. Who chases Anshul for the missing case studies, Physical AI especially
5. Does the kiosk get wifi at ITC Vegas, or does email queue locally
6. Where do the benchmark numbers actually come from
