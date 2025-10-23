import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    // If id is provided, fetch from backend
    if (id) {
      const response = await fetch(`${API_BASE_URL}/v1/status/${id}`)
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch refund status from backend' },
          { status: response.status }
        )
      }
      return NextResponse.json(await response.json())
    }

    // Otherwise, return mock data for demo
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
