# Unlock AI Value — Insurance kiosk

Infosys AI maturity diagnostic for event kiosks. Three.js, 16:9 touchscreen, runs fully offline.

**Live demo:** https://ronniekurswell.github.io/Unlock-AI-Value-demo/

Built by Charleselena for the Infosys Insurance technology department. Due 29 September 2026.

---

## Run it locally

```bash
python3 -m http.server 4321 --directory build
```

Open `http://localhost:4321`. Kiosk target is 1920×1080; the stage letterboxes to 16:9 at any other window size, so it previews fine on a laptop.

Driving it: click anywhere to start · drag the upright hexagon to read the six pools · `1`–`5` answers questions · `Enter` advances the result beats.

## The flow

`attract → framework → diagnostic (18 questions) → identify → results (5 beats) → done`

| Screen | What it does |
|---|---|
| Attract | Centred teaser, hexagon low in frame. 90s idle returns here from anywhere |
| Framework | Hexagon stands upright on the left; drag to rotate. Each pool is a ~30-word read plus three clickable proof tiles |
| Diagnostic | 18 questions, 3 per pool, three-word answers. Prisms grow as each pool fills |
| Identify | Tap badge, or enter email manually. **Before** the results, so nobody leaves without a report — and the role beat is written from the job title the badge carries |
| Results | Archetype → peer benchmark → five-year view → your role → proof |
| Done | Confirmation and QR, then auto-reset |

## How it's put together

- `build/js/scene.js` — one `rig` carries posture, one `hive` carries spin, so the same six prisms serve every screen: flat ring, four-across row, upright wheel. Camera framing is **computed** from a declared subject and margin, not hand-placed, so nothing crops at any resolution.
- `build/js/data.js` — all content. This is the only file that changes for a new vertical.
- `build/js/app.js` — state machine and view rendering.
- `build/css/app.css` — design system. Geist Light display, Inter text, Infosys blue.

There's a debug handle at `window.__kiosk` for on-site troubleshooting. `__kiosk.scene.snap()` jumps all transitions to their end state; `__kiosk.scene.measure()` returns the NDC bounds of the 3D object, which is how framing is verified.

## Content provenance — read before editing `build/js/data.js`

Every figure, client name and platform name traces to one of:

- `Playbook-Unlock_AI_Value- INS-AA-Aug10.docx`
- `AI Use Cases Insurance - Jul 28.xlsx`

Three things are deliberately visible on screen rather than filled in:

1. **Physical AI has no case study.** The playbook's Pillar 5 carries an unfilled `<CASE STUDY>` placeholder and the use case register has no Physical AI row, so all three of its proof tiles render greyed as "Infosys to supply".
2. **AI Trust has one, borrowed.** A risk & compliance case is substituted from the use case register and labelled as such; its other two tiles are pending.
3. **Peer medians are illustrative placeholders.** Infosys has not supplied benchmark data, so every surface showing them carries `BENCHMARK_STATUS`. Do not present them as research.

`TILES` in `data.js` holds three proof points per pool — 18 in total, of which 6 are pending. That list is the content still to chase with Infosys.

Do not reintroduce **XtractEdge** — it is not in the playbook. The real platform names are Topaz Fabric for Insurance, Insurance Genome, IPMS, AI Next, Document AI, Neural Connect, AI Foundry, and Devin (via Cognition).

## Report generation

`composeNarrative()` in `build/js/app.js` assembles report text from 30 `BAND_COPY` blocks (6 pools × 5 maturity bands) plus any free text the visitor added. Deterministic and offline — no network dependency at the booth.

That function is the slot where a playbook-grounded model call writes the connecting paragraph in production. Exhaustive pre-generation is not viable: 18 questions × 5 options is 5^18 combinations. Band blocks are, at 30.

## Third-party assets

`build/fonts/web/` holds **Geist** and **Inter**, the pairing infosys.com itself
serves — their h1 is Geist 300 tracked at −1px, their body copy is Inter. Both are
SIL Open Font Licence, so they ship with this repo legitimately. Latin subset only,
8 files, 304KB total; the kiosk needs no network.

`build/vendor/three.module.js` is Three.js r160, MIT licensed.

## Status

Complete and running: full flow, computed camera framing, 18-question diagnostic, five result beats, badge and manual delivery paths.

Not built yet:
- Mobile and tablet layouts — 16:9 only for this build, by decision on 12 Aug 2026
- The consultation second screen (last report pushed to a URL)
- The live NFC read. The demo trigger on the identify screen stands in for it; on the kiosk, wire the reader to call `identified({ name, title, email })` — the job title is what drives the role beat
- Six of the 18 proof tiles are pending content from Infosys

---

© Charleselena. Client work for Infosys — not licensed for reuse.
