"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadWeb3, getContract } from '@/lib/web3'

interface Medicine {
  id: string
  name: string
  description: string
  RMSid: string
  MANid: string
  DISid: string
  RETid: string
  stage: string
}

export default function ViewData() {
  const router = useRouter()
  const [loader, setLoader] = useState(true)
  const [med, setMed] = useState<{ [key: number]: Medicine }>({})
  const [medStage, setMedStage] = useState<{ [key: number]: string }>({})
  const [medTimestamps, setMedTimestamps] = useState<{ [key: number]: any }>({})

  useEffect(() => {
    loadWeb3()
    loadBlockchainData()
  }, [])

  const loadBlockchainData = async () => {
    try {
      setLoader(true)
      const { contract } = await getContract()

      const medCtr = await contract.methods.medicineCtr().call()
      const medData: { [key: number]: Medicine } = {}
      const medStageData: { [key: number]: string } = {}
      const medTimestampData: { [key: number]: any } = {}

      for (let i = 0; i < medCtr; i++) {
        const id = i + 1
        medData[id] = await contract.methods.MedicineStock(id).call()
        medStageData[id] = await contract.methods.showStage(id).call()
        medTimestampData[id] = await contract.methods.getMedicineTimestamps(id).call()
      }

      setMed(medData)
      setMedStage(medStageData)
      setMedTimestamps(medTimestampData)
      setLoader(false)
    } catch (err) {
      console.error('Error loading data for View Data page', err)
      setLoader(false)
      alert('Unable to load inventory data from the blockchain')
    }
  }

  const stages = ['Ordered', 'Raw Material', 'Manufacturing', 'Distribution', 'Retail', 'Sold']

  const computeStageCounts = () => {
    const counts: { [key: string]: number } = {}
    stages.forEach((s) => (counts[s] = 0))
    Object.keys(medStage).forEach((k) => {
      const s = medStage[parseInt(k)] || 'Ordered'
      if (s.toLowerCase().includes('order')) counts['Ordered']++
      else if (s.toLowerCase().includes('raw')) counts['Raw Material']++
      else if (s.toLowerCase().includes('manufactur')) counts['Manufacturing']++
      else if (s.toLowerCase().includes('distribut')) counts['Distribution']++
      else if (s.toLowerCase().includes('retail')) counts['Retail']++
      else if (s.toLowerCase().includes('sold')) counts['Sold']++
      else counts['Ordered']++
    })
    return counts
  }

  const formatUnixTimestamp = (timestamp: string | number | undefined) => {
    const ts = Number(timestamp || 0)
    if (!ts) return '-'
    return new Date(ts * 1000).toLocaleString()
  }

  if (loader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-700 mx-auto mb-4"></div>
          <div className="text-gray-700 font-semibold">Loading inventory data...</div>
        </div>
      </div>
    )
  }

  const stageCounts = computeStageCounts()
  const total = Object.keys(med).length
  const maxCount = Math.max(...Object.values(stageCounts), 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">View Data</h1>
            <p className="text-sm text-gray-500">Inventory summary and charts for the supply chain</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="px-4 py-2 bg-red-500 text-white rounded-lg">Home</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Items</div>
            <div className="text-3xl font-bold text-gray-800">{total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">In Transit / Processing</div>
            <div className="text-3xl font-bold text-gray-800">{total - (stageCounts['Sold'] || 0)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Sold</div>
            <div className="text-3xl font-bold text-gray-800">{stageCounts['Sold'] || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Inventory by Stage</h2>
          <div className="space-y-3">
            {stages.map((s) => {
              const count = stageCounts[s] || 0
              const widthPercent = Math.round((count / maxCount) * 100)
              return (
                <div key={s} className="flex items-center gap-4">
                  <div className="w-36 text-sm text-gray-600">{s}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div style={{ width: `${widthPercent}%` }} className="h-6 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"></div>
                  </div>
                  <div className="w-12 text-right font-semibold">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-sm text-gray-600">
                  <th className="py-2">Batch</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Stage</th>
                  <th className="py-2">Ordered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.keys(med)
                  .slice(-10)
                  .reverse()
                  .map((k) => {
                    const id = parseInt(k)
                    return (
                      <tr key={k} className="text-sm">
                        <td className="py-2 font-mono text-gray-700">B{med[id].id.toString().padStart(5, '0')}</td>
                        <td className="py-2 text-gray-800">{med[id].name}</td>
                        <td className="py-2 text-gray-700">{medStage[id]}</td>
                        <td className="py-2 text-gray-600">{formatUnixTimestamp(medTimestamps[id]?.orderedAt)}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
