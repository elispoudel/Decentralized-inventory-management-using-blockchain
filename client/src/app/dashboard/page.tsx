'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, roleDashboardPath } from '@/lib/auth/clientSession'

export default function DashboardRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const s = loadSession()
    if (!s?.token) {
      router.replace('/login')
      return
    }
    if (s.user.role === 'admin') {
      router.replace('/admin')
      return
    }
    if (!s.user.approved) {
      router.replace('/')
      return
    }
    router.replace(roleDashboardPath(s.user.role, true))
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
    </div>
  )
}
