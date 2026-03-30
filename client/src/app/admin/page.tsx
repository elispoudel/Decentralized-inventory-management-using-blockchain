'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import InventoryDashboard, { type DashboardMenuItem } from '@/components/InventoryDashboard'
import DashboardUserToolbar from '@/components/DashboardUserToolbar'
import { dashboardHomePath, loadSession } from '@/lib/auth/clientSession'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const s = loadSession()
    if (!s?.token) {
      router.replace('/login')
      return
    }
    if (s.user.role !== 'admin') {
      router.replace(dashboardHomePath())
      return
    }
    setReady(true)
  }, [router])

  const menuItems = useMemo<DashboardMenuItem[]>(
    () => [
      {
        path: '/admin/pending-blockchain',
        title: 'Pending Blockchain Registration',
        description: 'Review and register approved accounts on-chain',
        stat: 'Blockchain',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        gradient: 'from-amber-500 to-orange-500',
        hoverGradient: 'from-amber-600 to-orange-600',
      },
      {
        path: '/roles',
        title: 'Register Roles',
        description: 'Assign on-chain roles for manufacture, warehouse, and retail',
        stat: 'Smart contract',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        gradient: 'from-blue-500 to-indigo-500',
        hoverGradient: 'from-blue-600 to-indigo-600',
      },
      {
        path: '/addmed',
        title: 'Order Products',
        description: 'Create new product orders in the system',
        stat: 'Orders & blockchain',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
        gradient: 'from-green-500 to-emerald-500',
        hoverGradient: 'from-green-600 to-emerald-600',
      },
      {
        path: '/admin/product-requests',
        title: 'Product requests',
        description: 'Backorders escalated from warehouse — mint or link supply on chain',
        stat: 'Admin queue',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        gradient: 'from-rose-500 to-orange-500',
        hoverGradient: 'from-rose-600 to-orange-600',
      },
      {
        path: '/track',
        title: 'Track Products',
        description: 'Monitor product journey through the supply chain',
        stat: 'Traceability',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
        gradient: 'from-purple-500 to-pink-500',
        hoverGradient: 'from-purple-600 to-pink-600',
      },
      {
        path: '/data',
        title: 'View Data',
        description: 'Inventory metrics and visual charts',
        stat: 'Analytics',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l3-3 4 4 5-7" />
          </svg>
        ),
        gradient: 'from-sky-500 to-indigo-500',
        hoverGradient: 'from-sky-600 to-indigo-600',
      },
    ],
    []
  )

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <InventoryDashboard
        menuItems={menuItems}
        roleHeading="Admin"
        topRightSlot={<DashboardUserToolbar />}
      />
    </div>
  )
}
