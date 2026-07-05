// Converts an ISO 3166-1 alpha-2 country code into its flag emoji
// (regional indicator symbols), e.g. "BR" -> 🇧🇷.
export function countryCodeToFlag(countrycode: string | undefined | null): string {
  if (!countrycode || countrycode.length !== 2) return ''
  const code = countrycode.toUpperCase()
  const codePoints = [...code].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65))
  if (codePoints.some((cp) => cp < 0x1f1e6 || cp > 0x1f1ff)) return ''
  return String.fromCodePoint(...codePoints)
}
