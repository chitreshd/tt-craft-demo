import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export async function GET() {
  try {
    // For demo purposes, you can either fetch from backend or return mock data
    // Uncomment the following to fetch from actual backend:
    // const response = await fetch(`${API_BASE_URL}/v1/status/12345`)
    // if (!response.ok) throw new Error('Failed to fetch status')
    // return NextResponse.json(await response.json())

    // Mock data for demo
    const mockData = {
      return_id: "TX2024-12345",
      status: "APPROVED",
      eta_date: "2024-02-02T00:00:00Z",
      confidence: 0.92,
      history: [
        {
          stage: "FILED",
          timestamp: "2024-01-14T10:00:00Z"
        },
        {
          stage: "ACCEPTED",
          timestamp: "2024-01-17T14:30:00Z"
        },
        {
          stage: "RETURN_RECEIVED",
          timestamp: "2024-01-19T09:15:00Z"
        },
        {
          stage: "APPROVED",
          timestamp: "2024-01-19T16:45:00Z"
        }
      ]
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('Error fetching status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refund status' },
      { status: 500 }
    )
  }
}
