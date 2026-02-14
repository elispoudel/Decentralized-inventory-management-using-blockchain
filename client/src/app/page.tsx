'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getContract, loadWeb3 } from '@/lib/web3'
import NetworkHelper from '@/components/NetworkHelper'

type StageKey = 'Init' | 'RawMaterialSupply' | 'Manufacture' | 'Distribution' | 'Retail' | 'Sold'

interface DashboardKpis {
  medicines: number
  rms: number
  man: number
  dis: number
  ret: number
  stage: Record<StageKey, number>
}

const defaultKpis: DashboardKpis = {
  medicines: 0,
  rms: 0,
  man: 0,
  dis: 0,
  ret: 0,
  stage: {
    Init: 0,
    RawMaterialSupply: 0,
    Manufacture: 0,
    Distribution: 0,
    Retail: 0,
    Sold: 0,
  },
}

export default function Home() {
  const router = useRouter()
  const [kpis, setKpis] = useState<DashboardKpis>(defaultKpis)
  const [loadingKpis, setLoadingKpis] = useState(true)
  const [kpiError, setKpiError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  const inProgressCount = Math.max(0, kpis.medicines - kpis.stage.Sold)

  const menuItems = useMemo(
    () => [
      {
        path: '/roles',
        title: 'Register Roles',
        description: 'Assign roles to participants in the supply chain',
        stat: `${kpis.rms + kpis.man + kpis.dis + kpis.ret} participants`,
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        gradient: 'from-blue-500 to-cyan-500',
        hoverGradient: 'from-blue-600 to-cyan-600',
      },
      {
        path: '/addmed',
        title: 'Order Materials',
        description: 'Create new medicine orders in the system',
        stat: `${kpis.medicines} total orders`,
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
        gradient: 'from-green-500 to-emerald-500',
        hoverGradient: 'from-green-600 to-emerald-600',
      },
      {
        path: '/track',
        title: 'Track Materials',
        description: 'Monitor medicine journey through the supply chain',
        stat: `${kpis.stage.Sold} sold`,
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
        stat: `${kpis.medicines} items`,
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l3-3 4 4 5-7" />
          </svg>
        ),
        gradient: 'from-sky-500 to-indigo-500',
        hoverGradient: 'from-sky-600 to-indigo-600',
      },
      {
        path: '/supply',
        title: 'Supply Materials',
        description: 'Manage supply chain flow and transitions',
        stat: `${inProgressCount} in progress`,
        icon: (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
          </svg>
        ),
        gradient: 'from-orange-500 to-red-500',
        hoverGradient: 'from-orange-600 to-red-600',
      },
    ],
    [kpis, inProgressCount]
  )

  const supplyChainFlow = [
    {
      step: '1',
      label: 'Raw Material',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h10M12 20V10m0 0l3-3m-3 3L9 7M5 10a7 7 0 0114 0c0 2.4-1.2 4.5-3 5.8-1.1.8-1.7 2-1.7 3.2h-4.6c0-1.2-.6-2.4-1.7-3.2A7 7 0 015 10z" />
        </svg>
      ),
    },
    {
      step: '2',
      label: 'Manufacture',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h18M5 20V10l4-3 3 2 4-3 3 2v12M9 17h2m4 0h2" />
        </svg>
      ),
    },
    {
      step: '3',
      label: 'Distribute',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h11v8H3zM14 10h3l3 3v2h-6v-5zM7 17a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm10 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
        </svg>
      ),
    },
    {
      step: '4',
      label: 'Retail',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16l-1 12H5L4 8zM9 8V6a3 3 0 016 0v2" />
        </svg>
      ),
    },
    {
      step: '5',
      label: 'Consumer',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0" />
        </svg>
      ),
    },
  ]

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setInterval> | null = null

    const loadKpis = async () => {
      try {
        setKpiError('')
        const { contract } = await getContract()
        const [medicineCtr, rmsCtr, manCtr, disCtr, retCtr] = await Promise.all([
          contract.methods.medicineCtr().call(),
          contract.methods.rmsCtr().call(),
          contract.methods.manCtr().call(),
          contract.methods.disCtr().call(),
          contract.methods.retCtr().call(),
        ])

        const totalMedicines = Number(medicineCtr)
        const stage = {
          Init: 0,
          RawMaterialSupply: 0,
          Manufacture: 0,
          Distribution: 0,
          Retail: 0,
          Sold: 0,
        }

        if (totalMedicines > 0) {
          const medicines = await Promise.all(
            Array.from({ length: totalMedicines }, (_, index) =>
              contract.methods.MedicineStock(index + 1).call()
            )
          )

          for (const medicine of medicines) {
            const stageValue = Number(medicine.stage)
            if (stageValue === 0) stage.Init += 1
            if (stageValue === 1) stage.RawMaterialSupply += 1
            if (stageValue === 2) stage.Manufacture += 1
            if (stageValue === 3) stage.Distribution += 1
            if (stageValue === 4) stage.Retail += 1
            if (stageValue === 5) stage.Sold += 1
          }
        }

        setKpis({
          medicines: totalMedicines,
          rms: Number(rmsCtr),
          man: Number(manCtr),
          dis: Number(disCtr),
          ret: Number(retCtr),
          stage,
        })
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (err: any) {
        setKpiError(err?.message || 'Unable to load live KPI data from blockchain.')
      } finally {
        setLoadingKpis(false)
      }
    }

    const initialize = async () => {
      try {
        await loadWeb3()
      } catch {
        // Ignore account request errors; loadKpis shows user-facing errors.
      }
      await loadKpis()
    }

    initialize()
    refreshTimer = setInterval(loadKpis, 15000)

    const handleWalletChange = () => {
      loadKpis()
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleWalletChange)
      window.ethereum.on('chainChanged', handleWalletChange)
    }

    return () => {
      if (refreshTimer) clearInterval(refreshTimer)
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleWalletChange)
        window.ethereum.removeListener('chainChanged', handleWalletChange)
      }
    }
  }, [])

  const kpiCards = [
    { title: 'Total Orders', value: kpis.medicines, color: 'from-blue-500 to-cyan-500' },
    { title: 'Suppliers (RMS)', value: kpis.rms, color: 'from-emerald-500 to-green-500' },
    { title: 'Manufacturers', value: kpis.man, color: 'from-indigo-500 to-blue-500' },
    { title: 'Distributors', value: kpis.dis, color: 'from-orange-500 to-amber-500' },
    { title: 'Retailers', value: kpis.ret, color: 'from-pink-500 to-rose-500' },
    { title: 'In Progress', value: inProgressCount, color: 'from-violet-500 to-fuchsia-500' },
  ]

  const stageKpis = [
    { key: 'Init', label: 'Ordered', value: kpis.stage.Init },
    { key: 'RawMaterialSupply', label: 'Raw Supply', value: kpis.stage.RawMaterialSupply },
    { key: 'Manufacture', label: 'Manufacturing', value: kpis.stage.Manufacture },
    { key: 'Distribution', label: 'Distribution', value: kpis.stage.Distribution },
    { key: 'Retail', label: 'Retail', value: kpis.stage.Retail },
    { key: 'Sold', label: 'Sold', value: kpis.stage.Sold },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NetworkHelper />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6 transform hover:scale-110 transition-transform duration-300">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Inventory Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            DECENTRALIZED INVENTORY MANAGEMENT USING BLOCKCHAIN
          </p>
        </div>

        <div className="mb-12 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Live KPI</h2>
            <div className="text-xs text-gray-500">
              {loadingKpis ? 'Refreshing...' : `Last updated: ${lastUpdated || '-'}`}
            </div>
          </div>

          {kpiError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {kpiError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {kpiCards.map((card) => (
              <div key={card.title} className="bg-white/90 rounded-xl shadow-md p-4 border border-white/70">
                <div className="text-sm text-gray-600">{card.title}</div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-3xl font-bold text-gray-800">{card.value}</div>
                  <div className={`h-2 w-20 rounded-full bg-gradient-to-r ${card.color}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stageKpis.map((item) => (
              <div key={item.key} className="rounded-xl bg-white/85 border border-white/70 p-3 text-center shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500">{item.label}</div>
                <div className="text-2xl font-semibold text-gray-800 mt-1">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Supply Chain Flow</h2>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
              {supplyChainFlow.map((item, index) => (
                <div key={item.step} className="flex flex-col items-center relative z-10 flex-1">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-3 shadow-md transform hover:scale-110 transition-transform border-4 border-white">
                    {item.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-sm md:text-base font-semibold text-gray-700">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">Step {item.step}</div>
                  </div>
                  {index < supplyChainFlow.length - 1 && (
                    <>
                      <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 via-indigo-300 to-blue-300 -z-0" style={{ width: 'calc(100% - 2rem)' }}>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 bg-white rounded-full p-1">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="md:hidden my-2">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`
                group relative bg-white rounded-2xl p-8 shadow-lg
                transform transition-all duration-300
                hover:scale-105 hover:shadow-2xl
                border-2 border-transparent hover:border-gray-200
                text-left
              `}
            >
              <div className="flex items-start space-x-6">
                <div
                  className={`
                    flex-shrink-0 w-20 h-20 rounded-xl
                    bg-gradient-to-br ${item.gradient}
                    flex items-center justify-center text-white
                    transform transition-transform duration-300
                    group-hover:scale-110 group-hover:rotate-3
                    shadow-lg
                  `}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {item.stat}
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-2 transition-transform">
                    Get Started
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className={`
                  absolute inset-0 rounded-2xl
                  bg-gradient-to-br ${item.hoverGradient}
                  opacity-0 group-hover:opacity-5
                  transition-opacity duration-300
                `}
              />
            </button>
          ))}
        </div>

        <div className="text-center text-gray-500 text-sm max-w-2xl mx-auto">
          {/* <p className="mb-2">
            Powered by <span className="font-semibold text-indigo-600">Blockchain Technology</span>
          </p>
          <p className="text-xs">
            Secure, transparent, and traceable supply chain management
          </p> */}
        </div>
      </div>
    </div>
  )
}

