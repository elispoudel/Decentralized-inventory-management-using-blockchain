export function isValidEmail(email: string): boolean {
  const t = email.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

export function isValidEthAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
}
