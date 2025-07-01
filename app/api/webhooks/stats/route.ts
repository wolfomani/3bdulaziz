import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get webhook statistics
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE processed = true) as processed_events,
        COUNT(*) FILTER (WHERE processed = false) as failed_events
      FROM webhook_events
      WHERE created_at > NOW() - INTERVAL '30 days'
    `

    const eventsBySource = await sql`
      SELECT source, COUNT(*) as count
      FROM webhook_events
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY source
    `

    const recentEvents = await sql`
      SELECT id, type, source, created_at, processed
      FROM webhook_events
      ORDER BY created_at DESC
      LIMIT 10
    `

    const webhookStats = {
      total_events: Number.parseInt(stats?.total_events || "0"),
      processed_events: Number.parseInt(stats?.processed_events || "0"),
      failed_events: Number.parseInt(stats?.failed_events || "0"),
      events_by_source: eventsBySource.reduce((acc: Record<string, number>, row: any) => {
        acc[row.source] = Number.parseInt(row.count)
        return acc
      }, {}),
      recent_events: recentEvents,
    }

    return NextResponse.json({
      success: true,
      stats: webhookStats,
    })
  } catch (error) {
    console.error("Get webhook stats error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ في جلب الإحصائيات",
        stats: {
          total_events: 0,
          processed_events: 0,
          failed_events: 0,
          events_by_source: {},
          recent_events: [],
        },
      },
      { status: 200 }, // Return 200 to avoid client errors
    )
  }
}
