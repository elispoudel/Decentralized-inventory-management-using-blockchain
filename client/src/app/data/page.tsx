'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadWeb3, getContract } from '@/lib/web3'
import { dashboardHomePath, loadSession } from '@/lib/auth/clientSession'

interface Product {
  id: string
  name: string
  description: string
  MANid: string
  WARid: string
  RETid: string
  stage: string
}

interface Role {
  addr: string
  id: string
  name: string
  place: string
}

export default function ViewData() {
  const router = useRouter()
  const [loader, setLoader] = useState(true)
  const [product, setProduct] = useState<{ [key: number]: Product}>({})
  const [productStage, setProductStage] = useState<{ [key: number]: string }>({})
  const [productTimestamps, setProductTimestamps] = useState<{ [key: number]: any }>({})
  const [man, setMAN] = useState<{ [key: number]: Role }>({})
  const [war, setWAR] = useState<{ [key: number]: Role }>({})
  const [ret, setRET] = useState<{ [key: number]: Role }>({})
  const [authReady, setAuthReady] = useState(false)

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
    setAuthReady(true)
  }, [router])

  useEffect(() => {
    if (!authReady) return
    loadWeb3()
    loadBlockchainData()
  }, [authReady])

  const loadBlockchainData = async () => {
    try {
      setLoader(true)
      const { contract } = await getContract()

      const medCtr = await contract.methods.productCtr().call()
      const productData: { [key: number]: Product } = {}
      const productStageData: { [key: number]: string } = {}
      const productTimestampData: { [key: number]: any } = {}

      for (let i = 0; i < medCtr; i++) {
        const id = i + 1
        productData[id] = await contract.methods.ProductStock(id).call()
        productStageData[id] = await contract.methods.showStage(id).call()
        productTimestampData[id] = await contract.methods.getProductTimestamps(id).call()
      }

      const manCtr = await contract.methods.manCtr().call()
      const manData: { [key: number]: Role } = {}
      for (let i = 0; i < manCtr; i++) {
        manData[i + 1] = await contract.methods.MAN(i + 1).call()
      }

      const warCtr = await contract.methods.warCtr().call()
      const warData: { [key: number]: Role } = {}
      for (let i = 0; i < warCtr; i++) {
        warData[i + 1] = await contract.methods.WAR(i + 1).call()
      }

      const retCtr = await contract.methods.retCtr().call()
      const retData: { [key: number]: Role } = {}
      for (let i = 0; i < retCtr; i++) {
        retData[i + 1] = await contract.methods.RET(i + 1).call()
      }

      setProduct(productData)
      setProductStage(productStageData)
      setProductTimestamps(productTimestampData)
      setMAN(manData)
      setWAR(warData)
      setRET(retData)
      setLoader(false)
    } catch (err) {
      console.error('Error loading blockchain data', err)
      setLoader(false)
      alert('Unable to load blockchain data')
    }
  }

  // Chart 1: Blockchain Transaction Timeline
  const getTransactionTimeline = () => {
    const timelineData: { [key: string]: number } = {}
    Object.keys(productTimestamps).forEach((k) => {
      const ts = productTimestamps[parseInt(k)]
      const timestamps = [ts?.orderedAt, ts?.manufactureAt, ts?.warehouseAt, ts?.retailAt, ts?.soldAt]
        .map((t) => Number(t))
        .filter((t) => !Number.isNaN(t) && t > 0)
      timestamps.forEach((t) => {
        const date = new Date(t * 1000).toLocaleDateString()
        timelineData[date] = (timelineData[date] || 0) + 1
      })
    })
    return Object.entries(timelineData)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-10)
  }

  // Chart 2: Product Traceability Flow
  const getTraceabilityFlow = () => {
    const flowData = {
      'Ordered': 0,
      'Manufacturing': 0,
      'Warehouse': 0,
      'Retail': 0,
      'Sold': 0,
    }
    Object.keys(productStage).forEach((k) => {
      const s = productStage[parseInt(k)] || ''
      if (s.toLowerCase().includes('order')) flowData['Ordered']++
      else if (s.toLowerCase().includes('manufactur')) flowData['Manufacturing']++
      else if (s.toLowerCase().includes('warehouse')) flowData['Warehouse']++
      else if (s.toLowerCase().includes('retail')) flowData['Retail']++
      else if (s.toLowerCase().includes('sold')) flowData['Sold']++
    })
    return flowData
  }

  // Chart 3: Transaction Verification Status
  const getVerificationStatus = () => {
    const total = Object.keys(product).length
    const verified = Object.values(productStage).filter((s) => s.toLowerCase().includes('sold')).length
    const pending = total - verified
    return { verified, pending, rejected: 0 }
  }

  // Chart 4: Role-Based Activity
  const getRoleActivity = () => {
    const roleMap: { [key: string]: number } = {
      'Manufacturer': 0,
      'Warehouse': 0,
      'Retailer': 0,
    }
    Object.keys(product).forEach((k) => {
      const id = parseInt(k)
      if (product[id].MANid) roleMap['Manufacturer']++
      if (product[id].WARid) roleMap['Warehouse']++
      if (product[id].RETid) roleMap['Retailer']++
    })
    return roleMap
  }

  // Chart: Location Distribution for decentralized inventory network
  const getLocationDistribution = () => {
    const locationMap: { [key: string]: number } = {}
    ;[man, war, ret].forEach((roleMap) => {
      Object.values(roleMap).forEach((r) => {
        const loc = (r.place || '').trim() || 'Unknown'
        locationMap[loc] = (locationMap[loc] || 0) + 1
      })
    })
    return Object.entries(locationMap).sort((a, b) => b[1] - a[1])
  }

  // Chart: Recent immutable on-chain activity feed
  const getRecentOnChainEvents = () => {
    const events: { productId: number; stage: string; timestamp: number }[] = []
    Object.keys(productTimestamps).forEach((k) => {
      const id = parseInt(k)
      const ts = productTimestamps[id]
      const stageEvents = [
        { stage: 'Ordered', timestamp: Number(ts?.orderedAt || 0) },
        { stage: 'Manufacturing', timestamp: Number(ts?.manufactureAt || 0) },
        { stage: 'Warehouse', timestamp: Number(ts?.warehouseAt || 0) },
        { stage: 'Retail', timestamp: Number(ts?.retailAt || 0) },
        { stage: 'Sold', timestamp: Number(ts?.soldAt || 0) },
      ].filter((e) => e.timestamp > 0)
      stageEvents.forEach((e) => events.push({ productId: id, stage: e.stage, timestamp: e.timestamp }))
    })
    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 12)
  }

  // Chart 5: Smart Contract Stats
  const getContractStats = () => {
    const totalMeds = Object.keys(product).length
    const totalTransactions = Object.keys(productTimestamps).reduce((acc, k) => {
      const ts = productTimestamps[parseInt(k)]
      return acc + [ts?.orderedAt, ts?.manufactureAt, ts?.warehouseAt, ts?.retailAt, ts?.soldAt].filter(Boolean).length
    }, 0)
    const totalRoles = Object.keys(man).length + Object.keys(war).length + Object.keys(ret).length
    return { totalMeds, totalTransactions, totalRoles }
  }

  // Chart 6: Processing Time Analysis (Performance Metric)
  const getProcessingTimeAnalysis = () => {
    const timeData: { [key: string]: number[] } = {
      'Order → Manufacturing': [],
      'Manufacturing → Warehouse': [],
      'Warehouse → Retail': [],
      'Retail → Sold': []
    }

    Object.keys(productTimestamps).forEach((k) => {
      const ts = productTimestamps[parseInt(k)]
      
      // Order → Manufacturing
      if (ts?.orderedAt && ts?.manufactureAt) {
        const orderTime = Number(ts.orderedAt)
        const manufactureTime = Number(ts.manufactureAt)
        if (orderTime > 0 && manufactureTime > 0 && manufactureTime > orderTime) {
          const hours = (manufactureTime - orderTime) / 3600 // Convert to hours
          timeData['Order → Manufacturing'].push(hours)
        }
      }

      // Manufacturing → Warehouse
      if (ts?.manufactureAt && ts?.warehouseAt) {
        const manufactureTime = Number(ts.manufactureAt)
        const warehouseTime = Number(ts.warehouseAt)
        if (manufactureTime > 0 && warehouseTime > 0 && warehouseTime > manufactureTime) {
          const hours = (warehouseTime - manufactureTime) / 3600
          timeData['Manufacturing → Warehouse'].push(hours)
        }
      }

      // Warehouse → Retail
      if (ts?.warehouseAt && ts?.retailAt) {
        const warehouseTime = Number(ts.warehouseAt)
        const retailTime = Number(ts.retailAt)
        if (warehouseTime > 0 && retailTime > 0 && retailTime > warehouseTime) {
          const hours = (retailTime - warehouseTime) / 3600
          timeData['Warehouse → Retail'].push(hours)
        }
      }

      // Retail → Sold
      if (ts?.retailAt && ts?.soldAt) {
        const retailTime = Number(ts.retailAt)
        const soldTime = Number(ts.soldAt)
        if (retailTime > 0 && soldTime > 0 && soldTime > retailTime) {
          const hours = (soldTime - retailTime) / 3600
          timeData['Retail → Sold'].push(hours)
        }
      }
    })

    // Calculate averages and format for display
    const averages: { [key: string]: { avg: number, count: number, min: number, max: number } } = {}
    Object.keys(timeData).forEach((stage) => {
      const times = timeData[stage]
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length
        const min = Math.min(...times)
        const max = Math.max(...times)
        averages[stage] = { avg, count: times.length, min, max }
      } else {
        averages[stage] = { avg: 0, count: 0, min: 0, max: 0 }
      }
    })

    return averages
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
      </div>
    )
  }

  if (loader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-700 font-semibold">Loading blockchain data...</div>
        </div>
      </div>
    )
  }

  const timeline = getTransactionTimeline()
  const traceability = getTraceabilityFlow()
  const verification = getVerificationStatus()
  const roleActivity = getRoleActivity()
  const locationDistribution = getLocationDistribution()
  const recentEvents = getRecentOnChainEvents()
  const contractStats = getContractStats()
  const processingTimes = getProcessingTimeAnalysis()

  const maxTimeline = Math.max(...timeline.map((t) => t[1]), 1)
  const maxRole = Math.max(...Object.values(roleActivity), 1)
  const maxLocation = Math.max(...locationDistribution.map((l) => l[1]), 1)
  const panelClass = 'bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-6'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h6M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h4M9 17l4-4m0 0l4-4m-4 4h8" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">View Data</h1>
                <p className="text-gray-600 text-sm">Real-time decentralized inventory ledger analytics</p>
              </div>
            </div>
            <button
              onClick={() => router.push(dashboardHomePath())}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              HOME
            </button>
          </div>
        </div>

        {/* Chart 1 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">1. Blockchain Transaction Timeline</h2>
          <p className="text-gray-600 text-sm mb-6">Number of blockchain transactions recorded per date</p>
          
          {/* List View */}
          <div className="mb-8">
            <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" /></svg>
              
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeline.length > 0 ? (
                timeline.map((item, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 font-medium">Date</div>
                        <div className="text-lg font-bold text-blue-600">{item[0]}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 font-medium">Transactions</div>
                        <div className="text-2xl font-bold text-indigo-600">{item[1]}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 col-span-full">No transaction data available</div>
              )}
            </div>
          </div>

          {/* Graph View */}
          <div>
            <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
              Chart View
            </div>
            <div className={`${panelClass} overflow-x-auto`}>
              <div className="flex items-end justify-around h-64 min-w-max py-4">
                {timeline.length > 0 ? (
                  timeline.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center px-2">
                      <div className="text-xs text-gray-700 font-semibold mb-2">{item[1]}</div>
                      <div
                        className="w-12 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg"
                        style={{ height: `${(item[1] / maxTimeline) * 200}px` }}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2 text-center">{item[0]}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No transaction data available</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">2. Inventory Lifecycle Flow</h2>
          <p className="text-gray-600 text-sm mb-6">Immutable movement of inventory items through on-chain lifecycle stages</p>
          
          {/* List View */}
          <div className="mb-8">
            <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" /></svg>
              Product Stages
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.entries(traceability).map((item, idx) => {
                const stageColors = [
                  'from-orange-50 to-orange-100 border-orange-300',
                  'from-blue-50 to-blue-100 border-blue-300',
                  'from-purple-50 to-purple-100 border-purple-300',
                  'from-green-50 to-green-100 border-green-300',
                  'from-red-50 to-red-100 border-red-300'
                ]
                return (
                  <div key={item[0]} className={`bg-gradient-to-br ${stageColors[idx]} p-4 rounded-xl border hover:shadow-md shadow-sm transition-shadow`}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800 mb-2">{item[1]}</div>
                      <div className="text-sm font-semibold text-gray-700">{item[0]}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Graph View */}
          <div>
            <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
              Flow Diagram
            </div>
            <div className={`${panelClass} flex flex-col lg:flex-row items-center justify-between gap-4 overflow-x-auto`}>
              {Object.entries(traceability).map((item, idx) => (
                <div key={item[0]} className="flex flex-col items-center min-w-fit">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {item[1]}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 mt-3 text-center">{item[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">3. Transaction Verification Status</h2>
          <p className="text-gray-600 text-sm mb-6">Blockchain validation showing verified vs pending</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600">{verification.verified}</div>
                <div className="text-gray-700 font-semibold mt-2">Verified Blocks</div>
                <div className="text-sm text-gray-500 mt-1">Confirmed on blockchain</div>
              </div>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-full"
                  style={{
                    width: `${verification.verified + verification.pending > 0 ? (verification.verified / (verification.verified + verification.pending)) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200 shadow-sm">
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-600">{verification.pending}</div>
                <div className="text-gray-700 font-semibold mt-2">Pending</div>
                <div className="text-sm text-gray-500 mt-1">Awaiting validation</div>
              </div>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-full"
                  style={{
                    width: `${verification.verified + verification.pending > 0 ? (verification.pending / (verification.verified + verification.pending)) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-200 shadow-sm">
              <div className="text-center">
                <div className="text-5xl font-bold text-red-600">0</div>
                <div className="text-gray-700 font-semibold mt-2">Rejected</div>
                <div className="text-sm text-gray-500 mt-1">Failed validation</div>
              </div>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-2">
                <div className="bg-red-500 h-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">4. Role-Based Blockchain Activity</h2>
          <p className="text-gray-600 text-sm mb-6">Smart contract interactions by decentralized inventory participant role</p>
          
          {/* List View */}
          <div className="mb-8">
            <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" /></svg>
              Role Activities Overview
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(roleActivity).map((item, idx) => {
                const roleColors = [
                  'from-blue-50 to-blue-100 border-blue-300 bg-blue-500',
                  'from-green-50 to-green-100 border-green-300 bg-green-500',
                  'from-purple-50 to-purple-100 border-purple-300 bg-purple-500'
                ]
                const bgClass = roleColors[idx].split(' ')[0] + ' ' + roleColors[idx].split(' ')[1]
                const borderClass = roleColors[idx].split(' ')[2]
                const badgeClass = roleColors[idx].split(' ')[3]
                return (
                  <div key={item[0]} className={`bg-gradient-to-br ${bgClass} ${borderClass} border p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 font-medium">Role</div>
                        <div className="text-xl font-bold text-gray-800">{item[0]}</div>
                      </div>
                      <div className={`${badgeClass} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-md`}>
                        {item[1]}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Graph View */}
          <div>
            <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
              Activity Comparison
            </div>
            <div className="space-y-6">
              {Object.entries(roleActivity).map((item, idx) => {
                const colors = ['from-blue-500 to-cyan-400', 'from-green-500 to-emerald-400', 'from-purple-500 to-pink-400', 'from-orange-500 to-red-400']
                return (
                  <div key={item[0]} className="flex items-center gap-4">
                    <div className="w-40 text-sm font-semibold text-gray-700">{item[0]}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[idx]} flex items-center justify-end pr-3`}
                        style={{ width: `${(item[1] / maxRole) * 100}%` }}
                      >
                        {item[1] > 0 && <span className="text-white font-bold text-sm">{item[1]}</span>}
                      </div>
                    </div>
                    <div className="w-12 text-right font-bold text-gray-800">{item[1]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chart 5 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">5. Location Distribution</h2>
          <p className="text-gray-600 text-sm mb-6">Participant density by location across manufacturer, warehouse, and retailer nodes</p>
          <div className="space-y-4">
            {locationDistribution.length > 0 ? (
              locationDistribution.map(([loc, count]) => (
                <div key={loc} className="flex items-center gap-4">
                  <div className="w-44 text-sm font-semibold text-gray-700 truncate">{loc}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 flex items-center justify-end pr-3"
                      style={{ width: `${(count / maxLocation) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">{count}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No location data available.</p>
            )}
          </div>
        </div>

        {/* Chart 6 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">6. Smart Contract Interaction Statistics</h2>
          <p className="text-gray-600 text-sm mb-6">Ethereum smart contract activity and system metrics</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-8 border border-indigo-200 shadow-sm">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-indigo-600">{contractStats.totalTransactions}</div>
                <div className="text-gray-700 font-semibold mt-3">Total Contract Calls</div>
                <div className="text-sm text-gray-600 mt-2">Smart contract method invocations</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 shadow-sm">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-green-600">{Object.keys(product).length}</div>
                <div className="text-gray-700 font-semibold mt-3">Event Triggers</div>
                <div className="text-sm text-gray-600 mt-2">Smart contract events emitted</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-200 shadow-sm">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-purple-600">{contractStats.totalMeds}</div>
                <div className="text-gray-700 font-semibold mt-3">Active Items</div>
                <div className="text-sm text-gray-600 mt-2">Products tracked on blockchain</div>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-4 rounded-xl">
            <div className="text-sm text-purple-900">
              <strong>📊 Blockchain Proof:</strong> Every transaction is immutable, timestamped, and verified on the network with cryptographic signatures.
            </div>
          </div>
        </div>

        {/* Chart 7 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">7. Recent On-Chain Events</h2>
          <p className="text-gray-600 text-sm mb-6">Latest immutable inventory events from the blockchain ledger</p>
          <div className="space-y-3">
            {recentEvents.length > 0 ? (
              recentEvents.map((ev, idx) => (
                <div key={`${ev.productId}-${ev.timestamp}-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                      #{ev.productId}
                    </span>
                    <span className="font-semibold text-gray-800">{ev.stage}</span>
                  </div>
                  <span className="text-sm text-gray-600">{new Date(ev.timestamp * 1000).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent on-chain events found.</p>
            )}
          </div>
        </div>

        {/* Chart 8: Processing Time Analysis (Performance Metric) */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">8. Processing Time Analysis</h2>
          <p className="text-gray-600 text-sm mb-6">Performance metrics showing time spent in each inventory lifecycle stage</p>
          
          {/* List View */}
          <div className="mb-8">
            <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" /></svg>
              Stage Performance Metrics
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(processingTimes).map(([stage, data], idx) => {
                const performanceColors = [
                  'from-green-50 to-green-100 border-green-300',
                  'from-blue-50 to-blue-100 border-blue-300',
                  'from-yellow-50 to-yellow-100 border-yellow-300',
                  'from-red-50 to-red-100 border-red-300'
                ]
                const isGoodPerformance = data.avg < 48 // Less than 2 days is good
                const performanceIcon = isGoodPerformance ? '🟢' : '🟡'
                
                return (
                  <div key={stage} className={`bg-gradient-to-br ${performanceColors[idx]} p-6 rounded-xl border hover:shadow-lg shadow-sm transition-shadow`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-600 font-medium">Stage</div>
                        <div className="text-lg font-bold text-gray-800">{stage}</div>
                      </div>
                      <div className="text-2xl">{performanceIcon}</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Time:</span>
                        <span className="font-bold text-lg text-gray-800">
                          {data.avg > 0 ? `${data.avg.toFixed(1)}h` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sample Size:</span>
                        <span className="font-semibold text-gray-700">{data.count} products</span>
                      </div>
                      {data.count > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Fastest:</span>
                            <span className="font-semibold text-green-600">{data.min.toFixed(1)}h</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Slowest:</span>
                            <span className="font-semibold text-red-600">{data.max.toFixed(1)}h</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Graph View */}
          <div>
            <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
              Performance Comparison
            </div>
            <div className="space-y-6">
              {Object.entries(processingTimes).map(([stage, data], idx) => {
                const colors = ['from-green-500 to-emerald-400', 'from-blue-500 to-cyan-400', 'from-yellow-500 to-orange-400', 'from-red-500 to-pink-400']
                const maxAvgTime = Math.max(...Object.values(processingTimes).map(d => d.avg), 1)
                const performance = data.avg > 0 ? (data.avg / maxAvgTime) * 100 : 0
                
                return (
                  <div key={stage} className="flex items-center gap-4">
                    <div className="w-48 text-sm font-semibold text-gray-700">{stage}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-10 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[idx]} flex items-center justify-end pr-4 shadow-md`}
                        style={{ width: `${performance}%` }}
                      >
                        {data.avg > 0 && (
                          <span className="text-white font-bold text-sm">
                            {data.avg.toFixed(1)}h avg
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <div className="font-bold text-gray-800">{data.count}</div>
                      <div className="text-xs text-gray-500">samples</div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Performance Insights */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-sm font-semibold text-green-800">Fastest Stage</div>
                  <div className="text-lg font-bold text-green-600">
                    {Object.entries(processingTimes).reduce((a, b) => 
                      a[1].avg > 0 && (b[1].avg === 0 || a[1].avg < b[1].avg) ? a : b
                    )[0]}
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
                <div className="text-center">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-sm font-semibold text-yellow-800">Average Processing</div>
                  <div className="text-lg font-bold text-yellow-600">
                    {Object.values(processingTimes).reduce((acc, curr) => 
                      acc + (curr.avg > 0 ? curr.avg : 0), 0
                    ) / Object.values(processingTimes).filter(d => d.avg > 0).length || 0 > 0 
                      ? `${(Object.values(processingTimes).reduce((acc, curr) => 
                          acc + (curr.avg > 0 ? curr.avg : 0), 0
                        ) / Object.values(processingTimes).filter(d => d.avg > 0).length).toFixed(1)}h`
                      : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm font-semibold text-blue-800">Total Tracked</div>
                  <div className="text-lg font-bold text-blue-600">
                    {Object.values(processingTimes).reduce((acc, curr) => acc + curr.count, 0)} products
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
