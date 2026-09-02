# Insurance — Unlock AI Value · status 3 Sep

Build link : https://ronniekurswell.github.io/Unlock-AI-Value-demo/ · **pushed and live**
Figma : V3 — current build (31 Aug) · **badly out of date, see below**
Due : **29 September** · look and feel review today

---

## ⚠️ Blocking

**Visual direction.** Client killed the 3D, wants PNG. Evelyn + Tarun on the hexagon, Kai to split it. Was due yesterday. And still unresolved: client said "blue text on crisp white", the build is dark glass. That question needs answering before John and Evelyn spend today on it.

**Offline vs email.** Mailgun needs a network, the brief says fully offline. Nobody has answered which wins. Sharper now than last week, because with NFC gone email is the only way a visitor gets their report.

---

## Done

**Diagnostic screen**
* ✅ Case study in the question panel, between the answer and Next, for that question's own pool. Tap opens the full case
* ✅ 50:50 split, after trying 70:30 and 60:40
* ✅ Slider spans the panel, same width as the progress bar and the case study
* ✅ Hierarchy rebuilt. Seven uppercase labels down to three, six blue elements down to two
* ✅ Back and Next in one action row, rule above it, back left and forward right
* ✅ One fixed panel height, so Next sits in the same place on all six questions
* ✅ 18 questions to 6, one drag slider per pool, five labelled stops
* ✅ Insurance in the headline, jump straight to diagnostic, "Question 1 of 6", pool arrows, logo restarts

**Results**
* ✅ Role beat removed. Three beats now: position, benchmark, five-year
* ✅ Benchmark screen cut down. The word "benchmark" was on it twelve times
* ✅ Gartner credited in fine print on the results and final screens, one line
* ✅ Fixed rows reading "100/12", left over from the 18-question rescale
* ✅ "BENCHMARK" tick label was 7.5px against a 13px floor. Now 13px

**Delivery**
* ✅ NFC removed. One email field, with a confirmation before the results roll
* ✅ Copy rewritten: "Your blueprint is ready", not "Where should we send it?"
* ✅ Form centred on the same axis as the headline

**Content**
* ✅ All 13 carrier mentions masked to descriptors, in the build, the README and the spreadsheet
* ✅ Attract says "Two minutes", which is what six questions take
* ✅ Every em dash removed

**Build**
* ✅ Runs offline, no build step, ships to Pages
* ✅ Fills the window on non-16:9 displays
* ✅ Framework reusable, swap data.js per vertical
* ✅ Dev server threaded. The "server keeps dying" was it answering one request at a time

---

## Missing — mine

* ⬜ **Explore screen still has two diagnostic CTAs**, neither centred. Last unactioned item from Anshul's original list that is purely mine
* ⬜ **Figma is four or five revisions behind.** Six diagnostic screens, the whole results section, the email screen. The role beat still exists in there and no longer exists in the build
* ⬜ **Framework intro screen** — retain but redesign, flagged as maybe redundant with the pool screen
* ⬜ **Five-year screen to one paragraph per persona.** Needs a content decision first: 30 band blocks and 3 forecast lines in scope
* ⬜ Fine print on the Done screen still runs to two lines

## Missing — other people

* ⬜ **6 of 18 case tiles empty.** Physical AI 3/3 pending, AI Trust 2/3, Agentic Legacy 1/3. Physical AI's question shows no case study at all ⚠️
* ⬜ **Gartner: figures, citation, reprint permission.** All three need a Gartner seat. Permission for a public kiosk is the long pole ⚠️
* ⬜ **All 16 background plates are placeholder.** John and Evelyn ⚠️
* ⬜ **Hexagon still the PowerPoint-looking one** ⚠️
* ⬜ **QR points nowhere.** Still literally "QR · PLACEHOLDER", and with NFC gone it is the only thing a visitor leaves with if the kiosk has no network ⚠️
* ⬜ **Email backend is Jamil's**, brief not sent
* ⬜ "Proven now" on the five-year screen still puts today's case studies under future-dated headings. Anshul was asked to flag whether that framing is a problem and never answered
* ⬜ Anshul's consolidated feedback after the Deepak meeting never arrived

---

## Decisions needed

1. White or glass. Client said white, we went glass. Cannot have both
2. Does Three.js stay in any form, or does all motion go with it
3. Who chases Anshul for the missing case studies, Physical AI especially
4. Does the kiosk get wifi at ITC Vegas, or does email queue locally
5. Who starts the Gartner reprint permission, since that is the slowest of the three
6. Are the carrier names to stay masked, or does Anshul have a cleared list

## Note on history

The carrier names are masked in the build but still sit in earlier commits, and
that history is now pushed. Removing them needs a rewrite and a force push,
which is a call for whoever else is working off this repo.
