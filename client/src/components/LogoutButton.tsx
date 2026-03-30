'use client'

import { useRouter } from 'next/navigation'
import { clearSession } from '@/lib/auth/clientSession'

export default function LogoutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        clearSession()
        router.push('/')
        router.refresh()
      }}
      className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold shadow-sm hover:bg-gray-50 transition-colors text-sm"
    >
      <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Log out
    </button>
  )
}
