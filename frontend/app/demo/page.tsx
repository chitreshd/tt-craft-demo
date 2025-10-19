"use client"
import { useState, useEffect } from "react"
import { RefundStatusCard } from "@/components/RefundStatusCard"
import { RefundExplainBox } from "@/components/RefundExplainBox"
import type { RefundStatus } from "@/components/RefundStatusCard"

export default function DemoPage() {
  const [status, setStatus] = useState<RefundStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/status")
        if (!response.ok) {
          throw new Error("Failed to fetch refund status")
        }
        const data = await response.json()
        setStatus(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Refund Status Tracker
            </h1>
            <p className="text-lg text-gray-600">
              Track your tax refund in real-time
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="text-gray-600 mt-4">Loading refund status...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Content */}
          {status && !loading && !error && (
            <>
              <RefundStatusCard data={status} />
              <RefundExplainBox returnId={status.return_id} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
