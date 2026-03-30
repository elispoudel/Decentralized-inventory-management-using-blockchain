'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import { dashboardHomePath, loadSession } from '@/lib/auth/clientSession'
import type { PublicUser } from '@/lib/auth/types'
import { loadWeb3, getContract } from '@/lib/web3'
import { checkIsOwner, getContractOwner } from '@/lib/contractUtils'

interface ChainRole {
  addr: string
  id: string
  name: string
  place: string
}

type DbRoleRow = {
  email: string
  name: string
  location: string | null
  ethereumAddress: string | null
}

type DbRegistrations = {
  manufacturer: DbRoleRow[]
  warehouse: DbRoleRow[]
  retailer: DbRoleRow[]
  admin: DbRoleRow[]
}

const pendingRoleUi = {
  man: {
    plural: 'Manufacturers',
    gradient: 'from-green-500 to-green-600',
    bgGradient: 'from-green-50 to-green-100',
    borderColor: 'border-green-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  war: {
    plural: 'Warehouses',
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  ret: {
    plural: 'Retailers',
    gradient: 'from-orange-500 to-orange-600',
    bgGradient: 'from-orange-50 to-orange-100',
    borderColor: 'border-orange-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
}

export default function PendingBlockchainPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState('')
  const [pending, setPending] = useState<PublicUser[]>([])
  const [loadingPending, setLoadingPending] = useState(true)
  const [approveError, setApproveError] = useState('')
  const [ethereumByUserId, setEthereumByUserId] = useState<Record<string, string>>({})
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [bcLoading, setBcLoading] = useState(true)
  const [supplyChain, setSupplyChain] = useState<unknown>(null)
  const [currentAccount, setCurrentAccount] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [contractOwner, setContractOwner] = useState('')
  const [chainRoles, setChainRoles] = useState<{ man: ChainRole[]; war: ChainRole[]; ret: ChainRole[] }>({
    man: [],
    war: [],
    ret: [],
  })
  const [dbRegistrations, setDbRegistrations] = useState<DbRegistrations>({
    manufacturer: [],
    warehouse: [],
    retailer: [],
    admin: [],
  })

  const loadPending = useCallback(async (t: string) => {
    setLoadingPending(true)
    try {
      const res = await fetch('/api/admin/pending', { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
      if (res.ok) setPending(data.pending || [])
    } catch {
      setPending([])
    } finally {
      setLoadingPending(false)
    }
  }, [])

  const loadPendingBlockchainSection = useCallback(async (t: string) => {
    setBcLoading(true)
    try {
      await loadWeb3()
      const { contract, account } = await getContract()
      setSupplyChain(contract)
      setCurrentAccount(account)

      const manCount = await contract.methods.manCtr().call()
      const warCount = await contract.methods.warCtr().call()
      const retCount = await contract.methods.retCtr().call()

      const man = await Promise.all(
        Array(parseInt(manCount, 10))
          .fill(null)
          .map((_, i) => contract.methods.MAN(i + 1).call())
      )
      const war = await Promise.all(
        Array(parseInt(warCount, 10))
          .fill(null)
          .map((_, i) => contract.methods.WAR(i + 1).call())
      )
      const ret = await Promise.all(
        Array(parseInt(retCount, 10))
          .fill(null)
          .map((_, i) => contract.methods.RET(i + 1).call())
      )

      setChainRoles({ man, war, ret })

      const res = await fetch('/api/admin/role-registrations', {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const data = (await res.json()) as DbRegistrations
        setDbRegistrations(data)
      }

      const ownerStatus = await checkIsOwner()
      setIsOwner(ownerStatus)
      const owner = await getContractOwner()
      setContractOwner(owner || '')
    } catch (e) {
      console.error(e)
    } finally {
      setBcLoading(false)
    }
  }, [])

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
    setToken(s.token)
    setReady(true)
    loadPending(s.token)
    loadPendingBlockchainSection(s.token)
  }, [router, loadPending, loadPendingBlockchainSection])

  const setEthFor = (userId: string, value: string) => {
    setEthereumByUserId((prev) => ({ ...prev, [userId]: value }))
  }

  const approve = async (userId: string) => {
    setApproveError('')
    const ethereumAddress = (ethereumByUserId[userId] ?? '').trim()
    if (!ethereumAddress) {
      setApproveError('Enter an Ethereum address before approving.')
      return
    }
    setActionLoadingId(userId)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, ethereumAddress }),
      })
      const d = await res.json()
      if (!res.ok) {
        setApproveError(d.error || 'Approval failed')
        return
      }
      setEthereumByUserId((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
      await loadPending(token)
      await loadPendingBlockchainSection(token)
    } catch {
      setApproveError('Network error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const removePending = async (userId: string) => {
    if (!confirm('Remove this registration? The account will be deleted and cannot be recovered.')) return
    setApproveError('')
    setActionLoadingId(userId)
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      })
      const d = await res.json()
      if (!res.ok) {
        setApproveError(d.error || 'Remove failed')
        return
      }
      setEthereumByUserId((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
      await loadPending(token)
      await loadPendingBlockchainSection(token)
    } catch {
      setApproveError('Network error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleAddToBlockchain = async (user: DbRoleRow, roleType: 'man' | 'war' | 'ret') => {
    if (!isOwner) {
      alert('Only the contract owner can add roles on-chain.')
      return
    }
    const sc = supplyChain as {
      methods: {
        addManufacturer: (a: string, n: string, p: string) => { send: (o: { from: string }) => Promise<unknown> }
        addWarehouse: (a: string, n: string, p: string) => { send: (o: { from: string }) => Promise<unknown> }
        addRetailer: (a: string, n: string, p: string) => { send: (o: { from: string }) => Promise<unknown> }
      }
    }
    if (!sc?.methods || !user.ethereumAddress) return

    try {
      let receipt: unknown
      const loc = user.location || ''
      switch (roleType) {
        case 'man':
          receipt = await sc.methods.addManufacturer(user.ethereumAddress, user.name, loc).send({ from: currentAccount })
          break
        case 'war':
          receipt = await sc.methods.addWarehouse(user.ethereumAddress, user.name, loc).send({ from: currentAccount })
          break
        case 'ret':
          receipt = await sc.methods.addRetailer(user.ethereumAddress, user.name, loc).send({ from: currentAccount })
          break
        default:
          return
      }
      if (receipt) {
        alert('Role added to blockchain successfully!')
        await loadPendingBlockchainSection(token)
      }
    } catch (err: unknown) {
      let errorMessage = 'An error occurred!'
      const e = err as { message?: string; error?: { message?: string } }
      if (e?.message) errorMessage = e.message
      else if (e?.error?.message) errorMessage = e.error.message
      else if (typeof err === 'string') errorMessage = err

      if (errorMessage.includes('revert') || errorMessage.includes('require')) {
        if (errorMessage.includes('Owner')) {
          errorMessage =
            'Only the contract owner can add roles. Use the account that deployed the contract in MetaMask.'
        } else {
          errorMessage = `Transaction failed: ${errorMessage}`
        }
      }
      console.error(err)
      alert(errorMessage)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Pending Blockchain Registration</h1>
                <p className="text-gray-600 text-sm">Review and register approved accounts on-chain</p>
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
          <div className="text-xs text-gray-500 font-mono">Account: {currentAccount || 'Not connected'}</div>
        </div>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200/80 p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-6">
            <div>
              <p className="text-sm text-gray-600 max-w-3xl">
                Review new sign-ups, approve them with an Ethereum address, then register those approved accounts on the
                smart contract. Use <span className="font-semibold text-indigo-700">Register Roles</span> when you need to
                create a wallet + on-chain role in one step.
              </p>
            </div>
          </div>

          {approveError && (
            <p className="text-sm text-red-600 mb-6 rounded-lg bg-red-50 border border-red-100 px-3 py-2">{approveError}</p>
          )}

          {/* Step 1: account approval */}
          <div className="mb-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 text-sm font-bold">
                1
              </span>
              Pending role approvals
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Manufacture, Warehouse, and Retailer requests from the main Register page. Enter an Ethereum address, then
              approve or remove.
            </p>
            {loadingPending ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : pending.length === 0 ? (
              <p className="text-gray-500 text-sm rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                No pending registrations.
              </p>
            ) : (
              <ul className="space-y-4">
                {pending.map((u) => {
                  const busy = actionLoadingId === u.id
                  const eth = ethereumByUserId[u.id] ?? ''
                  return (
                    <li
                      key={u.id}
                      className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-semibold text-gray-900">{u.name}</span>
                        <span className="text-gray-600 text-sm">{u.email}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 capitalize">
                          {u.role}
                        </span>
                        {u.location ? (
                          <span className="text-xs text-gray-500 w-full sm:w-auto">Location: {u.location}</span>
                        ) : null}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Ethereum address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="0x… (required before Approve)"
                          value={eth}
                          disabled={busy}
                          onChange={(e) => setEthFor(u.id, e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy || !eth.trim()}
                          onClick={() => approve(u.id)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busy ? 'Working…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removePending(u.id)}
                          className="px-4 py-2 rounded-lg border-2 border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Step 2: on-chain registration */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-900 text-sm font-bold">
                2
              </span>
              Add approved accounts on-chain
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Approved users in the database who are not yet on the contract. Connect the contract owner in MetaMask,
              then use <strong>Add to blockchain</strong> for each row.
            </p>
            {bcLoading ? (
              <p className="text-gray-500 text-sm py-8 text-center">Loading contract data…</p>
            ) : (
              <>
                <div className="text-xs text-gray-500 font-mono mb-2 break-all">Connected wallet: {currentAccount || '—'}</div>
                {!isOwner && contractOwner ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm px-3 py-2 mb-4">
                    Contract owner: <span className="font-mono">{contractOwner}</span>. Switch MetaMask to this account to
                    enable <strong>Add to blockchain</strong>.
                  </div>
                ) : null}

                <div className="space-y-6 mt-4">
                  {(['manufacturer', 'warehouse', 'retailer'] as const).map((roleKey) => {
                    const roleType = roleKey === 'manufacturer' ? 'man' : roleKey === 'warehouse' ? 'war' : 'ret'
                    const config = pendingRoleUi[roleType]
                    const dbList = dbRegistrations[roleKey]
                    const blockchainAddrs = new Set(chainRoles[roleType].map((r) => r.addr.toLowerCase()))
                    const pendingUsers = dbList.filter(
                      (u) =>
                        u.ethereumAddress != null &&
                        u.ethereumAddress !== '' &&
                        !blockchainAddrs.has(u.ethereumAddress.toLowerCase())
                    )
                    const totalCount = pendingUsers.length

                    return (
                      <div key={roleKey} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 bg-gradient-to-r ${config.gradient} rounded-lg flex items-center justify-center text-white`}
                            >
                              {config.icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{config.plural} — pending on-chain</h3>
                              <p className="text-xs text-gray-500">{totalCount} not yet on blockchain</p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-bold px-3 py-1 rounded-lg bg-gradient-to-r ${config.bgGradient} border ${config.borderColor}`}
                          >
                            {totalCount}
                          </span>
                        </div>

                        {totalCount === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-6">All clear for this role.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className={`bg-gradient-to-r ${config.bgGradient}`}>
                                  <th className="px-3 py-2 text-left font-bold text-gray-700">Name</th>
                                  <th className="px-3 py-2 text-left font-bold text-gray-700">Email</th>
                                  <th className="px-3 py-2 text-left font-bold text-gray-700">Location</th>
                                  <th className="px-3 py-2 text-left font-bold text-gray-700">Ethereum</th>
                                  <th className="px-3 py-2 text-left font-bold text-gray-700">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {pendingUsers.map((user, index) => (
                                  <tr key={`${user.email}-${index}`} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-800">{user.name}</td>
                                    <td className="px-3 py-2 text-gray-700">{user.email}</td>
                                    <td className="px-3 py-2 text-gray-600">{user.location ?? '—'}</td>
                                    <td className="px-3 py-2 font-mono text-xs text-gray-700">{user.ethereumAddress}</td>
                                    <td className="px-3 py-2">
                                      <button
                                        type="button"
                                        onClick={() => handleAddToBlockchain(user, roleType)}
                                        disabled={!isOwner}
                                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap ${
                                          isOwner
                                            ? `bg-gradient-to-r ${config.gradient} text-white hover:opacity-95`
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                      >
                                        {isOwner ? 'Add to blockchain' : 'Owner only'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  </div>
  )
}
