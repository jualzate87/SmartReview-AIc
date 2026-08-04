/** Legacy key aliases — session migration for verifiedDocsList. */
export const LEGACY_VERIFY_KEY_ALIASES: Record<string, string> = {
  'w2-techCircle': 'techCircle',
  '1099-div-token': '1099-div-tokenFinancial',
  '1099-div-northmark': '1099-div-northmarkIndex',
  '1099-div-beacon': '1099-div-beaconDividend',
  '1099-int-unwavering': '1099-int-unwaverIngFinancial',
  '1099-int-harborline': '1099-int-harborlineCredit',
  '1099-int-cascade': '1099-int-cascadeFederal',
  '1099-r-meridian': '1099-r',
  '1099-nec-summit': '1099-nec',
}

export function normalizeVerifiedDocKey(key: string): string {
  return LEGACY_VERIFY_KEY_ALIASES[key] ?? key
}

/** True when any key in the set matches docKey after legacy normalization. */
export function isVerifiedInSet(set: Set<string>, docKey: string): boolean {
  const canonical = normalizeVerifiedDocKey(docKey)
  for (const k of set) {
    if (normalizeVerifiedDocKey(k) === canonical) return true
  }
  return false
}

/** Lookup activity meta when keys may be stored in legacy form. */
export function getVerifiedDocEntry<T>(
  map: Map<string, T> | undefined,
  docKey: string,
): T | undefined {
  if (!map) return undefined
  const canonical = normalizeVerifiedDocKey(docKey)
  for (const [k, v] of map) {
    if (normalizeVerifiedDocKey(k) === canonical) return v
  }
  return undefined
}
