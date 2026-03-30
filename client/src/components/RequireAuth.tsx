'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { dashboardHomePath, loadSession } from '@/lib/auth/clientSession'
import type { UserRole } from '@/lib/auth/types'

type Mode = 'any' | 'admin' | 'operator'

export default function RequireAuth({ children, mode = 'any' }: { children: React.ReactNode; mode?: Mode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const s = loadSession()
    if (!s?.token) {
      router.replace('/login')
      return
    }
    if (s.user.role !== 'admin' && !s.user.approved) {
      router.replace('/')
      return
    }
    if (mode === 'admin' && s.user.role !== 'admin') {
      router.replace(dashboardHomePath())
      return
    }
    if (mode === 'operator') {
      const opRoles: UserRole[] = ['manufacturer', 'warehouse', 'retailer']
      if (s.user.role === 'admin') {
        setReady(true)
        return
      }
      if (!opRoles.includes(s.user.role)) {
        router.replace(dashboardHomePath())
        return
      }
    }
    setReady(true)
  }, [router, mode])

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
      </div>
    )
  }

  return <>{children}</>
}
