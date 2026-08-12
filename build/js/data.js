/* =============================================================
   UNLOCK AI VALUE — CONTENT MODEL
   Every claim, figure and platform name in this file is traceable to:
     - Playbook-Unlock_AI_Value- INS-AA-Aug10.docx
     - AI Use Cases Insurance - Jul 28.xlsx
   Anything not in those sources is marked PENDING. Do not invent.
   ============================================================= */

export const POOLS = [
  {
    id: 'strategy',
    index: 0,
    name: 'AI Strategy & Engineering',
    lines: ['AI STRATEGY', '& ENGINEERING'],
    verb: 'Orchestrate',
    color: 0x7B61FF,
    hex: '#7B61FF',
    blurb: 'Establish the foundations to scale AI across the enterprise — strategy, platform, architecture, and the cost discipline that keeps it sustainable.',
    challenge: 'AI initiatives are built inside individual lines of business, each with its own pilots, vendors and architectures. A P&C claims model cannot share infrastructure with a life underwriting model. And as AI scales from pilot to production, token and inference cost becomes a significant, often unpredictable operating expense — one that can outpace the value it creates if left ungoverned.',
    approach: 'A clear AI vision anchored to insurance outcomes — combined ratio, underwriting accuracy, claims cycle time, retention — made durable through an enterprise AI operating model. AI-first architectures unify data, models and infrastructure, integrating Topaz Fabric for Insurance and Insurance Genome with core systems like Guidewire. Cost-aware architecture and AI FinOps treat token consumption as a first-class design decision.',
    value: [
      'A unified, enterprise-wide AI operating model',
      'Faster scaling across underwriting, claims and distribution',
      'Reduced duplication across the technology estate'
    ]
  },
  {
    id: 'data',
    index: 1,
    name: 'Data for AI',
    lines: ['DATA FOR AI'],
    verb: 'Trust',
    color: 0x007CC3,
    hex: '#007CC3',
    blurb: 'Convert decades of policy, claims, actuarial and document data into a trusted, audit-ready asset that AI can actually use.',
    challenge: 'A single commercial P&C account might have underwriting data in one system, claims history in another, and broker correspondence sitting in unstructured PDFs nobody has indexed. Without a trusted, AI-ready foundation, even well-built models produce unreliable outputs — underwriting scores that do not hold up to audit, claims triage that misses fraud patterns, pricing that embeds hidden bias.',
    approach: 'AI-ready data platforms purpose-built for insurance data models. Data fingerprinting for full lineage and audit trail — critical for demonstrating to a regulator exactly which data fed which decision. Synthetic data generation to train and stress-test on realistic scenarios without exposing policyholder PII or PHI. Insurance Genome structures entity relationships across claimants, brokers, properties and coverage lines.',
    value: [
      'Audit-ready data foundations for NAIC, state DOIs and IFRS 17',
      'Faster model training using synthetic data on sensitive scenarios',
      'Improved accuracy in pricing, underwriting and fraud models'
    ]
  },
  {
    id: 'process',
    index: 2,
    name: 'Process AI',
    lines: ['PROCESS AI'],
    verb: 'Redesign',
    color: 0x00A9A5,
    hex: '#00A9A5',
    blurb: 'Redesign end-to-end insurance workflows around AI agents working alongside underwriters and adjusters — not automation bolted onto an unchanged process.',
    challenge: 'Automation to date has often stopped at task-level RPA. A commercial underwriter still spends hours pulling loss runs and cross-referencing risk appetite before issuing a quote. An adjuster still juggles FNOL intake, coverage verification and reserve-setting across three disconnected systems. The result is faster individual steps inside a process that is still fundamentally slow.',
    approach: 'Domain-aware agents trained on insurance-specific context — line-of-business rules, coverage logic, regulatory requirements, historical claims patterns — working alongside human experts rather than replacing their judgment. In underwriting: pre-filled risk assessments, exposure concentration flags, comparable risks surfaced. In claims: FNOL triaged by severity, coverage verified automatically, fraud indicators flagged, straightforward claims fast-tracked and complex ones escalated.',
    value: [
      'Reduced claims cycle time and lower loss adjustment expense',
      'More consistent underwriting decisions at scale',
      'Improved combined ratio through faster end-to-end processing'
    ]
  },
  {
    id: 'legacy',
    index: 3,
    name: 'Agentic Legacy Modernization',
    lines: ['AGENTIC LEGACY', 'MODERNIZATION'],
    verb: 'Unlock',
    color: 0x3F6BE5,
    hex: '#3F6BE5',
    blurb: 'Turn agentic AI on the legacy estate — reverse-engineer the intent buried in decades-old code and modernize progressively while the book stays live.',
    challenge: 'Core policy administration holds rating algorithms built up over decades of state filings, underwriting guidelines encoded into undocumented business rules, and regulatory logic few current employees fully understand because the people who built it have long since left. Full replacement can take years and puts an entire book of business at risk during cutover. Standing still limits every new product launch.',
    approach: 'AI agents reverse-engineer the existing estate to recover business intent — rating logic, underwriting rules, filing requirements, exception handling built up over years of edge cases. That intent drives progressive modernization: extracting and documenting rating engines, migrating logic to modern cores like Guidewire incrementally, reducing technical debt module by module, validating each step against the legacy system’s actual behaviour before cutover.',
    value: [
      'Reduced technical debt on core policy, billing and claims platforms',
      'Faster, lower-risk migration to modern cores like Guidewire',
      'Agility to launch products and respond to regulatory change'
    ]
  },
  {
    id: 'physical',
    index: 4,
    name: 'Physical AI',
    lines: ['PHYSICAL AI'],
    verb: 'Sense',
    color: 0xC2569F,
    hex: '#C2569F',
    blurb: 'Risk signals increasingly originate outside the enterprise. Engineer telematics, IoT, drones and digital twins into pricing and claims as core inputs.',
    challenge: 'Telematics streams driving behaviour continuously. IoT sensors monitor water and structural integrity in commercial property. Drones capture post-catastrophe condition faster than an adjuster can drive to site. Yet most carriers still treat this as a bolt-on — a telematics score added after the fact, drone imagery reviewed manually alongside a paper claim file — rather than a core input engineered into pricing from the start.',
    approach: 'AI embedded directly into the devices and sensor networks carriers rely on, so they interpret risk and trigger action rather than only collecting data. Digital twins of insured commercial properties and fleets let risk engineers model exposure and simulate loss before it happens. Drone and robotics-assisted inspection validates catastrophe damage in hours instead of weeks. Edge intelligence enables usage-based pricing that updates continuously rather than at renewal.',
    value: [
      'Real-time, usage-based pricing across auto, property and specialty',
      'Faster claims validation through sensor and drone data',
      'Proactive loss prevention reducing claims frequency and severity'
    ]
  },
  {
    id: 'trust',
    index: 5,
    name: 'AI Trust',
    lines: ['AI TRUST'],
    verb: 'Assure',
    color: 0x14ADE0,
    hex: '#14ADE0',
    blurb: 'Bias, explainability and regulatory defensibility designed in from the start — because insurance decisions have to hold up when a commissioner asks how they were made.',
    challenge: 'The NAIC model bulletin on the use of AI, a growing patchwork of state-level regulation, and the EU AI Act’s high-risk classification for insurance pricing and underwriting all require carriers to demonstrate that AI decisions are fair, explainable and auditable — by design, not after the fact. A model that cannot explain why a premium was set, or why a claim was declined, is not deployable regardless of its technical accuracy.',
    approach: 'Bias detection and fairness testing during data collection and model training, so underwriting and pricing variables do not encode proxy discrimination. Explainability built into model architecture. Model risk committees, documented approval workflows and version-controlled audit trails. Continuous monitoring for drift, degradation and emerging bias, paired with human-in-the-loop checkpoints on high-stakes decisions.',
    value: [
      'Demonstrable compliance with NAIC, EU AI Act and GDPR',
      'Bias risk in pricing models validated before deployment',
      'Lower litigation and reputational exposure'
    ]
  }
];

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
    { read: 'There is no mechanism deciding where AI investment goes.', move: 'Start with an AI vision anchored to two or three insurance outcomes you already report on — combined ratio, claims cycle time, retention — and one governed intake process.' },
    { read: 'Individual teams are experimenting, but nothing compounds beyond a business unit.', move: 'Establish an enterprise AI operating model with shared governance and value tracking so the second use case is cheaper than the first.' },
    { read: 'Direction exists, but architecture and cost still fragment by line of business.', move: 'Consolidate onto a shared engineering platform and make token consumption a design decision, not an invoice surprise.' },
    { read: 'A real operating model is in place and use cases replicate across LOBs.', move: 'Add AI FinOps discipline — right-size models per task and route simple requests to smaller models to protect unit economics as volume grows.' },
    { read: 'You are running an AI factory: governed intake, shared platform, tracked value.', move: 'Push into AI-assisted delivery on the core estate itself, where the largest remaining engineering cost sits.' }
  ],
  data: [
    { read: 'Data is not in a state any production model could rely on.', move: 'Begin with one AI-ready data product for a single high-value journey rather than an enterprise-wide programme.' },
    { read: 'Data exists but reaching it is slow, manual and unevidenced.', move: 'Index the unstructured estate — loss runs, treaties, adjuster notes — and instrument lineage from day one.' },
    { read: 'Structured data is workable; unstructured content and audit trail are the gap.', move: 'Add automated extraction and data fingerprinting so a regulator can be shown exactly which data drove a decision.' },
    { read: 'A unified, governed foundation is serving models across lines of business.', move: 'Introduce synthetic data to train on sensitive underwriting and claims scenarios without exposing PII or PHI.' },
    { read: 'Data is a genuine strategic asset: unified, lineage-tracked, queryable.', move: 'Use entity structuring across claimants, brokers and properties to unlock fraud and portfolio signals that single-record views cannot see.' }
  ],
  process: [
    { read: 'Core workflows are manual end to end.', move: 'Pick one journey — pre-bind submission or FNOL — and map it fully before automating any part of it.' },
    { read: 'Automation exists at the task level and the journey is unchanged.', move: 'Shift the unit of redesign from task to journey. Task-level RPA cannot produce the step-change that justifies the investment.' },
    { read: 'AI is assisting people, but decisions still queue behind humans.', move: 'Introduce straight-through processing on the low-complexity tail so expert time concentrates on genuine exceptions.' },
    { read: 'Agents and humans are working together across redesigned journeys.', move: 'Extend triage-and-escalate into adjacent processes — servicing and renewals — where the same pattern applies.' },
    { read: 'Journeys are agent-native, with humans on exceptions and complex risk.', move: 'Instrument decision consistency across teams and geographies; at this maturity, variance is the remaining cost.' }
  ],
  legacy: [
    { read: 'The legacy estate is unmapped, and that is a live risk to the book.', move: 'Run AI-assisted discovery to recover intent from the code before making any modernisation commitment.' },
    { read: 'Legacy constraints are understood but undocumented, and knowledge is walking out the door.', move: 'Extract embedded rating and regulatory logic into machine-readable form while the people who understand it are still available.' },
    { read: 'Modernisation is underway but slow, and technical debt still sets your launch pace.', move: 'Move from big-bang planning to progressive increments validated against the legacy system’s actual behaviour.' },
    { read: 'Logic is being recovered and migrated incrementally with the book live.', move: 'Build a reusable attribute library so each subsequent product line costs less to migrate than the last.' },
    { read: 'The core is modernising module by module without disrupting the book.', move: 'Redirect the freed capacity into product velocity — the strategic reason modernisation was worth doing.' }
  ],
  physical: [
    { read: 'Physical risk signals are not part of how you price or settle.', move: 'Identify one line where sensor data already exists and is simply not reaching a model.' },
    { read: 'Sensor data is being collected but treated as a reporting by-product.', move: 'Engineer one feed — telematics or property IoT — into pricing as a first-class input rather than a post-hoc score.' },
    { read: 'Pilots are proving value but have not reached production pricing or claims.', move: 'Move one pilot into the live claims path, where cycle-time gains are immediate and measurable.' },
    { read: 'Physical signals are shaping pricing and accelerating claims validation.', move: 'Add digital twins on your largest commercial exposures to shift from reactive assessment to loss prevention.' },
    { read: 'Risk assessment is continuous and predictive rather than periodic.', move: 'Extend edge intelligence into product design — usage-based propositions competitors cannot price against.' }
  ],
  trust: [
    { read: 'There is no governance framework standing between your models and a regulator.', move: 'This is the constraint to fix first. In insurance, defensibility determines whether a model can be deployed at all.' },
    { read: 'Compliance is reviewing AI, but fairness and drift are unmonitored.', move: 'Move fairness testing into training, not sign-off, so proxy discrimination is caught before deployment.' },
    { read: 'Governance exists as a process gate rather than an engineering discipline.', move: 'Build explainability into model architecture so decisions can be justified to a commissioner without reconstruction.' },
    { read: 'Responsible AI is designed in, with monitoring and human checkpoints.', move: 'Formalise model risk committees and version-controlled audit trails to hold up under EU AI Act high-risk classification.' },
    { read: 'Trust is engineered, not retrofitted — and it is now an advantage.', move: 'Use governance maturity commercially: it is what lets you deploy AI in decisions competitors cannot touch.' }
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
    body: 'Across all six value pools you are early. That is not a failing — it is a sequencing opportunity. Carriers who start with a governed foundation reach production faster than those who start with a use case and retrofit the platform underneath it.',
    risk: 'The most common failure from here is launching a visible pilot to build momentum, then discovering the data and governance underneath it cannot support production.'
  },
  purgatory: {
    key: 'purgatory',
    name: 'Pilot Purgatory',
    tag: 'Proofs that never reach production',
    body: 'You have demonstrated technical feasibility. What you have not yet built is the path from a working proof to a live decision in the core. The barrier is rarely the model — it is data readiness, governance, or the change management to put it in an underwriter’s hands.',
    risk: 'Every additional pilot that does not reach production makes the next business case harder to fund.'
  },
  myopia: {
    key: 'myopia',
    name: 'Point-Solution Myopia',
    tag: 'Local gains that refuse to compound',
    body: 'Your process maturity is ahead of your foundation. Individual workflows are genuinely faster, but each tool brought its own pipeline and its own governance, so value is capped at the boundary of the business unit that built it.',
    risk: 'The next ten use cases will each cost roughly what the first one did. Without a shared foundation, there is no flywheel.'
  },
  platform: {
    key: 'platform',
    name: 'Platform Without Purpose',
    tag: 'Capability built, value unclaimed',
    body: 'You have invested ahead of the curve on strategy and data. The gap is application — the capability exists but has not been pointed at the workflows where insurance economics actually accrue: submission to bound policy, FNOL to settlement.',
    risk: 'Underutilised platform investment is the hardest kind to defend at the next budget cycle.'
  },
  compounding: {
    key: 'compounding',
    name: 'Enterprise Compounding',
    tag: 'Each use case makes the next cheaper',
    body: 'Foundation, application and governance are moving together. This is the state the playbook describes as the goal: AI as an enterprise operating model rather than a portfolio of point solutions.',
    risk: 'At this maturity the binding constraint shifts from technology to workforce — whether underwriters trust the models enough to act on them.'
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
   SECTORS. Peer medians are ILLUSTRATIVE placeholders — Infosys
   has not supplied benchmark data. Every surface that shows them
   must carry the provisional label. Do not present as research.
   ------------------------------------------------------------- */

export const BENCHMARK_STATUS = 'Illustrative peer median · pending Infosys data';

export const SECTORS = [
  {
    id: 'pc', name: 'Property & Casualty', sub: 'Commercial and personal lines',
    median: { strategy: 6, data: 6, process: 7, legacy: 5, physical: 6, trust: 6 }
  },
  {
    id: 'life', name: 'Life & Annuities', sub: 'Individual, retirement and long-term care',
    median: { strategy: 6, data: 6, process: 6, legacy: 4, physical: 2, trust: 7 }
  },
  {
    id: 'group', name: 'Group & Benefits', sub: 'Dental, vision, disability and group life',
    median: { strategy: 5, data: 6, process: 7, legacy: 5, physical: 2, trust: 6 }
  },
  {
    id: 'reins', name: 'Reinsurance & Specialty', sub: 'Treaty, facultative, E&S and workers’ comp',
    median: { strategy: 7, data: 7, process: 6, legacy: 5, physical: 5, trust: 6 }
  }
];

/* -------------------------------------------------------------
   WORKFORCE ROLE EVOLUTION — verbatim structure from the
   playbook's role transformation table. Matched from job title,
   which the NFC badge already provides.
   ------------------------------------------------------------- */

export const ROLES = [
  {
    match: ['underwrit', 'risk', 'appetite'],
    from: 'Underwriter', to: 'AI-Augmented Risk Advisor',
    change: 'Shifts from data gathering and manual risk assessment to overseeing AI-driven risk models — concentrating human judgment on the complex and novel risks where model confidence is low.'
  },
  {
    match: ['claim', 'adjust', 'loss', 'fnol'],
    from: 'Claims Adjuster', to: 'AI-Assisted Decision Maker',
    change: 'Moves from end-to-end case management to exception handling and complex case oversight, with AI managing routine assessment, documentation and settlement.'
  },
  {
    match: ['actuar', 'pricing', 'reserv', 'model'],
    from: 'Actuary', to: 'AI Model Steward',
    change: 'Evolves from building models to validating, governing and continuously improving AI pricing and reserving models — with explainability and fairness as core responsibilities.'
  },
  {
    match: ['distribut', 'sales', 'growth', 'agency', 'channel'],
    from: 'Distribution Manager', to: 'AI-Enabled Growth Leader',
    change: 'Gains real-time performance intelligence, AI-powered lead scoring and agent copilot tools — shifting from reactive support to proactive growth enablement.'
  },
  {
    match: ['broker', 'agent', 'advis', 'placement'],
    from: 'Broker / Agent', to: 'AI-Powered Advisory Partner',
    change: 'Shifts from manual quote comparison and paperwork-intensive placement to relationship-led advisory, with AI streamlining quote aggregation, risk matching and proposal creation.'
  }
];

export const ROLE_DEFAULT = {
  from: 'Insurance Leader', to: 'AI Portfolio Owner',
  change: 'Accountability moves from approving individual AI initiatives to owning an operating model — where governance, value tracking and workforce readiness are the levers that determine whether AI scales.'
};

export function roleFor(title) {
  const t = (title || '').toLowerCase();
  for (const r of ROLES) if (r.match.some(m => t.includes(m))) return r;
  return ROLE_DEFAULT;
}

/* -------------------------------------------------------------
   CASE STUDIES — real engagements only.
   Physical AI and AI Trust have no case study in either source
   document. `pending: true` makes that visible rather than
   filling the gap with invented content.
   ------------------------------------------------------------- */

export const CASES = {
  strategy: {
    client: 'US insurance carrier',
    detail: 'Workers’ compensation, E&S and reinsurance specialist',
    title: 'AI strategy and AI centre of excellence',
    challenge: 'Fragmented AI initiatives across business functions with no unified strategy, governance or technology direction, and no structured way to evaluate and prioritise use cases.',
    approach: 'Defined AI technology enablers and target stack, designed the target AI reference architecture, and built a use case evaluation methodology scoring technical feasibility, business alignment and implementation complexity.',
    results: ['AI blueprint with target architecture and prioritised roadmap', '150+ AI opportunities identified and prioritised']
  },
  data: {
    client: 'Global reinsurer',
    detail: 'Proof of concept — NATCAT exposure assessment',
    title: 'Treaty digitization and peril intelligence',
    challenge: 'Decades of treaty wordings, schedules and peril coverage dispersed across scanned files and disconnected repositories, making exposure assessment slow and reactive.',
    approach: 'Digitized treaty contracts into a structured searchable layer using Document AI and Neural Connect, layered natural-language querying on top, and connected exposure assessment to near real-time predictive modelling.',
    results: ['100% digitization of reinsurance treaty contracts', 'Proactive identification of perils', 'Real-time NATCAT integration for impact assessment', 'Leadership dashboards showing potential loss exposure']
  },
  process: {
    client: 'Allied World',
    detail: 'Pre-bind underwriting, AI Next platform',
    title: 'AI-powered underwriting workbench',
    challenge: 'Underwriters spent one to two hours per submission simply qualifying whether it held enough detail to proceed. First-response rates sat at 40%, and 30–40% of underwriting time went to non-core administrative work.',
    approach: 'End-to-end orchestration of submission processing, submission prioritisation and auto-decline models, IGO/NIGO classification, third-party enrichment for business classification, and a digital observer layer sensing further automation by line of business.',
    results: ['Request-to-bind ratio increased 50%', 'Gross written premium up an additional 10%', 'Request-to-decline ratio reduced 25%', 'Manual effort reduced 50%', 'Underwriting operations TCO reduced 50%']
  },
  legacy: {
    client: 'MassMutual',
    detail: 'US life insurer — Oracle Life (OPAS) migration',
    title: 'AI-driven requirement extraction for policy migration',
    challenge: 'Product specifications scattered across 1,132 functional documents spanning roughly 9,100 pages, with requirement extraction entirely manual and dependent on scarce SME bandwidth.',
    approach: 'Infosys Policy Migration Solution (IPMS) industrialised extraction — a prompt library for attribute-specific retrieval across functional areas, generated sub-functionality outputs, and BRS documents produced against the client template with F1 and missing-rate KPIs tracked throughout.',
    results: ['Extraction across 1,132 documents / ~9,100 pages', 'F1 score of 99.2%', 'BRS time-to-create cut by over 50%', 'BRS for 15 functionalities in 12 weeks — 81.25% effort saving', 'Reusable library of 2.7K attributes for future migrations']
  },
  physical: {
    pending: true,
    note: 'The playbook’s Physical AI section carries an unfilled case study placeholder, and the use case register has no Physical AI entry. Infosys to supply.',
    fallback: 'Where sensor data reaches pricing as a first-class input rather than a post-hoc score, carriers move from periodic to continuous risk assessment — pricing that updates between renewals, and catastrophe damage validated in hours instead of weeks.'
  },
  trust: {
    substitute: true,
    client: 'Ameritas',
    detail: 'Multiline insurer — risk and compliance function',
    title: 'AI-first risk and compliance reimagination',
    note: 'Substituted from the use case register. The playbook’s AI Trust section carries an unfilled case study placeholder — Infosys to supply a dedicated one.',
    challenge: 'Teams spent significant time pulling evidence from multiple systems. Regulatory responses and filing language were inconsistently standardised, and manual rules created false positives that added analyst effort.',
    approach: 'An AI-first risk and compliance operating model consolidating enterprise risk data for continuous risk scoring, automating evidence compilation, control testing, regulatory change review and filing preparation — keeping human experts on interpretation, high-risk exceptions and model oversight.',
    results: ['30% productivity improvement across risk and compliance review', 'Faster regulatory response cycles', 'Improved fraud and privacy risk detection', 'Better audit readiness through explainable, standardised documentation']
  }
};

/* -------------------------------------------------------------
   DEMO PERSONAS for the NFC badge simulation.
   Fictional people at fictional carriers — deliberately not real
   companies, so nothing implies a real carrier endorsed this.
   ------------------------------------------------------------- */

export const PERSONAS = [
  { id: 'p1', name: 'Amara Whitfield', title: 'VP, Claims Strategy', org: 'Northmark Mutual', initials: 'AW', email: 'a.whitfield@northmark.example' },
  { id: 'p2', name: 'Ellis Nakamura', title: 'Head of Underwriting', org: 'Coastwise Specialty', initials: 'EN', email: 'e.nakamura@coastwise.example' },
  { id: 'p3', name: 'Priya Raghavan', title: 'Chief Actuary', org: 'Halden Life', initials: 'PR', email: 'p.raghavan@haldenlife.example' },
  { id: 'p4', name: 'Tomas Berge', title: 'Director, Distribution', org: 'Aldergate Group', initials: 'TB', email: 't.berge@aldergate.example' }
];

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
  compounding: 'Left on its current trajectory, this is where your advantage widens. Each use case in a mature pool costs less than the last.',
  exposed: 'On a five-year view this is where the gap grows fastest — not because it degrades, but because peers compound while it stays flat.',
  holding: 'Enough capability to move, not enough to compound. These are the pools where a decision this year changes the five-year position.'
};
