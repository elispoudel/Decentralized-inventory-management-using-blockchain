'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface DashboardMenuItem {
  path: string
  title: string
  description: string
  stat: string
  icon: ReactNode
  gradient: string
  hoverGradient: string
}

interface Props {
  menuItems: DashboardMenuItem[]
  topRightSlot?: ReactNode
  /** e.g. “Manufacturer” — shown under the main title for role-specific dashboards */
  roleHeading?: string
}

export default function InventoryDashboard({ menuItems, topRightSlot, roleHeading }: Props) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8 max-w-5xl mx-auto">
          <div className="text-center lg:text-left flex-1 min-w-0">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Inventory Management System
            </h1>
            {roleHeading ? (
              <p className="text-2xl font-bold text-indigo-700 mb-2">{roleHeading} dashboard</p>
            ) : null}
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
              DECENTRALIZED INVENTORY MANAGEMENT USING BLOCKCHAIN
            </p>
          </div>
          {topRightSlot ? (
            <div className="flex shrink-0 justify-center lg:justify-end lg:pt-1">{topRightSlot}</div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              className="group relative bg-white rounded-2xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-gray-200 text-left"
            >
              <div className="flex items-start space-x-6">
                <div
                  className={`flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item.stat}</div>
                  <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-2 transition-transform">
                    Open
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.hoverGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 