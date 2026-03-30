/**
 * Decode STAGE from ProductStock (Web3 may return string, hex, BigNumber-like object, or bigint).
 * On-chain: 0 Init, 1 Manufacture, 2 Warehouse, 3 Retail, 4 sold
 */
export function parseStageValue(raw: unknown): number {
  if (raw === undefined || raw === null) return -1
  if (typeof raw === 'bigint') return Number(raw)
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : -1
  }
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (t.startsWith('0x') || t.startsWith('0X')) {
      const n = parseInt(t, 16)
      return Number.isNaN(n) ? -1 : n
    }
    const n = parseInt(t, 10)
    return Number.isNaN(n) ? -1 : n
  }
  if (typeof raw === 'object' && raw !== null && 'toString' in raw) {
    return parseStageValue((raw as { toString: () => string }).toString())
  }
  return -1
}

/** Matches `showStage()` strings in SupplyChain.sol */
export const STAGE_LABELS: Record<number, string> = {
  0: 'Product Ordered',
  1: 'Manufacturing Stage',
  2: 'Warehouse Stage',
  3: 'Retail Stage',
  4: 'Product Sold',
}

export function getStageLabel(stageNum: number): string {
  if (stageNum >= 0 && stageNum <= 4) return STAGE_LABELS[stageNum]
  return 'Unknown'
}
