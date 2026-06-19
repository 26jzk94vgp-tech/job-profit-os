// 合同/进度款财务计算 — 全站单一来源
// 防止 contract_value/quote 来源在各页面分叉(今天bug的根源)

// 已开票口径排除的状态(未来加draft/cancelled时自动生效)
export const CLAIM_EXCLUDE = ['cancelled', 'void', 'draft']

// 合同额唯一入口:job.contract_value(权威) ?? quote总额(seed) ?? null
// 绝不从invoice反推
export function getContractTotal(job: any, quoteTotal: number | null): number | null {
  const fromJob = (job?.contract_value != null) ? Number(job.contract_value) : null
  return fromJob ?? quoteTotal
}

// 某invoice行是否计入Claimed(排除cancelled/void/draft)
export function isActiveClaim(e: any): boolean {
  return !CLAIM_EXCLUDE.includes(String(e?.payment_status || '').toLowerCase())
}

// Claimed = 所有有效invoice累加
export function getClaimedTotal(invoiceEntries: any[]): number {
  return invoiceEntries.filter(isActiveClaim).reduce((sm, e) => sm + Number(e.amount || 0), 0)
}
