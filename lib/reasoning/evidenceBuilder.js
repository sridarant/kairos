/**
 * /lib/reasoning/evidenceBuilder.js
 *
 * Converts AstroContext into a structured Evidence Graph.
 * Each node represents one astrological observation as a decision-relevant fact.
 *
 * PRINCIPLE: This module produces evidence only — no decisions, no scoring.
 * Every piece of evidence is traceable to its astronomical or astrological source.
 *
 * Evidence node shape:
 * {
 *   id:           string   — unique identifier (e.g. 'planet:Mercury:strength')
 *   source:       string   — what produced it ('planet'|'house'|'yoga'|'transit'|'panchang'|'dasha')
 *   subject:      string   — the primary subject ('Mercury', 'House 3', 'Gaja Kesari', etc.)
 *   influence:    string   — what it affects ('communication','career','decisions','caution', etc.)
 *   strength:     'strong'|'moderate'|'weak'|'very_strong'|'very_weak'
 *   quality:      'supportive'|'challenging'|'neutral'|'mixed'
 *   confidence:   'High'|'Medium'|'Low'
 *   areas:        string[] — life areas affected (career, finance, relationships, etc.)
 *   supporting:   string[] — other evidence that amplifies this
 *   opposing:     string[] — other evidence that weakens this
 *   weight:       number   — 0–1 priority weight (set by priorityEngine)
 *   metadata:     object   — raw data for language layer
 * }
 */

// Life areas each dimension maps to
const DIM_AREAS = {
  d: ['career', 'decisions', 'leadership', 'business', 'property', 'legal'],
  c: ['communication', 'relationships', 'learning', 'family', 'education'],
  f: ['health', 'spiritual', 'education', 'learning', 'medical'],
  r: ['finance', 'investments', 'travel', 'shopping', 'medical']
}

// Planet → life areas (primary significations, classical [BPHS Ch.3])
const PLANET_AREAS = {
  Sun:     ['career', 'leadership', 'father', 'authority'],
  Moon:    ['health', 'family', 'emotional', 'mother', 'mental'],
  Mars:    ['career', 'property', 'legal', 'business', 'energy'],
  Mercury: ['communication', 'learning', 'business', 'travel', 'education'],
  Jupiter: ['finance', 'education', 'spiritual', 'career', 'relationships'],
  Venus:   ['relationships', 'finance', 'shopping', 'travel', 'medical'],
  Saturn:  ['career', 'property', 'legal', 'health', 'discipline'],
  Rahu:    ['career', 'travel', 'business', 'finance'],
  Ketu:    ['spiritual', 'health', 'medical', 'mental']
}

// PSI score to strength label
function psiToStrength(psi) {
  if (psi >= 8.5) return 'very_strong'
  if (psi >= 7)   return 'strong'
  if (psi >= 4.5) return 'moderate'
  if (psi >= 2.5) return 'weak'
  return 'very_weak'
}

// Dignity to quality
function dignityToQuality(dignity) {
  if (['exalted','moolatrikona','domicile'].includes(dignity)) return 'supportive'
  if (dignity === 'debilitated') return 'challenging'
  return 'neutral'
}

/**
 * buildPlanetEvidence(astroCtx)
 * One evidence node per planet that is decision-relevant.
 * Skips planets that have no meaningful influence today (very weak + neutral).
 */
function buildPlanetEvidence(astroCtx) {
  const { grahas, psi, strengths, functionalRoles, planetHouses, dasha } = astroCtx
  const nodes = []

  for (const [name, pos] of Object.entries(grahas)) {
    if (!['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].includes(name)) continue
    const p    = psi?.[name]
    const str  = strengths?.[name]
    const role = functionalRoles?.[name]
    const house = planetHouses?.[name]
    if (!p) continue

    // Skip very weak planets in neutral roles that aren't the dasha lord — they don't materially affect decisions
    if (p.psi < 3 && role?.role === 'neutral' && name !== dasha?.currentLord) continue

    const strength = psiToStrength(p.psi)
    const quality  = dignityToQuality(str?.dignity)
    const areas    = PLANET_AREAS[name] || []

    // Functional role modifies quality
    const effectiveQuality = role?.role === 'yogakaraka' ? 'supportive'
      : role?.role === 'functional_benefic' ? 'supportive'
      : role?.role === 'functional_malefic' ? 'challenging'
      : quality

    nodes.push({
      id:        `planet:${name}`,
      source:    'planet',
      subject:   name,
      influence: name === 'Mercury' ? 'communication' : name === 'Jupiter' ? 'wisdom' :
                 name === 'Saturn'  ? 'discipline'    : name === 'Mars' ? 'action' :
                 name === 'Moon'    ? 'intuition'     : name === 'Venus' ? 'harmony' :
                 name === 'Sun'     ? 'authority'     : 'influence',
      strength,
      quality:   effectiveQuality,
      confidence: p.psi >= 7 ? 'High' : p.psi >= 4.5 ? 'Medium' : 'Low',
      areas,
      supporting: [],
      opposing:   [],
      weight:     0,  // set by priorityEngine
      metadata:   { psi: p.psi, psiLabel: p.label, dignity: str?.dignity,
                    combust: str?.combust, retrograde: str?.retrograde,
                    house, sign: pos.signName, functionalRole: role?.role,
                    dashaRelevance: name === dasha?.currentLord ? 'mahadasha'
                      : name === dasha?.currentSub ? 'antardasha' : null }
    })
  }
  return nodes
}

/**
 * buildDashaEvidence(astroCtx)
 * Current Dasha period as evidence node.
 */
function buildDashaEvidence(astroCtx) {
  const { dasha, psi, strengths, grahas } = astroCtx
  if (!dasha?.currentLord) return []
  const lord     = dasha.currentLord
  const sub      = dasha.currentSub
  const lordPSI  = psi?.[lord]?.psi || 5
  const subPSI   = psi?.[sub]?.psi  || 5
  const lordStr  = strengths?.[lord]
  const areas    = PLANET_AREAS[lord] || []

  return [{
    id:        'dasha:current',
    source:    'dasha',
    subject:   `${lord} Mahadasha / ${sub} Antardasha`,
    influence: `${lord}-${sub} life theme`,
    strength:  psiToStrength((lordPSI + subPSI) / 2),
    quality:   dignityToQuality(lordStr?.dignity) === 'supportive' ? 'supportive' : 'neutral',
    confidence: 'High',  // Dasha is always high confidence — it's computed from natal Moon
    areas,
    supporting: [],
    opposing:   [],
    weight:     0,
    metadata:   { mahadasha: lord, antardasha: sub, elapsedYears: dasha.elapsedYears,
                  remainingYears: dasha.remainingYears, lordPSI, subPSI }
  }]
}

/**
 * buildYogaEvidence(astroCtx)
 * Active yogas as evidence nodes. Only strong or medium yogas.
 */
function buildYogaEvidence(astroCtx) {
  const { yogas } = astroCtx
  if (!yogas?.length) return []
  return yogas
    .filter(y => y.strength === 'high' || y.strength === 'medium')
    .map(y => ({
      id:        `yoga:${y.name.replace(/\s+/g,'')}`,
      source:    'yoga',
      subject:   y.name,
      influence: y.name.includes('Raja') || y.name.includes('Karma') ? 'success and authority'
               : y.name.includes('Dhana') ? 'material gain'
               : y.name.includes('Kesari') ? 'wisdom and recognition'
               : y.name.includes('Aditya') ? 'intellectual clarity'
               : y.name.includes('War') || y.name === 'Graha Yuddha' ? 'conflict'
               : y.name.includes('Neecha') ? 'reversal of weakness'
               : 'beneficial combination',
      strength:  y.strength === 'high' ? 'strong' : 'moderate',
      quality:   y.name === 'Graha Yuddha' ? 'challenging' : 'supportive',
      confidence: y.strength === 'high' ? 'High' : 'Medium',
      areas:     y.name.includes('Dhana') ? ['finance','investments','business']
               : y.name.includes('Karma') ? ['career','business','leadership']
               : y.name.includes('Aditya') ? ['communication','learning','education']
               : y.name.includes('Kesari') ? ['education','career','spiritual']
               : ['career','decisions'],
      supporting: y.planets || [],
      opposing:   [],
      weight:     0,
      metadata:   { description: y.description, planets: y.planets, yogaStrength: y.strength }
    }))
}

/**
 * buildPanchangEvidence(astroCtx)
 * Tithi, Nakshatra, and Vara as evidence nodes.
 */
function buildPanchangEvidence(astroCtx) {
  const { panchang, tithiEffect, nakshatraEffect, varaEffect } = astroCtx
  const nodes = []

  // Tithi
  const tithi = panchang?.tithi
  if (tithi) {
    const tq = (tithiEffect?.d || 0) > 0 ? 'supportive' : (tithiEffect?.r || 0) > 0 ? 'challenging' : 'neutral'
    nodes.push({
      id: 'panchang:tithi', source: 'panchang', subject: `Tithi ${tithi.number} — ${tithi.name}`,
      influence: tq === 'supportive' ? 'auspicious timing' : tq === 'challenging' ? 'caution advised' : 'neutral timing',
      strength: Math.abs(tithiEffect?.d||0) >= 2 ? 'strong' : Math.abs(tithiEffect?.d||0) >= 1 ? 'moderate' : 'weak',
      quality: tq, confidence: 'High',
      areas: tq === 'supportive' ? ['decisions','career','business'] : ['caution'],
      supporting: [], opposing: [], weight: 0,
      metadata: { tithiName: tithi.name, tithiPhase: tithi.phase, effect: tithiEffect }
    })
  }

  // Nakshatra
  const nak = panchang?.nakshatra
  if (nak) {
    const nq = (nakshatraEffect?.d||0) > 0 || (nakshatraEffect?.c||0) > 0 ? 'supportive'
             : (nakshatraEffect?.r||0) > 1 ? 'challenging' : 'neutral'
    nodes.push({
      id: 'panchang:nakshatra', source: 'panchang', subject: `${nak.name} Nakshatra`,
      influence: nakshatraEffect?.label || 'daily astro influence',
      strength: Math.abs(nakshatraEffect?.d||0) + Math.abs(nakshatraEffect?.c||0) >= 2 ? 'strong' : 'moderate',
      quality: nq, confidence: 'High',
      areas: nq === 'supportive' ? ['decisions','communication'] : ['caution'],
      supporting: [], opposing: [], weight: 0,
      metadata: { name: nak.name, pada: nak.pada, lord: nak.lord, effect: nakshatraEffect }
    })
  }

  // Vara (weekday planet)
  const vara = panchang?.vara
  if (vara) {
    nodes.push({
      id: 'panchang:vara', source: 'panchang', subject: `${vara} Vara (day ruler)`,
      influence: `${vara} shapes the quality of the day`,
      strength: 'moderate', quality: 'neutral', confidence: 'High',
      areas: PLANET_AREAS[vara] || [],
      supporting: [], opposing: [], weight: 0,
      metadata: { varaPlanet: vara, effect: varaEffect }
    })
  }

  return nodes
}

/**
 * buildTransitEvidence(astroCtx)
 * Current transits that materially affect decisions.
 */
function buildTransitEvidence(astroCtx) {
  const { transitContext } = astroCtx
  if (!transitContext?.effects?.length) return []
  return transitContext.effects
    .filter(e => e.quality !== 'neutral')
    .map(e => ({
      id:        `transit:${e.planet}:${e.quality}`,
      source:    'transit',
      subject:   `${e.planet} transit`,
      influence: e.description,
      strength:  e.quality === 'sade_sati' ? 'strong' : 'moderate',
      quality:   e.quality === 'supportive' ? 'supportive' : 'challenging',
      confidence: e.quality === 'sade_sati' ? 'High' : 'Medium',
      areas:     PLANET_AREAS[e.planet] || [],
      supporting: [], opposing: [], weight: 0,
      metadata:   { planet: e.planet, note: e.note, houseFromMoon: e.houseFromMoon }
    }))
}

/**
 * buildEvidenceGraph(astroCtx)
 * Master function — returns the complete evidence graph.
 *
 * @param {object} astroCtx — from lib/astrology/index.buildAstroContext()
 * @returns EvidenceNode[]
 */
export function buildEvidenceGraph(astroCtx) {
  const nodes = [
    ...buildPlanetEvidence(astroCtx),
    ...buildDashaEvidence(astroCtx),
    ...buildYogaEvidence(astroCtx),
    ...buildPanchangEvidence(astroCtx),
    ...buildTransitEvidence(astroCtx)
  ]

  // Cross-reference: identify supporting/opposing relationships
  for (const node of nodes) {
    for (const other of nodes) {
      if (other.id === node.id) continue
      // Same quality = supporting
      if (other.quality === node.quality && other.quality !== 'neutral') {
        if (node.areas.some(a => other.areas.includes(a))) {
          node.supporting.push(other.id)
        }
      }
      // Opposing quality and overlapping areas = conflict
      if ((other.quality === 'challenging' && node.quality === 'supportive') ||
          (other.quality === 'supportive'  && node.quality === 'challenging')) {
        if (node.areas.some(a => other.areas.includes(a))) {
          node.opposing.push(other.id)
        }
      }
    }
  }

  return nodes
}
