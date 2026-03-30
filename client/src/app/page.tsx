'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadSession, roleDashboardPath } from '@/lib/auth/clientSession'

export default function LandingPage() {
  const router = useRouter()
  const [flash, setFlash] = useState<{ type: 'success' | 'pending'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('auth_flash')
      if (raw) {
        const parsed = JSON.parse(raw) as { type: 'success' | 'pending'; text: string }
        setFlash(parsed)
        sessionStorage.removeItem('auth_flash')
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      const s = loadSession()
      if (s?.token) {
        if (s.user.role === 'admin') {
          router.replace('/admin')
          return
        }
        if (s.user.approved) {
          router.replace(roleDashboardPath(s.user.role, true))
          return
        }
      }
      setLoading(false)
    }
    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Inventory</h3>
          <p className="text-gray-600">Initializing your blockchain inventory system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-fade-in">
      {/* Flash Message */}
      {flash && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <div
            className={`rounded-xl px-4 py-3 text-center shadow-lg mx-auto max-w-md ${
              flash.type === 'success'
                ? 'bg-green-50 text-green-800 border-2 border-green-200 font-bold'
                : 'bg-orange-50 border-2 border-orange-300 font-bold text-orange-700'
            }`}
          >
            {flash.text}
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <nav className="bg-white/40 backdrop-blur-md border-b border-white/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                {/* Top block */}
                <rect x="9" y="2" width="6" height="5" rx="1" fill="white"/>
                {/* Bottom left block */}
                <rect x="2" y="14" width="6" height="5" rx="1" fill="white"/>
                {/* Bottom right block */}
                <rect x="16" y="14" width="6" height="5" rx="1" fill="white"/>
                {/* Connecting lines */}
                <line x1="12" y1="7" x2="12" y2="11" stroke="white" strokeWidth="1.5" opacity="0.7"/>
                <line x1="12" y1="11" x2="5" y2="14" stroke="white" strokeWidth="1.5" opacity="0.7"/>
                <line x1="12" y1="11" x2="19" y2="14" stroke="white" strokeWidth="1.5" opacity="0.7"/>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Decentralized Inventory Management Using Blockchain</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2 rounded-lg font-semibold text-blue-600 hover:bg-blue-50 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Blockchain Inventory Revolution
            </h1>
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              Manage your inventory with complete transparency and security using blockchain technology. Real-time tracking, immutable records, and decentralized control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform transition hover:scale-[1.02] space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Create Account</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl font-bold text-indigo-700 bg-white border-2 border-indigo-200 hover:bg-indigo-50 shadow-md transition space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2m14-4V7a2 2 0 00-2-2H7a2 2 0 00-2 2v4m14 0a2 2 0 01-2 2H7a2 2 0 01-2-2m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v10" />
                </svg>
                <span>Sign In</span>
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/60">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Instant Tracking</p>
                    <p className="text-sm text-gray-600">Real-time visibility</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Secure Records</p>
                    <p className="text-sm text-gray-600">Immutable blockchain</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zM5 20a2 2 0 00-2-2H3m0 2v-1a6 6 0 0112 0v1h-1a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 0H5a2 2 0 00-2 2v1h4v-1a6 6 0 00-12 0v1h1a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Multi-Role Support</p>
                    <p className="text-sm text-gray-600">Distributed access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/30 backdrop-blur-sm border-t border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Powerful <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-gray-600 text-lg">Everything you need to manage your inventory efficiently</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 border border-white/60 hover:shadow-xl transition transform hover:scale-[1.02]">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Verified Transactions</h3>
              <p className="text-gray-600 leading-relaxed">Every transaction is verified and recorded on the blockchain with complete transparency and auditability.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 border border-white/60 hover:shadow-xl transition transform hover:scale-[1.02]">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Fast & Efficient</h3>
              <p className="text-gray-600 leading-relaxed">Powered by blockchain technology for instant processing and minimal latency in critical operations.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 border border-white/60 hover:shadow-xl transition transform hover:scale-[1.02]">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Secure & Private</h3>
              <p className="text-gray-600 leading-relaxed">Advanced cryptographic security with role-based access control and encrypted data storage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-12 border-2 border-indigo-200 shadow-xl">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Ready to Transform Your Inventory?</h2>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Join thousands of organizations using blockchain technology to revolutionize their inventory management. Get started in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex justify-center items-center px-10 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform transition hover:scale-[1.02]"
              >
                Start Free Today
              </Link>
              <Link
                href="/login"
                className="inline-flex justify-center items-center px-10 py-4 rounded-xl font-bold text-indigo-700 bg-white border-2 border-indigo-300 hover:bg-indigo-50 shadow-md transition"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/40 bg-white/20 backdrop-blur-sm text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-sm text-gray-600">© 2026 All Rights Reserved | Developed as a Major Project for Advanced Engineering College</p>
        </div>
      </footer>
    </div>
  )
}
