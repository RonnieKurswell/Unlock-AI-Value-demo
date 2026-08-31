/* =============================================================
   UNLOCK AI VALUE — CONTENT MODEL
   Every claim, figure and platform name in this file is traceable to:
     - Playbook-Unlock_AI_Value- INS-AA-Aug10.docx
     - AI Use Cases Insurance - Jul 28.xlsx
   Anything not in those sources is marked PENDING. Do not invent.
   ============================================================= */

/* Client brand rules may force a single-blue palette. Both are built; flip the
   flag rather than re-editing every hue. The mono ramp keeps the same lightness
   ordering as the six hues so the benchmark bars stay distinguishable. */
/* Every pool renders in one blue, per the client's brand direction. Not a ramp
   of tints — a single value, so no pool reads as its own colour. Set the flag to
   false to restore the six-hue palette kept in POOLS below; the pool objects
   still carry their original hex, this only overrides it. */
export const MONO_PALETTE = true;

/* One accent again. The copy panels went from solid white to dark glass, so
   they carry the same light text as the ground and the second, darker value
   the white panels needed is no longer used. */
const MONO_BLUE = '#5CBDF5';   /* 6.76:1 on the ground */

/* Matching room, so the space does not shift hue between pools either. On the
   open-pool screens Khai's artwork covers the room anyway; this keeps the
   framework board and the diagnostic consistent with it. */
const MONO_ROOM = ['#00436F', '#00243F'];

/* The hexagon expects pools ordered by the edge they own: index i sits on the
   edge at i x 60 degrees. Same order as the booth build. */
export const hexOrder = () => [...POOLS].sort((a, b) => a.edge - b.edge)
  .map(p => ({ id: p.id, title: p.name, verb: p.verb, accent: p.color, room: p.room }));

export const POOLS = [
  {
    id: 'strategy', index: 0,
    name: 'AI Strategy & Engineering',
    lines: ['AI STRATEGY', '& ENGINEERING'],
    verb: 'Orchestrate', edge: 1,
    color: 0x4F9DFF, hex: '#4F9DFF',
    room: ['#0B2244', '#03080F'],
    blurb: 'Fragmented pilots, no shared platform, and inference cost nobody owns. Infosys builds the operating model and cost-aware architecture that let AI scale across every line of business.',
    facts: [
      'One AI operating model across every line of business',
      'Topaz Fabric and Insurance Genome, integrated with Guidewire',
      'AI FinOps keeps token and inference cost governed'
    ]
  },
  {
    id: 'data', index: 1,
    name: 'Data for AI',
    lines: ['DATA FOR AI'],
    verb: 'Insight', edge: 0,
    color: 0x35D0F5, hex: '#35D0F5',
    room: ['#0A2038', '#03070E'],
    blurb: 'Policy, claims and treaty data sit in silos and unindexed PDFs. Infosys makes it AI-ready and audit-ready, with lineage a regulator can actually follow.',
    facts: [
      'Lineage a regulator can follow, decision by decision',
      'Synthetic data for model training, without PII exposure',
      'One trusted record across policy, claims and party data'
    ]
  },
  {
    id: 'process', index: 2,
    name: 'Process AI',
    lines: ['PROCESS AI'],
    verb: 'Transform', edge: 5,
    color: 0xFF7AB0, hex: '#FF7AB0',
    room: ['#122C4E', '#050B16'],
    blurb: 'Task-level automation inside an unchanged workflow. Infosys redesigns the whole journey, submission to bound and FNOL to settlement, around agents working alongside underwriters.',
    facts: [
      'Submission to bound, straight through',
      'FNOL triaged by severity, routine claims settled touchlessly',
      'Manual underwriting effort cut 50% at Allied World'
    ]
  },
  {
    id: 'legacy', index: 3,
    name: 'Agentic Legacy Modernization',
    lines: ['AGENTIC LEGACY', 'MODERNIZATION'],
    verb: 'Modernize', edge: 4,
    color: 0xB08BFF, hex: '#B08BFF',
    room: ['#081B33', '#02060C'],
    blurb: 'Rating logic nobody fully understands, on platforms too risky to replace. Infosys recovers the intent with AI and modernises module by module while the book stays live.',
    facts: [
      'Rating logic recovered from legacy code by AI agents',
      'Module-by-module migration while the book stays live',
      '99.2% extraction accuracy (F1) at MassMutual'
    ]
  },
  {
    id: 'physical', index: 4,
    name: 'Physical AI',
    lines: ['PHYSICAL AI'],
    verb: 'Innovate', edge: 3,
    color: 0xFFB454, hex: '#FFB454',
    room: ['#15325A', '#060D1A'],
    blurb: 'Telematics, IoT and drone data treated as a reporting by-product. Infosys engineers it into pricing and claims as a first-class input, with digital twins for exposure.',
    facts: [
      'Telematics and IoT engineered into live pricing',
      'Catastrophe damage validated in hours, not weeks',
      'Digital twins simulate loss before it happens'
    ]
  },
  {
    id: 'trust', index: 5,
    name: 'AI Trust',
    lines: ['AI TRUST'],
    verb: 'Assure', edge: 2,
    color: 0x7EE0C0, hex: '#7EE0C0',
    room: ['#061529', '#02050A'],
    blurb: 'A model that cannot explain a declined claim is not deployable. Infosys builds bias testing, explainability and audit trails in from the start, not as a final gate.',
    facts: [
      'Bias and fairness tested before deployment, not after',
      'Explainability built into the model architecture',
      'Ready for NAIC bulletins and the EU AI Act'
    ]
  }
];

/* -------------------------------------------------------------
   THREE PROOF TILES PER POOL. Real engagements where the source
   documents have one; `pending` where they do not, so the gap is
   visible on the kiosk instead of being filled with invention.
   ------------------------------------------------------------- */

export const TILES = {
  strategy: [
    { client: 'US carrier', title: 'AI strategy and COE', metric: '150+ opportunities prioritised',
      detail: 'Workers\u2019 compensation, E&S and reinsurance specialist. Fragmented initiatives with no unified governance; Infosys defined the target architecture and a use case scoring methodology.' },
    { client: 'Ameritas', title: 'AI Factory model', metric: '45K+ hours realised',
      detail: 'Multi-line mutual insurer. An AI Factory operating model with dedicated PODs and governance; 80+ opportunities identified and prioritised across business functions.' },
    { client: 'Northwestern Mutual', title: 'AI COE foundation', metric: 'Standardised intake and guardrails',
      detail: 'Large US mutual life insurer. Five-stream COE covering structured intake, value realisation, Responsible AI, backlog grooming and AI architecture.' }
  ],
  data: [
    { client: 'Everest Re', title: 'Treaty digitization', metric: '100% of treaties digitized',
      detail: 'Decades of treaty wordings trapped in scanned files. Document AI and Neural Connect turned them into a searchable layer with natural-language querying over NATCAT exposure.' },
    { client: 'Ameritas', title: 'Provider fee optimisation', metric: '$1.2M recurring annual saving',
      detail: 'Dental and vision insurer. ML anomaly detection over fee schedules, with market segmentation replacing a one-size-fits-all contracting model.' },
    { client: 'One America', title: 'Competitive intelligence', metric: 'Manual research effort removed',
      detail: 'Leadership had no real-time view of competitor and regulatory movement. An agent aggregates sources into a single briefing on request.' }
  ],
  process: [
    { client: 'Allied World', title: 'Underwriting workbench', metric: 'Request-to-bind up 50%',
      detail: 'Underwriters spent 1\u20132 hours per submission just qualifying it. AI Next orchestrated triage, auto-decline and IGO/NIGO classification; manual effort and operations TCO both halved.' },
    { client: 'One America', title: 'Hardship withdrawals', metric: '10\u201314 days to under 30 minutes',
      detail: 'Retirement benefits processing cost over $100 per transaction with NIGO above 65%. Straight-through processing cut cost under $10 and NIGO below 5%.' },
    { client: 'SageSure', title: 'Statement of Values processing', metric: '80% less manual effort',
      detail: 'Submissions arrived as emails, PDFs, ACORD forms and loss runs. An AI Foundry pipeline extracts, validates and standardises into a rating-ready output, with humans on exceptions only.' }
  ],
  legacy: [
    { client: 'MassMutual', title: 'Policy migration extraction', metric: 'F1 99.2% across 9,100 pages',
      detail: 'Product rules scattered across 1,132 documents. IPMS industrialised extraction, cutting BRS time-to-create by over 50% and delivering 15 functionalities in 12 weeks.' },
    { client: 'Northwestern Mutual', title: 'Informatica ETL reverse engineering', metric: '~70% less documentation effort',
      detail: '1,000+ legacy ETL mappings moving to Databricks. Graph RAG over exported XML recovered transformation rules into SME validation workbooks.' },
    { pending: true, title: 'Third proof point', metric: 'Infosys to supply',
      detail: 'The playbook and use case register contain two Agentic Legacy engagements. A third is needed to balance this pool against the others.' }
  ],
  physical: [
    { pending: true, title: 'Telematics into pricing', metric: 'Infosys to supply',
      detail: 'The playbook\u2019s Physical AI section carries an unfilled case study placeholder and the use case register has no Physical AI row. Infosys to supply.' },
    { pending: true, title: 'Drone claims inspection', metric: 'Infosys to supply',
      detail: 'Described in the playbook as a capability, catastrophe damage validated in hours rather than weeks, but with no client engagement documented.' },
    { pending: true, title: 'Digital twin exposure modelling', metric: 'Infosys to supply',
      detail: 'Digital twins of insured properties and fleets appear in the playbook narrative with no supporting engagement.' }
  ],
  trust: [
    { client: 'Ameritas', title: 'AI-first risk and compliance', metric: '30% productivity improvement', substitute: true,
      detail: 'Substituted from the use case register: continuous risk scoring, automated evidence compilation and control testing, with human experts on interpretation and high-risk exceptions.' },
    { pending: true, title: 'NAIC governance proof', metric: 'Infosys to supply',
      detail: 'The playbook\u2019s AI Trust section carries an unfilled case study placeholder. A named governance engagement is needed.' },
    { pending: true, title: 'Explainability in underwriting', metric: 'Infosys to supply',
      detail: 'Glass-box auditability is central to the pillar\u2019s argument but no client proof point is documented.' }
  ]
};

if (MONO_PALETTE) {
  for (const p of POOLS) {
    p.hex = MONO_BLUE;
    p.color = parseInt(MONO_BLUE.slice(1), 16);
    p.room = [...MONO_ROOM];
  }
}

export const POOL = Object.fromEntries(POOLS.map(p => [p.id, p]));
export const ORDER = POOLS.map(p => p.id);

/* -------------------------------------------------------------
   DIAGNOSTIC — 18 questions, 3 per pool, three-word answers.
   Each pool's third question offers an optional free-text escape.
   ------------------------------------------------------------- */

export const QUESTIONS = {
  strategy: [
    {
      kind: 'Funding & prioritisation',
      q: 'How are AI initiatives funded and prioritised across your lines of business?',
      opts: [
        ['Enterprise AI factory', 'One governed roadmap, shared funding across LOBs', 4],
        ['Central team funds', 'A digital function funds core pilots centrally', 3],
        ['Each business separately', 'Underwriting, claims and actuarial buy their own', 2],
        ['Opportunistic, case-by-case', 'Whoever has budget runs a proof of concept', 1],
        ['No formal process', 'No prioritisation mechanism exists', 0]
      ]
    },
    {
      kind: 'Path to production',
      q: 'What sits between an AI proof of concept and enterprise production?',
      opts: [
        ['Shared engineering platform', 'Common platform with guardrails and reuse', 4],
        ['Cloud services, custom pipelines', 'Standard services, but every LOB rebuilds', 3],
        ['Fragmented vendor stacks', 'Manual glue code between disconnected tools', 2],
        ['Bespoke every time', 'Each deployment is a fresh long build', 1],
        ['Nothing reaches production', 'No model has gone live in core insurance', 0]
      ]
    },
    {
      kind: 'Inference cost governance',
      allowExplain: true,
      q: 'Who owns the token and inference cost of AI in production?',
      opts: [
        ['AI FinOps discipline', 'Cost modelled per workflow, routed by task', 4],
        ['Tracked, not governed', 'Spend is visible but nobody optimises it', 3],
        ['Visible at invoice', 'Discovered monthly when the bill arrives', 2],
        ['Nobody tracks it', 'Unattributed and growing', 1],
        ['Not yet relevant', 'Nothing at production scale yet', 0]
      ]
    }
  ],
  data: [
    {
      kind: 'Unstructured documents',
      q: 'How do loss runs, treaties, medical files and adjuster notes reach your models?',
      opts: [
        ['Automated extraction pipeline', 'Indexed, searchable, entity-linked at ingest', 4],
        ['OCR plus manual review', 'Text extracted, humans still verify everything', 3],
        ['Staff transcribe manually', 'Underwriters and adjusters retype into core', 2],
        ['Locked in PDFs', 'Archived but never indexed', 1],
        ['No capability yet', 'Unstructured documents are not processed', 0]
      ]
    },
    {
      kind: 'Cross-system retrieval',
      q: 'A model needs a policyholder’s full history across systems. How long does that take?',
      opts: [
        ['Real-time self-service', 'Unified data products served over APIs', 4],
        ['Days via ticket', 'Request an extract and wait for batch', 3],
        ['Manual mainframe joins', 'Direct legacy queries stitched by hand', 2],
        ['Blocked by silos', 'Departmental boundaries prevent access', 1],
        ['Not currently possible', 'Cross-system integration does not exist', 0]
      ]
    },
    {
      kind: 'Lineage & audit trail',
      allowExplain: true,
      q: 'Can you show a regulator exactly which data fed a given underwriting decision?',
      opts: [
        ['Full automated lineage', 'Fingerprinted end to end, audit-ready', 4],
        ['Reconstructable with effort', 'Possible, but takes weeks of manual work', 3],
        ['Partial, system by system', 'Some systems log it, others do not', 2],
        ['Not reliably', 'We would struggle to evidence it', 1],
        ['No lineage exists', 'No traceability at all', 0]
      ]
    }
  ],
  process: [
    {
      kind: 'Pre-bind submission',
      q: 'How much of pre-bind submission qualification happens without a human?',
      opts: [
        ['Autonomous triage, auto-decline', 'Out-of-appetite risks declined before the desk', 4],
        ['AI summarises, human qualifies', 'Assisted reading, manual decision', 3],
        ['RPA handles entry', 'Scripts move data, people still qualify', 2],
        ['Hours per submission', 'One to two hours just to assess completeness', 1],
        ['Entirely manual intake', 'No digital assistance at all', 0]
      ]
    },
    {
      kind: 'FNOL to settlement',
      q: 'How touchless is First Notice of Loss through to settlement on routine claims?',
      opts: [
        ['Straight-through settlement', 'Coverage verified and routine claims settled', 4],
        ['AI triage, human decides', 'Severity scored, reserves recommended', 3],
        ['Digital intake, manual adjudication', 'Web forms front a manual process', 2],
        ['Manual across systems', 'Adjusters work step by step, system to system', 1],
        ['Paper-based process', 'Physical files and manual handoffs', 0]
      ]
    },
    {
      kind: 'Workflow redesign',
      allowExplain: true,
      q: 'Was the workflow redesigned around AI, or was AI added to the existing one?',
      opts: [
        ['End-to-end redesign', 'The whole journey was rebuilt around agents', 4],
        ['Redesigned in places', 'Some journeys reworked, others untouched', 3],
        ['AI bolted on', 'Same process, one step now assisted', 2],
        ['Task automation only', 'Individual tasks automated in isolation', 1],
        ['No change yet', 'Process is unchanged', 0]
      ]
    }
  ],
  legacy: [
    {
      kind: 'Core platform drag',
      q: 'How much does your core policy platform slow a new product launch?',
      opts: [
        ['Weeks, not months', 'Logic exposed as APIs, launches are routine', 4],
        ['Wrappers, fragile core', 'Modern APIs over brittle rating algorithms', 3],
        ['Twelve months plus', 'Technical debt sets the pace of the roadmap', 2],
        ['Leadership avoids touching', 'Change is considered too risky to attempt', 1],
        ['No audit exists', 'We have not mapped the estate at all', 0]
      ]
    },
    {
      kind: 'Embedded business logic',
      q: 'How well is your rating, filing and exception logic documented?',
      opts: [
        ['AI-mapped, machine readable', 'Rules and schemas extracted automatically', 4],
        ['Partial, seniors know', 'Some documentation, rest is institutional memory', 3],
        ['Few veterans remaining', 'Knowledge sits with people close to retirement', 2],
        ['Undocumented black box', 'Must be reverse-engineered line by line', 1],
        ['Nobody knows', 'The logic is effectively lost', 0]
      ]
    },
    {
      kind: 'Modernisation route',
      allowExplain: true,
      q: 'What is your modernisation route?',
      opts: [
        ['Progressive, validated increments', 'Module by module, verified against legacy', 4],
        ['Phased by module', 'Sequenced plan, partially underway', 3],
        ['Big-bang replacement', 'One large cutover programme planned', 2],
        ['Stalled business case', 'Approved in principle, never funded', 1],
        ['No plan', 'Nothing scoped', 0]
      ]
    }
  ],
  physical: [
    {
      kind: 'Sensor ingestion',
      q: 'Does telematics and property IoT data reach your pricing models?',
      opts: [
        ['Streams into pricing', 'Continuous telemetry drives dynamic pricing', 4],
        ['Auto telematics only', 'Motor uses it, commercial property in pilot', 3],
        ['Pilots running', 'Small trials, nothing in production pricing', 2],
        ['Collected, unused', 'Data arrives but never reaches a model', 1],
        ['No sensor data', 'No ingestion of physical signals', 0]
      ]
    },
    {
      kind: 'Claims inspection',
      q: 'How is physical damage assessed after a loss event?',
      opts: [
        ['Drone and vision assessment', 'Imagery scored automatically within hours', 4],
        ['Mobile app pilot', 'Policyholder photo capture being trialled', 3],
        ['Photos, manual review', 'Images uploaded for an adjuster to read', 2],
        ['Physical inspection only', 'Someone has to attend the site', 1],
        ['Not applicable', 'No physical damage in our book', 0]
      ]
    },
    {
      kind: 'Digital twins',
      allowExplain: true,
      q: 'Can you simulate exposure on an insured asset before a loss occurs?',
      opts: [
        ['Digital twins live', 'Loss scenarios modelled on live asset data', 4],
        ['Modelling in pilot', 'Twin concepts being tested on a segment', 3],
        ['Static exposure models', 'Periodic actuarial modelling only', 2],
        ['Post-loss analysis', 'We only look after the claim', 1],
        ['No capability', 'Not modelled', 0]
      ]
    }
  ],
  trust: [
    {
      kind: 'Regulatory readiness',
      q: 'Could an AI underwriting decision survive an NAIC or EU AI Act review today?',
      opts: [
        ['Governance by design', 'Multi-gate verification built into the lifecycle', 4],
        ['Legal review, manual monitoring', 'Compliance sign-off, drift watched by hand', 3],
        ['Ad-hoc reviews only', 'Reviewed when someone remembers to ask', 2],
        ['Would not survive', 'We could not evidence the decision', 1],
        ['No AI in decisions', 'No models in regulated decisions yet', 0]
      ]
    },
    {
      kind: 'Bias & fairness',
      q: 'When is fairness tested on a pricing or underwriting model?',
      opts: [
        ['Before deployment, continuously', 'Tested in training and monitored after', 4],
        ['At deployment only', 'Checked once, then left alone', 3],
        ['When challenged', 'Only after a complaint or query', 2],
        ['Not tested', 'No fairness testing in place', 1],
        ['Not applicable', 'No models affecting customers', 0]
      ]
    },
    {
      kind: 'Explainability',
      allowExplain: true,
      q: 'Can an underwriter trace the reasoning behind an AI risk score?',
      opts: [
        ['Full feature attribution', 'Scorecards generated for every decision', 4],
        ['Key inputs documented', 'Main drivers known, interactions opaque', 3],
        ['Black-box vendor model', 'Limited visibility into vendor scoring', 2],
        ['No explainability', 'Nothing available to underwriters or regulators', 1],
        ['Not applicable', 'No AI risk scoring', 0]
      ]
    }
  ]
};

export const MAX_POOL_SCORE = 12; // 3 questions x 4
export const BANDS = ['Absent', 'Emerging', 'Developing', 'Established', 'Leading'];
export function bandOf(score) {
  if (score <= 2) return 0;
  if (score <= 5) return 1;
  if (score <= 8) return 2;
  if (score <= 10) return 3;
  return 4;
}

/* -------------------------------------------------------------
   30 REPORT BLOCKS — 6 pools x 5 bands, drawn from playbook text.
   This is the content the report assembles from. Deterministic,
   offline, no live model dependency at the kiosk.
   ------------------------------------------------------------- */

export const BAND_COPY = {
  strategy: [
    { read: 'There is no mechanism deciding where AI investment goes.', move: 'Start with an AI vision anchored to two or three insurance outcomes you already report on, such as combined ratio, claims cycle time and retention, plus one governed intake process.' },
    { read: 'Individual teams are experimenting, but nothing compounds beyond a business unit.', move: 'Establish an enterprise AI operating model with shared governance and value tracking so the second use case is cheaper than the first.' },
    { read: 'Direction exists, but architecture and cost still fragment by line of business.', move: 'Consolidate onto a shared engineering platform and make token consumption a design decision, not an invoice surprise.' },
    { read: 'A real operating model is in place and use cases replicate across LOBs.', move: 'Add AI FinOps discipline: right-size models per task and route simple requests to smaller models to protect unit economics as volume grows.' },
    { read: 'You are running an AI factory: governed intake, shared platform, tracked value.', move: 'Push into AI-assisted delivery on the core estate itself, where the largest remaining engineering cost sits.' }
  ],
  data: [
    { read: 'Data is not in a state any production model could rely on.', move: 'Begin with one AI-ready data product for a single high-value journey rather than an enterprise-wide programme.' },
    { read: 'Data exists but reaching it is slow, manual and unevidenced.', move: 'Index the unstructured estate of loss runs, treaties and adjuster notes, and instrument lineage from day one.' },
    { read: 'Structured data is workable; unstructured content and audit trail are the gap.', move: 'Add automated extraction and data fingerprinting so a regulator can be shown exactly which data drove a decision.' },
    { read: 'A unified, governed foundation is serving models across lines of business.', move: 'Introduce synthetic data to train on sensitive underwriting and claims scenarios without exposing PII or PHI.' },
    { read: 'Data is a genuine strategic asset: unified, lineage-tracked, queryable.', move: 'Use entity structuring across claimants, brokers and properties to unlock fraud and portfolio signals that single-record views cannot see.' }
  ],
  process: [
    { read: 'Core workflows are manual end to end.', move: 'Pick one journey, pre-bind submission or FNOL, and map it fully before automating any part of it.' },
    { read: 'Automation exists at the task level and the journey is unchanged.', move: 'Shift the unit of redesign from task to journey. Task-level RPA cannot produce the step-change that justifies the investment.' },
    { read: 'AI is assisting people, but decisions still queue behind humans.', move: 'Introduce straight-through processing on the low-complexity tail so expert time concentrates on genuine exceptions.' },
    { read: 'Agents and humans are working together across redesigned journeys.', move: 'Extend triage-and-escalate into adjacent processes such as servicing and renewals, where the same pattern applies.' },
    { read: 'Journeys are agent-native, with humans on exceptions and complex risk.', move: 'Instrument decision consistency across teams and geographies; at this maturity, variance is the remaining cost.' }
  ],
  legacy: [
    { read: 'The legacy estate is unmapped, and that is a live risk to the book.', move: 'Run AI-assisted discovery to recover intent from the code before making any modernisation commitment.' },
    { read: 'Legacy constraints are understood but undocumented, and knowledge is walking out the door.', move: 'Extract embedded rating and regulatory logic into machine-readable form while the people who understand it are still available.' },
    { read: 'Modernisation is underway but slow, and technical debt still sets your launch pace.', move: 'Move from big-bang planning to progressive increments validated against the legacy system’s actual behaviour.' },
    { read: 'Logic is being recovered and migrated incrementally with the book live.', move: 'Build a reusable attribute library so each subsequent product line costs less to migrate than the last.' },
    { read: 'The core is modernising module by module without disrupting the book.', move: 'Redirect the freed capacity into product velocity, the strategic reason modernisation was worth doing.' }
  ],
  physical: [
    { read: 'Physical risk signals are not part of how you price or settle.', move: 'Identify one line where sensor data already exists and is simply not reaching a model.' },
    { read: 'Sensor data is being collected but treated as a reporting by-product.', move: 'Engineer one feed, telematics or property IoT, into pricing as a first-class input rather than a post-hoc score.' },
    { read: 'Pilots are proving value but have not reached production pricing or claims.', move: 'Move one pilot into the live claims path, where cycle-time gains are immediate and measurable.' },
    { read: 'Physical signals are shaping pricing and accelerating claims validation.', move: 'Add digital twins on your largest commercial exposures to shift from reactive assessment to loss prevention.' },
    { read: 'Risk assessment is continuous and predictive rather than periodic.', move: 'Extend edge intelligence into product design, creating usage-based propositions competitors cannot price against.' }
  ],
  trust: [
    { read: 'There is no governance framework standing between your models and a regulator.', move: 'This is the constraint to fix first. In insurance, defensibility determines whether a model can be deployed at all.' },
    { read: 'Compliance is reviewing AI, but fairness and drift are unmonitored.', move: 'Move fairness testing into training, not sign-off, so proxy discrimination is caught before deployment.' },
    { read: 'Governance exists as a process gate rather than an engineering discipline.', move: 'Build explainability into model architecture so decisions can be justified to a commissioner without reconstruction.' },
    { read: 'Responsible AI is designed in, with monitoring and human checkpoints.', move: 'Formalise model risk committees and version-controlled audit trails to hold up under EU AI Act high-risk classification.' },
    { read: 'Trust is engineered, not retrofitted, and it is now an advantage.', move: 'Use governance maturity commercially: it is what lets you deploy AI in decisions competitors cannot touch.' }
  ]
};

/* -------------------------------------------------------------
   ARCHETYPES — the playbook's own three failure patterns,
   plus the two end states. This replaces a raw score.
   ------------------------------------------------------------- */

export const ARCHETYPES = {
  foundation: {
    key: 'foundation',
    name: 'Foundation First',
    tag: 'Groundwork before ambition',
    body: 'You are early across all six pools. That is a sequencing opportunity, not a failing. A governed foundation reaches production faster than a use case with the platform retrofitted underneath.',
    risk: 'The usual failure from here: a visible pilot for momentum, then the data underneath it will not support production.'
  },
  purgatory: {
    key: 'purgatory',
    name: 'Pilot Purgatory',
    tag: 'Proofs that never reach production',
    body: 'Feasibility is proven. The path from a working proof to a live decision in the core is not. The barrier is rarely the model. It is data readiness, governance, and getting it into an underwriter’s hands.',
    risk: 'Each pilot that stalls makes the next business case harder to fund.'
  },
  myopia: {
    key: 'myopia',
    name: 'Point-Solution Myopia',
    tag: 'Local gains that refuse to compound',
    body: 'Your process maturity is ahead of your foundation. Workflows are genuinely faster, but each tool brought its own pipeline, so value stops at the boundary of the unit that built it.',
    risk: 'Without a shared foundation the next ten use cases each cost what the first one did.'
  },
  platform: {
    key: 'platform',
    name: 'Platform Without Purpose',
    tag: 'Capability built, value unclaimed',
    body: 'You have invested ahead of the curve on strategy and data. The gap is application. The capability exists but is not yet pointed at where the economics accrue: submission to bound, FNOL to settlement.',
    risk: 'Underutilised platform investment is the hardest kind to defend at budget.'
  },
  compounding: {
    key: 'compounding',
    name: 'Enterprise Compounding',
    tag: 'Each use case makes the next cheaper',
    body: 'Foundation, application and governance are moving together, with AI as an operating model rather than a portfolio of point solutions.',
    risk: 'From here the constraint is workforce, not technology: whether underwriters trust the models enough to act on them.'
  }
};

export function classifyArchetype(scores) {
  const n = id => scores[id] / MAX_POOL_SCORE;
  const foundation = (n('strategy') + n('data')) / 2;
  const application = (n('process') + n('physical')) / 2;
  const enablement = (n('legacy') + n('trust')) / 2;
  const overall = (foundation + application + enablement) / 3;

  if (overall < 0.28) return { ...ARCHETYPES.foundation, foundation, application, enablement, overall };
  if (application - foundation > 0.18) return { ...ARCHETYPES.myopia, foundation, application, enablement, overall };
  if (foundation - application > 0.18) return { ...ARCHETYPES.platform, foundation, application, enablement, overall };
  if (overall >= 0.68 && enablement >= 0.55) return { ...ARCHETYPES.compounding, foundation, application, enablement, overall };
  return { ...ARCHETYPES.purgatory, foundation, application, enablement, overall };
}

/* -------------------------------------------------------------
   Benchmark medians are ILLUSTRATIVE placeholders — Infosys
   has not supplied benchmark data. Every surface that shows them
   must carry the provisional label. Do not present as research.
   ------------------------------------------------------------- */

export const BENCHMARK_STATUS = 'Illustrative industry benchmark · pending Infosys data';

export const BENCHMARK_MEDIAN = { strategy: 6, data: 6, process: 7, legacy: 5, physical: 4, trust: 6 };

/* -------------------------------------------------------------
   WORKFORCE ROLE EVOLUTION — verbatim structure from the
   playbook's role transformation table. Matched from job title,
   which the NFC badge already provides.
   ------------------------------------------------------------- */

export const ROLES = [
  {
    match: ['underwrit', 'risk', 'appetite'], focus: ['process', 'data', 'trust'],
    from: 'Underwriter', to: 'AI-Augmented Risk Advisor',
    change: 'Shifts from data gathering and manual risk assessment to overseeing AI-driven risk models, concentrating human judgment on the complex and novel risks where model confidence is low.'
  },
  {
    match: ['claim', 'adjust', 'loss', 'fnol'], focus: ['process', 'physical', 'data'],
    from: 'Claims Adjuster', to: 'AI-Assisted Decision Maker',
    change: 'Moves from end-to-end case management to exception handling and complex case oversight, with AI managing routine assessment, documentation and settlement.'
  },
  {
    match: ['actuar', 'pricing', 'reserv', 'model'], focus: ['data', 'trust', 'strategy'],
    from: 'Actuary', to: 'AI Model Steward',
    change: 'Evolves from building models to validating, governing and continuously improving AI pricing and reserving models, with explainability and fairness as core responsibilities.'
  },
  {
    match: ['distribut', 'sales', 'growth', 'agency', 'channel'], focus: ['data', 'process', 'strategy'],
    from: 'Distribution Manager', to: 'AI-Enabled Growth Leader',
    change: 'Gains real-time performance intelligence, AI-powered lead scoring and agent copilot tools, shifting from reactive support to proactive growth enablement.'
  },
  {
    match: ['broker', 'agent', 'advis', 'placement'], focus: ['process', 'data', 'legacy'],
    from: 'Broker / Agent', to: 'AI-Powered Advisory Partner',
    change: 'Shifts from manual quote comparison and paperwork-intensive placement to relationship-led advisory, with AI streamlining quote aggregation, risk matching and proposal creation.'
  }
];

export const ROLE_DEFAULT = {
  focus: ['strategy', 'trust', 'legacy'],
  from: 'Insurance Leader', to: 'AI Portfolio Owner',
  change: 'Accountability moves from approving individual AI initiatives to owning an operating model, where governance, value tracking and workforce readiness are the levers that determine whether AI scales.'
};

export function roleFor(title) {
  const t = (title || '').toLowerCase();
  for (const r of ROLES) if (r.match.some(m => t.includes(m))) return r;
  return ROLE_DEFAULT;
}


/* -------------------------------------------------------------
   FORECAST — five-year framing, derived from band position.
   ------------------------------------------------------------- */

export function forecast(scores) {
  const compounding = [], exposed = [], holding = [];
  for (const id of ORDER) {
    const b = bandOf(scores[id]);
    if (b >= 3) compounding.push(id);
    else if (b <= 1) exposed.push(id);
    else holding.push(id);
  }
  return { compounding, exposed, holding };
}

export const FORECAST_LINES = {
  compounding: 'Where your advantage widens. Each use case in a mature pool costs less than the last.',
  exposed: 'Where the gap grows fastest, not because it degrades, but because the benchmark moves while it stays flat.',
  holding: 'Enough capability to move, not to compound. A decision this year changes the five-year position.'
};
