// /lib/decision/explanation.js
// Generates human-readable explanations from astro signals.
// Every explanation answers: Why? in one clear sentence.

const PLANET_EFFECT = {
  Sun:     'clarity and decisiveness are amplified',
  Moon:    'intuition and emotional sensitivity are heightened',
  Mars:    'bold action is favoured, though risk is elevated',
  Mercury: 'communication and analytical thinking are at their sharpest',
  Jupiter: 'wisdom and expansive thinking support confident decisions',
  Venus:   'collaboration, harmony, and dialogue flow easily',
  Saturn:  'discipline and patience yield better results than impulse',
  Rahu:    'ambition runs high — opportunities are magnified but require caution',
  Ketu:    'reflection and inner clarity are favoured over external action'
}

const NAKSHATRA_EFFECT = {
  Ashwini:'swift initiative is supported',     Bharani:'transformation is favoured',
  Krittika:'purifying clarity cuts through confusion', Rohini:'creativity and growth flow naturally',
  Mrigashira:'curiosity and exploration are highlighted', Ardra:'deep transformation, expect volatility',
  Punarvasu:'renewal and hopeful beginnings are auspicious', Pushya:'nourishment, stability, and calm prevail',
  Ashlesha:'penetrating insight is available, watch for complexity',
  Magha:'authority and bold decisions are supported',
  'Purva Phalguni':'pleasure, creative energy, and rest are favoured',
  'Uttara Phalguni':'reliability and cooperative effort yield results',
  Hasta:'skilled, dexterous work produces excellent results',
  Chitra:'brilliant creativity and beauty are highlighted',
  Swati:'independence and flexibility are your strengths today',
  Vishakha:'purposeful, goal-oriented action is strongly favoured',
  Anuradha:'devotion, cooperation, and persistence pay off',
  Jyeshtha:'personal power and authority are accessible',
  Mula:'deep investigation and root-cause analysis are favoured',
  'Purva Ashadha':'invincible confidence — begin important endeavours',
  'Uttara Ashadha':'lasting victories come through persistent, focused effort',
  Shravana:'listening, learning, and connecting with others are highlighted',
  Dhanishta:'prosperity and musical, rhythmic work are supported',
  Shatabhisha:'healing, deep research, and solitary focus are optimal',
  'Purva Bhadra':'fierce transformation and intense focus are available',
  'Uttara Bhadra':'deep stability and spiritual grounding are present',
  Revati:'compassion, completion, and transcendent thinking are favoured'
}

const TITHI_EFFECT = {
  Pratipada:'new beginnings and fresh starts are auspicious',
  Panchami:'growth and momentum build steadily',
  Dashami:'peak energy — full force is available for important actions',
  Declining:'caution and review are wiser than new initiatives',
  Closing:'completion and consolidation rather than new beginnings'
}

/**
 * buildWhyExplanation: produce a single, natural sentence explaining today's signal.
 */
export function buildWhyExplanation({ planetName, nakshatraName, tithiPhase, dominantDim, chartNote }) {
  const parts = []

  if (planetName && PLANET_EFFECT[planetName]) {
    parts.push(`${planetName} ensures ${PLANET_EFFECT[planetName]}`)
  }
  if (nakshatraName && NAKSHATRA_EFFECT[nakshatraName]) {
    parts.push(NAKSHATRA_EFFECT[nakshatraName])
  }
  if (tithiPhase && TITHI_EFFECT[tithiPhase]) {
    parts.push(TITHI_EFFECT[tithiPhase])
  }
  if (chartNote) parts.push(chartNote)

  if (parts.length === 0) return 'Planetary alignment supports your focus today.'
  if (parts.length === 1) return `${parts[0][0].toUpperCase()}${parts[0].slice(1)}.`

  // Combine first two; add third as a clause if short enough
  const main = `${parts[0][0].toUpperCase()}${parts[0].slice(1)}, while ${parts[1]}.`
  return main
}

/**
 * buildCategoryExplanation: produce a Why sentence for a specific life category.
 */
export function buildCategoryExplanation(category, dims, planetName, nakshatraName) {
  const DIM = { career:'d', money:'r', relationships:'c', health:'f', learning:'f',
    travel:'d', spiritual:'f', home:'f', family:'c', shopping:'r', medical:'f' }
  const primary = DIM[category] || 'd'

  const catContext = {
    career:       'for career advancement and goal pursuit',
    money:        'for financial decisions and resource management',
    relationships:'for relationships and meaningful conversations',
    health:       'for health, recovery, and physical well-being',
    learning:     'for study, skill-building, and intellectual work',
    travel:       'for travel planning and movement',
    spiritual:    'for meditation, prayer, and inner reflection',
    home:         'for home matters, renovation, and family life',
    family:       'for family activities and bonding',
    shopping:     'for purchases and acquisitions',
    medical:      'for medical consultations and health decisions'
  }

  const ctx = catContext[category] || 'for this area'
  const dimScore = dims?.[primary] || 0

  let sentiment = 'Conditions are moderate'
  if (dimScore > 1.0) sentiment = 'Conditions are strongly favourable'
  else if (dimScore > 0.3) sentiment = 'Conditions are supportive'
  else if (dimScore < -0.5) sentiment = 'Conditions suggest caution'

  const astro = planetName && PLANET_EFFECT[planetName]
    ? ` ${planetName} ${PLANET_EFFECT[planetName]}.`
    : ''

  return `${sentiment} ${ctx}.${astro}`
}

/**
 * resolveConflict: when signals conflict, produce balanced guidance.
 * Example: strong Moon but weak Saturn → "Good for communication, but avoid irreversible commitments."
 */
export function resolveConflict(strongDims, weakDims) {
  if (!strongDims.length && !weakDims.length) return null

  const positive = {
    d: 'decision-making conditions are favourable',
    c: 'communication flows well',
    f: 'focus and concentration are supported'
  }
  const negative = {
    r: 'risk is elevated — avoid impulsive or irreversible commitments',
    d: 'decision clarity is reduced — seek more information first',
    c: 'communication may be misunderstood — choose words carefully',
    f: 'sustained focus may be difficult — work in shorter sessions'
  }

  const pros = strongDims.map(d => positive[d]).filter(Boolean)
  const cons = weakDims.map(d => negative[d]).filter(Boolean)

  if (pros.length && cons.length) {
    return `${pros[0][0].toUpperCase()}${pros[0].slice(1)}, but ${cons[0]}.`
  }
  if (pros.length) return `${pros[0][0].toUpperCase()}${pros[0].slice(1)}.`
  if (cons.length) return `${cons[0][0].toUpperCase()}${cons[0].slice(1)}.`
  return null
}
