/**
 * /lib/reasoning/priorityEngine.js
 *
 * Assigns priority weights to evidence nodes.
 * Not all evidence is equally decision-relevant.
 *
 * Priority factors:
 *   1. Planetary Strength (PSI) — strong planets carry more weight
 *   2. Dasha Relevance — current Dasha lord = highest influence
 *   3. House Relevance — 1st, 5th, 9th, 10th most decision-relevant
 *   4. Source Importance — Dasha > transit > yoga > planet > panchang
 *   5. Yoga Significance — Raja/Dharma Karma > Dhana > others
 *   6. Functional Role — Yogakaraka > benefic > neutral > malefic
 *
 * Returns evidence nodes with weight 0–1 applied.
 */

const SOURCE_BASE_WEIGHT = {
  dasha:    0.85,
  transit:  0.75,
  yoga:     0.70,
  planet:   0.60,
  panchang: 0.50
}

const YOGA_IMPORTANCE = {
  'Raja Yoga':                   0.95,
  'Dharma Karma Adhipati Yoga':  0.95,
  'Gaja Kesari Yoga':            0.88,
  'Neecha Bhanga Raja Yoga':     0.92,
  'Panchamahapurusha':           0.90,  // Ruchaka, Bhadra, Hamsa, Malavya, Sasa
  'Hamsa Yoga':                  0.90,
  'Ruchaka Yoga':                0.88,
  'Bhadra Yoga':                 0.88,
  'Malavya Yoga':                0.88,
  'Sasa Yoga':                   0.88,
  'Adhi Yoga':                   0.82,
  'Budha Aditya Yoga':           0.78,
  'Chandra Mangala Yoga':        0.72,
  'Dhana Yoga':                  0.75,
  'Vipareeta Raja Yoga':         0.75,
  'Parivartana Yoga':            0.68,
  'Graha Yuddha':                0.65,
  'Rajju Yoga':                  0.40,
  'Musala Yoga':                 0.40,
  'Nala Yoga':                   0.40
}

// Decision-relevant houses (higher = more weight on planets in these houses)
const HOUSE_RELEVANCE = {
  1:0.9, 2:0.65, 3:0.60, 4:0.65, 5:0.85, 6:0.50,
  7:0.70, 8:0.55, 9:0.88, 10:0.90, 11:0.70, 12:0.45
}

/**
 * assignWeights(evidenceNodes, astroCtx)
 *
 * Mutates weight field on each node in place.
 * Returns the same array (sorted by weight descending).
 */
export function assignWeights(evidenceNodes, astroCtx) {
  const { dasha, psi, planetHouses } = astroCtx

  for (const node of evidenceNodes) {
    let weight = SOURCE_BASE_WEIGHT[node.source] || 0.5

    // Source-specific adjustments
    if (node.source === 'planet') {
      const psiScore = psi?.[node.subject]?.psi || 5
      weight *= (psiScore / 10)  // PSI 10 = full weight, PSI 1 = 10% weight

      // Dasha relevance boost
      if (node.subject === dasha?.currentLord) weight = Math.min(0.98, weight * 1.4)
      if (node.subject === dasha?.currentSub)  weight = Math.min(0.95, weight * 1.2)

      // House relevance
      const h = planetHouses?.[node.subject]
      if (h) weight *= (HOUSE_RELEVANCE[h] || 0.5)

    } else if (node.source === 'yoga') {
      // Match against known yoga importance
      let yogaW = 0.70
      for (const [name, w] of Object.entries(YOGA_IMPORTANCE)) {
        if (node.subject.includes(name.split(' ')[0])) { yogaW = w; break }
      }
      weight = yogaW

      // Reduce if few supporting factors
      if (node.supporting.length === 0) weight *= 0.8

    } else if (node.source === 'transit') {
      if (node.metadata?.isSadeSati || node.quality === 'sade_sati') weight = 0.88
      if (node.quality === 'supportive') weight *= 1.1

    } else if (node.source === 'dasha') {
      // Dasha is always high weight — it sets the life theme
      weight = 0.85

    } else if (node.source === 'panchang') {
      // Tithi stronger than Nakshatra stronger than Vara
      if (node.id === 'panchang:tithi') weight = 0.55
      else if (node.id === 'panchang:nakshatra') weight = 0.60
      else weight = 0.45
    }

    // Confidence modifier
    if (node.confidence === 'Low') weight *= 0.7
    if (node.confidence === 'High') weight = Math.min(1.0, weight * 1.1)

    node.weight = +Math.min(1.0, Math.max(0.05, weight)).toFixed(3)
  }

  // Sort by weight descending
  evidenceNodes.sort((a, b) => b.weight - a.weight)
  return evidenceNodes
}

/**
 * topEvidence(evidenceNodes, n, areaFilter?)
 * Return the n highest-weight evidence nodes, optionally filtered by area.
 */
export function topEvidence(evidenceNodes, n = 5, areaFilter = null) {
  let filtered = evidenceNodes
  if (areaFilter) {
    filtered = evidenceNodes.filter(e => e.areas.includes(areaFilter))
  }
  return filtered.slice(0, n)
}
