'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadWeb3, getContract } from '@/lib/web3'
import RequireAuth from '@/components/RequireAuth'
import { dashboardHomePath, loadSession } from '@/lib/auth/clientSession'
import { checkIsOwner } from '@/lib/contractUtils'
import { formatRequestStatus, REQUEST_STATUS_NUM, requestStatusBadgeClass } from '@/lib/productRequestStatus'

type ChainRequest = {
  id: number
  retailerAddr: string
  productId: string
  productName: string
  description: string
  status: number
}

export default function AdminProductRequestsPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [account, setAccount] = useState('')
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [list, setList] = useState<ChainRequest[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)

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

  const load = useCallback(async (c: any) => {
    const ctr = await c.methods.requestCtr().call()
    const n = Number(ctr)
    const rows: ChainRequest[] = []
    for (let i = 1; i <= n; i++) {
      const r = await c.methods.ProductRequests(i).call()
      const st = Number(r.status)
      if (st !== REQUEST_STATUS_NUM.PendingAdmin) continue
      rows.push({
        id: i,
        retailerAddr: r.retailerAddr,
        productId: String(r.productId),
        productName: r.productName,
        description: r.description,
        status: st,
      })
    }
    rows.sort((a, b) => b.id - a.id)
    setList(rows)
  }, [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    ;(async () => {
      try {
        await loadWeb3()
        const { contract: c, account: a } = await getContract()
        const ownerOk = await checkIsOwner()
        if (cancelled) return
        setContract(c)
        setAccount(a)
        setIsOwner(ownerOk)
        await load(c)
      } catch (e: any) {
        console.error(e)
        alert(e?.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, load])

  const createSupplyOrder = async (r: ChainRequest) => {
    if (!contract || !isOwner) {
      alert('Connect the contract owner wallet in MetaMask.')
      return
    }
    setBusyId(r.id)
    try {
      await contract.methods.fulfillBackorderAsAdmin(r.id).send({ from: account })
      await load(contract)
      alert(
        'Supply order recorded on chain. New SKUs appear under Order Products; existing SKUs are linked without duplicating the product row.'
      )
    } catch (e: any) {
      alert(e?.message || 'Transaction failed')
    } finally {
      setBusyId(null)
    }
  }

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600" />
      </div>
    )
  }

  return (
    <RequireAuth mode="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-5">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 flex flex-wrap justify-between gap-4 items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product requests</h1>
              <p className="text-gray-600 text-sm mt-1">
                Retailer submissions awaiting a supply order on chain. Creating the order removes the item from this queue.
              </p>
              <p className="text-xs font-mono text-gray-500 mt-2">{account}</p>
              {!isOwner && <p className="text-sm text-amber-700 mt-2">Owner wallet required to confirm transactions.</p>}
            </div>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 rounded-xl bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all px-4 py-2.5"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-semibold">Home</span>
            </button>
          </div>

          {list.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-600">No requests in the admin queue.</div>
          ) : (
            <ul className="space-y-4">
              {list.map((r) => (
                <li key={r.id} className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{r.productName}</h3>
                      <p className="text-sm text-gray-600">Request #{r.id}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${requestStatusBadgeClass(r.status)}`}>
                      {formatRequestStatus(r.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{r.description}</p>
                  {r.productId !== '0' && (
                    <p className="text-sm text-gray-600 mt-2">
                      Name matches existing SKU <strong>#{r.productId}</strong>
                    </p>
                  )}
                  <p className="text-xs font-mono text-gray-500 mt-2">Retailer {r.retailerAddr}</p>
                  <button
                    type="button"
                    disabled={!isOwner || busyId === r.id}
                    onClick={() => createSupplyOrder(r)}
                    className="mt-4 px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold disabled:opacity-50"
                  >
                    {busyId === r.id ? 'Working…' : 'Create supply order on chain'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}
