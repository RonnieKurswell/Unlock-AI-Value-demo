# Insurance — Unlock AI Value · status 2 Sep (pm)

Build link : https://ronniekurswell.github.io/Unlock-AI-Value-demo/
Figma : V3 — current build (31 Aug) · **diagnostic screens there are 4 revisions behind, waiting on your sign-off**
Due : **29 September** · look and feel review Thursday 3 Sep

---

## ⚠️ VISUAL DIRECTION — still the thing that blocks the week

* Client killed the 3D. Three.js hexagon read as "low-poly and dated". New direction is PNG.
* Evelyn + Tarun design the hexagon, Kai splits to 6 PNGs. Was due today.
* Unresolved: client says "blue text on crisp white", our build is dark glass. Land it before Thursday.
* The board is back to a 50% share, so a PNG swap is a straight replacement of the 3D object in that half. Not free, but not a rebuild.
* My recommendation: keep the motion, drop the 3D.

## ⚠️ OFFLINE vs EMAIL — can hard-fail on the day

* Brief says fully offline. ITC Vegas has no NFC, so results are email only, via Mailgun.
* Mailgun needs a network. Nobody has said whether the kiosk gets wifi or queues locally and flushes later.
* Jamil builds it, Huw briefs this week.

---

## Diagnostic screen — done today

* ✅ Case study **in the question panel**, between the answer and Next, for that question's own pool. Tap opens the full case.
* ✅ Standalone mid-quiz proof screen built, then removed when you asked for it on the question instead
* ✅ Split settled at **50:50** after trying 70:30 and 60:40
* ✅ Slider spans the panel, same width as the progress bar, case study and action row
* ✅ **Hierarchy rebuilt.** Seven uppercase letterspaced labels down to three; six blue elements down to two, so the slider and Next own the blue
* ✅ Theme demoted from a second heading into the meta row, sentence case
* ✅ Progress bar above the meta row, thinner, so its fill no longer reads as an underline of the words
* ✅ **Back and Next in one action row**, rule above it, back left and forward right. Was two stacked left-aligned links of equal weight
* ✅ Panel is **one fixed height** with the action row pinned to the bottom, so Next is in the same place on all six questions
* ✅ More air above the question, and the rhythm below it is even
* ✅ Attract says "Two minutes", which is what six questions actually take
* ✅ **All carrier names masked** to descriptors, in the build, the README and the review spreadsheet

## Earlier, still standing

* ✅ Insurance in the headline · jump straight to diagnostic · "Question 1 of 6" · arrows either side of the pool dots · Infosys logo restarts
* ✅ 18 questions → 6, one drag slider per pool, five labelled stops
* ✅ Transitions and staggered entrances on every screen
* ✅ Fills the window on non-16:9 displays
* ✅ Dev server threaded, so two browsers can hit it without it looking like a crash

## Not done — mine

* ⬜ **Diagnostic CTA on the explore screen still not centred.** Two of them, neither is the focal point ⚠️
* ⬜ Framework intro screen: retain but redesign, flagged as maybe redundant with the pool screen
* ⬜ Five-year results screen: three columns become one paragraph per persona. Touches part of 30 band blocks
* ⬜ Figma: 6 diagnostic screens need re-rendering to match the build
* ⬜ **6 commits unpushed on main**

## Not done — blocked on other people

* ✅ **Carrier names masked.** All 13 mentions replaced with descriptors, per Anshul's instruction that case studies carry no client references. Nothing to chase unless he clears specific names, in which case the mapping is kept locally
* ⬜ **6 of 18 case study tiles empty.** Physical AI has zero, so its question shows no case study at all ⚠️
* ⬜ **Benchmark: Gartner agreed as the source (Huw).** Fine print is built and live on the results and final screens. Still needed, all three from a Gartner seat: the six baseline figures, the exact reference to cite, and confirmation their reprint terms allow attribution on a public kiosk ⚠️
* ⬜ All 15 backgrounds are placeholder. John and Evelyn producing the real set ⚠️
* ⬜ Hexagon still the PowerPoint-looking one ⚠️
* ⬜ QR still reads "QR · PLACEHOLDER", no destination URL
* ⬜ Email backend is Jamil's, brief not sent
* ⬜ Two configs, NFC and no-NFC. No-NFC first
* ⬜ Anshul's consolidated feedback after the Deepak meeting never arrived

---

## Decisions needed

1. White or glass. Client said white, you said glass. Cannot have both.
2. Does Three.js stay in any form, or does all motion go with it
3. Mask the carriers now with generic descriptors, or wait for Anshul's cleared list
4. Who chases Anshul for the missing case studies, Physical AI especially
5. Does the kiosk get wifi at ITC Vegas, or does email queue locally
6. Where do the benchmark numbers actually come from
