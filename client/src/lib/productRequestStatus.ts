/** Mirrors `RequestStatus` in SupplyChain.sol */
export const REQUEST_STATUS_NUM = {
  PendingAdmin: 0,
  RoutedToManufacturing: 1,
} as const

export function formatRequestStatus(status: number): string {
  switch (status) {
    case 0:
      return 'Pending — product creation'
    case 1:
      return 'Product created'
    default:
      return 'Unknown'
  }
}

/** Longer copy for retailer “Your requests” — updates when admin fulfills on chain. */
export function retailerRequestProgressNote(status: number): string {
  switch (status) {
    case 0:
      return 'Pending stage: waiting for an admin to create the product on chain from your request. This note updates in real time as soon as the supply order is registered.'
    case 1:
      return 'Product created: the admin fulfilled this request. Your supply line is registered on chain — open Track Products or Supply Products to follow the next stages (manufacture → warehouse → retail).'
    default:
      return 'Status updating…'
  }
}

export function requestStatusBadgeClass(status: number): string {
  switch (status) {
    case 0:
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 1:
      return 'bg-violet-100 text-violet-800 border-violet-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}
