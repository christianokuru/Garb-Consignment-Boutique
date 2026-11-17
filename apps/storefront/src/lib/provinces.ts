/** ISO 3166-2 codes, which is how Medusa matches provincial tax rates. */
export const PROVINCES: [string, string][] = [
  ["ca-ab", "Alberta"],
  ["ca-bc", "British Columbia"],
  ["ca-mb", "Manitoba"],
  ["ca-nb", "New Brunswick"],
  ["ca-nl", "Newfoundland and Labrador"],
  ["ca-ns", "Nova Scotia"],
  ["ca-nt", "Northwest Territories"],
  ["ca-nu", "Nunavut"],
  ["ca-on", "Ontario"],
  ["ca-pe", "Prince Edward Island"],
  ["ca-qc", "Quebec"],
  ["ca-sk", "Saskatchewan"],
  ["ca-yt", "Yukon"],
]

export function provinceName(code?: string | null) {
  if (!code) return ""
  return PROVINCES.find(([c]) => c === code.toLowerCase())?.[1] ?? code
}

