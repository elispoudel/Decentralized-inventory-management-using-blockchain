'use client'

import { useMemo } from 'react'
import InventoryDashboard, { type DashboardMenuItem } from '@/components/InventoryDashboard'
import DashboardUserToolbar from '@/components/DashboardUserToolbar'

const ROLE_HEADING: Record<'manufacturer' | 'warehouse' | 'retailer', string> = {
  manufacturer: 'Manufacturer',
  warehouse: 'Warehouse',
  retailer: 'Retailer',
}

export default function OperatorDashboardView({ role }: { role: 'manufacturer' | 'warehouse' | 'retailer' }) {
  const menuItems = useMemo<DashboardMenuItem[]>(() => {
    const items: DashboardMenuItem[] = [
      {
        path: '/supply',
        title: 'Supply Products',
        description: 'Manage supply chain flow and transitions',
        stat: 'On-chain stages',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
          </svg>
        ),
        gradient: 'from-orange-500 to-red-500',
        hoverGradient: 'from-orange-600 to-red-600',
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
    ]

    if (role === 'retailer') {
      items.splice(1, 0, {
        path: '/request',
        title: 'Product request',
        description: 'Submit a product request to the admin queue',
        stat: 'Retailer · chain',
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        ),
        gradient: 'from-rose-500 to-pink-500',
        hoverGradient: 'from-rose-600 to-pink-600',
      })
    }

    return items
  }, [role])

  return (
    <InventoryDashboard
      menuItems={menuItems}
      topRightSlot={<DashboardUserToolbar />}
      roleHeading={ROLE_HEADING[role]}
    />
  )
}
