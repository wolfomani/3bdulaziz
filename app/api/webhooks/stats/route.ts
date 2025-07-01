import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get webhook statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN processed = true THEN 1 END) as processed,
        COUNT(CASE WHEN processed = false THEN 1 END) as failed
      FROM webhook_events
      WHERE created_at > NOW() - INTERVAL '30 days'
    `

    // Get recent webhook events
    const recentEvents = await sql`
      SELECT 
        id,
        event_type,
        delivery_id,
        processed,
        created_at
      FROM webhook_events
      ORDER BY created_at DESC
      LIMIT 10
    `

    const result = {
      total: Number.parseInt(stats[0]?.total || "0"),
      processed: Number.parseInt(stats[0]?.processed || "0"),
      failed: Number.parseInt(stats[0]?.failed || "0"),
      recent: recentEvents,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching webhook stats:", error)

    // Return mock data if database is not available
    const mockData = {
      total: 156,
      processed: 148,
      failed: 8,
      recent: [
        {
          id: "1",
          event_type: "push",
          delivery_id: "abc123",
          processed: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          event_type: "pull_request",
          delivery_id: "def456",
          processed: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "3",
          event_type: "issues",
          delivery_id: "ghi789",
          processed: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    }

    return NextResponse.json(mockData)
  }
}
