'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadWeb3, getContract } from '@/lib/web3'
import RequireAuth from '@/components/RequireAuth'
import { dashboardHomePath, loadSession } from '@/lib/auth/clientSession'
import { formatRequestStatus, requestStatusBadgeClass, retailerRequestProgressNote } from '@/lib/productRequestStatus'

const POLL_MS = 4000

export default function RetailerProductRequestPage() {
  const router = useRouter()
  const [readyRole, setReadyRole] = useState(false)
  const [account, setAccount] = useState('')
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState<
    Array<{
      id: number
      productId: string
      productName: string
      description: string
      status: number
      createdAt: string
      updatedAt: string
      linkedFulfillmentProductId: string
    }>
  >([])

  useEffect(() => {
    const s = loadSession()
    if (!s?.token) {
      router.replace('/login')
      return
    }
    if (s.user.role !== 'retailer') {
      router.replace(dashboardHomePath())
      return
    }
    setReadyRole(true)
  }, [router])

  const loadRequests = useCallback(async (c: any, addr: string) => {
    const ctr = await c.methods.requestCtr().call()
    const n = Number(ctr)
    const mine: typeof requests = []
    const addrL = addr.toLowerCase()
    for (let i = 1; i <= n; i++) {
      const r = await c.methods.ProductRequests(i).call()
      if (String(r.retailerAddr).toLowerCase() !== addrL) continue
      mine.push({
        id: i,
        productId: String(r.productId),
        productName: r.productName,
        description: r.description,
        status: Number(r.status),
        createdAt: String(r.createdAt),
        updatedAt: String(r.updatedAt),
        linkedFulfillmentProductId: String(r.linkedFulfillmentProductId ?? '0'),
      })
    }
    mine.sort((a, b) => b.id - a.id)
    setRequests(mine)
  }, [])

  useEffect(() => {
    if (!readyRole) return
    let cancelled = false
    ;(async () => {
      try {
        await loadWeb3()
        const { contract: c, account: a } = await getContract()
        if (cancelled) return
        setContract(c)
        setAccount(a)
        await loadRequests(c, a)
        const registered = await c.methods.isRetailer(a).call()
        setIsRegistered(registered)
      } catch (e: any) {
        console.error(e)
        alert(e?.message || 'Failed to load contract')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [readyRole, loadRequests])

  useEffect(() => {
    if (!contract || !account) return
    const t = window.setInterval(() => {
      loadRequests(contract, account).catch(console.error)
    }, POLL_MS)
    return () => window.clearInterval(t)
  }, [contract, account, loadRequests])

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contract) return
    if (!isRegistered) {
      alert('You are not registered as a retailer on the blockchain. Please contact the admin to register you.')
      return
    }
    if (!name.trim() || !description.trim()) {
      alert('Name and description are required.')
      return
    }
    setSubmitting(true)
    try {
      await contract.methods.requestProduct(name.trim(), description.trim()).send({ from: account })
      setName('')
      setDescription('')
      await loadRequests(contract, account)
      alert('Request submitted to the admin queue.')
    } catch (e: any) {
      alert(e?.message || 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!readyRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rose-600" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rose-600" />
      </div>
    )
  }

  return (
    <RequireAuth mode="operator">
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-100 p-5">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 flex flex-col gap-4 border border-rose-100/80">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Product request</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Submit product name and description to the admin queue. Your request list refreshes every few seconds so you see pending → product created without reloading.
                </p>
                <p className="text-xs font-mono text-gray-500 mt-2 truncate">Wallet: {account}</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => router.push(dashboardHomePath())}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-sm font-semibold shadow-sm transition-colors"
                >
                  Home
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-rose-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">New request</h2>
            <form onSubmit={submitRequest} className="space-y-4">
              <input
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-400"
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                required
              />
              <textarea
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-400 min-h-[100px]"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-lg hover:from-rose-600 hover:to-pink-600 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit request'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-rose-100">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Your requests</h2>
            <p className="text-sm text-gray-500 mb-4">
              After an admin creates the supply order, the status moves from pending to product created automatically.
            </p>
            {requests.length === 0 ? (
              <p className="text-gray-500">No requests yet.</p>
            ) : (
              <ul className="space-y-4">
                {requests.map((r) => {
                  const chainPid =
                    r.status === 1
                      ? (r.linkedFulfillmentProductId !== '0' ? r.linkedFulfillmentProductId : r.productId)
                      : null
                  return (
                    <li key={r.id} className="border border-rose-100/80 rounded-xl p-4 bg-gradient-to-r from-white to-rose-50/60 shadow-sm">
                      <div className="flex flex-wrap justify-between gap-2 items-start">
                        <div>
                          <span className="font-semibold text-gray-900">{r.productName}</span>
                          <span className="text-gray-500 text-sm ml-2">#{r.id}</span>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${requestStatusBadgeClass(r.status)}`}
                        >
                          {formatRequestStatus(r.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{r.description}</p>
                      <div
                        className={`mt-3 rounded-lg border px-3 py-2.5 text-sm leading-snug ${
                          r.status === 0
                            ? 'border-amber-200 bg-amber-50/90 text-amber-950'
                            : 'border-violet-200 bg-violet-50/90 text-violet-950'
                        }`}
                      >
                        <span className="font-semibold text-xs uppercase tracking-wide block mb-0.5 opacity-90">
                          Progress
                        </span>
                        {retailerRequestProgressNote(r.status)}
                      </div>
                      {chainPid && chainPid !== '0' && (
                        <p className="text-xs font-mono text-gray-600 mt-2">
                          On-chain product ID: <span className="font-bold text-gray-900">{chainPid}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-3">
                        Submitted:{' '}
                        <span className="font-medium text-gray-700">
                          {new Date(Number(r.createdAt) * 1000).toLocaleString()}
                        </span>
                        {r.updatedAt !== r.createdAt && (
                          <>
                            {' · '}
                            <span className="text-gray-400">Updated</span>{' '}
                            <span className="font-medium text-gray-700">
                              {new Date(Number(r.updatedAt) * 1000).toLocaleString()}
                            </span>
                          </>
                        )}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
