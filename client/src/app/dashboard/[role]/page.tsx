'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadSession, roleDashboardPath } from '@/lib/auth/clientSession'
import OperatorDashboardView from '@/components/OperatorDashboardView'

const VALID = ['manufacturer', 'warehouse', 'retailer'] as const
type ValidRole = (typeof VALID)[number]

function isValidRole(s: string): s is ValidRole {
  return (VALID as readonly string[]).includes(s)
}

export default function RoleDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const roleParam = typeof params.role === 'string' ? params.role : ''
  const [ready, setReady] = useState(false)

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
    if (!isValidRole(roleParam)) {
      router.replace(roleDashboardPath(s.user.role, true))
      return
    }
    if (s.user.role !== roleParam) {
      router.replace(roleDashboardPath(s.user.role, true))
      return
    }
    setReady(true)
  }, [router, roleParam])

  if (!ready || !isValidRole(roleParam)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
      </div>
    )
  }

  return <OperatorDashboardView role={roleParam} />
}
