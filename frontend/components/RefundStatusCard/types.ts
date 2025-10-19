export type RefundHistory = {
  stage: string
  timestamp: string
}

export type RefundStatus = {
  return_id: string
  status: string
  eta_date: string
  confidence: number
  history: RefundHistory[]
}
