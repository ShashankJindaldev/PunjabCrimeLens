export const PUNJAB_CENTER = [30.95, 75.4]

const DISTRICTS = [
  { name: 'Amritsar', lat: 31.634, lng: 74.8723 },
  { name: 'Barnala', lat: 30.3745, lng: 75.5487 },
  { name: 'Bathinda', lat: 30.211, lng: 74.9455, aliases: ['Bhatinda'] },
  { name: 'Faridkot', lat: 30.6739, lng: 74.7554 },
  { name: 'Fatehgarh Sahib', lat: 30.6436, lng: 76.3478, aliases: ['Fategarh Sahib'] },
  { name: 'Fazilka', lat: 30.4028, lng: 74.0286 },
  { name: 'Ferozepur', lat: 30.9331, lng: 74.6225, aliases: ['Firozpur', 'Ferozepore', 'Firozepur'] },
  { name: 'Gurdaspur', lat: 32.0414, lng: 75.4031 },
  { name: 'Hoshiarpur', lat: 31.5143, lng: 75.9115 },
  { name: 'Jalandhar', lat: 31.326, lng: 75.5762, aliases: ['Jalandhar City'] },
  { name: 'Kapurthala', lat: 31.38, lng: 75.38 },
  { name: 'Ludhiana', lat: 30.901, lng: 75.8573 },
  { name: 'Malerkotla', lat: 30.5309, lng: 75.88 },
  { name: 'Mansa', lat: 29.9988, lng: 75.3933 },
  { name: 'Moga', lat: 30.816, lng: 75.174 },
  { name: 'Sri Muktsar Sahib', lat: 30.4762, lng: 74.516, aliases: ['Muktsar'], short: 'Muktsar' },
  { name: 'Pathankot', lat: 32.2643, lng: 75.6421 },
  { name: 'Patiala', lat: 30.3398, lng: 76.3869 },
  { name: 'Rupnagar', lat: 30.966, lng: 76.5331, aliases: ['Ropar', 'Roopnagar'] },
  {
    name: 'Sahibzada Ajit Singh Nagar',
    lat: 30.7046,
    lng: 76.7179,
    aliases: ['SAS Nagar', 'Mohali', 'Ajitgarh'],
    short: 'SAS Nagar',
  },
  { name: 'Sangrur', lat: 30.2458, lng: 75.8421 },
  {
    name: 'Shaheed Bhagat Singh Nagar',
    lat: 31.125,
    lng: 76.116,
    aliases: ['SBS Nagar', 'Nawanshahr', 'Nawan Shahr', 'Shahid Bhagat Singh Nagar'],
    short: 'SBS Nagar',
  },
  { name: 'Tarn Taran', lat: 31.4519, lng: 74.928, aliases: ['Taran Taran'] },
]

export const normalizeDistrictName = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\b(district|city)\b/g, '')
    .replace(/[^a-z0-9]/g, '')

const LOOKUP = new Map()
DISTRICTS.forEach((d) => {
  LOOKUP.set(normalizeDistrictName(d.name), d)
  d.aliases?.forEach((alias) => LOOKUP.set(normalizeDistrictName(alias), d))
})

/** Returns [lat, lng] for a district name, or null when unknown. */
export function getDistrictCoords(name) {
  const hit = LOOKUP.get(normalizeDistrictName(name))
  return hit ? [hit.lat, hit.lng] : null
}

/**
 * Stable join key: every spelling/alias of a district maps to the same key
 * (e.g. "S.A.S. Nagar", "Mohali" and "Sahibzada Ajit Singh Nagar").
 * Unknown names fall back to their own normalised form.
 */
export function districtKey(name) {
  const hit = LOOKUP.get(normalizeDistrictName(name))
  return normalizeDistrictName(hit ? hit.name : name)
}

/** Short display name for map labels (falls back to the name as given). */
export function getLabelName(name) {
  return LOOKUP.get(normalizeDistrictName(name))?.short ?? name
}