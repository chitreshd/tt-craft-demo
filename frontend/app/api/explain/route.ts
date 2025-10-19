import { NextRequest } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { return_id, question } = body

    // For demo purposes, you can either stream from backend or return mock stream
    // Uncomment the following to stream from actual backend:
    // const response = await fetch(`${API_BASE_URL}/v1/status/explain`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ return_id, question })
    // })
    // if (!response.ok) throw new Error('Failed to get explanation')
    // return new Response(response.body, {
    //   headers: {
    //     'Content-Type': 'text/event-stream',
    //     'Cache-Control': 'no-cache',
    //     'Connection': 'keep-alive',
    //   },
    // })

    // Mock streaming response for demo
    const encoder = new TextEncoder()
    const mockExplanation = `Based on your refund status, here's what's happening:

Your tax return was filed on January 14th and accepted by the IRS on January 17th. The return was received and processed on January 19th, and your refund was approved the same day.

Your refund is currently in the "Approved" stage, which means the IRS has finished processing your return and approved your refund amount. The next step is for the refund to be sent, which typically happens within 1-2 business days after approval.

Your expected refund date is February 2nd. This timeline is based on:
- Standard IRS processing times for e-filed returns
- Current IRS workload and processing capacity
- Historical data for similar refund cases

The confidence level for this estimate is 92%, which is quite high. This means there's a strong likelihood you'll receive your refund on or before the expected date.

If you don't see your refund by February 5th, you may want to contact the IRS for additional information.`

    const stream = new ReadableStream({
      async start(controller) {
        const words = mockExplanation.split(' ')
        for (const word of words) {
          controller.enqueue(encoder.encode(word + ' '))
          await new Promise(resolve => setTimeout(resolve, 50)) // Simulate streaming delay
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error getting explanation:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get explanation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
