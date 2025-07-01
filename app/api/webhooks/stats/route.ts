import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger } from "@/lib/webhook-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "24h"
    const groupBy = searchParams.get("groupBy") || "hour"

    // Get basic statistics
    const basicStats = globalWebhookLogger.getStatistics()

    // Calculate time-based statistics
    const now = new Date()
    let timeRange: Date

    switch (period) {
      case "1h":
        timeRange = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case "6h":
        timeRange = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case "24h":
        timeRange = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "7d":
        timeRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        timeRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        timeRange = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const events = globalWebhookLogger.getEvents()
    const periodEvents = events.filter((event) => new Date(event.timestamp) >= timeRange)

    // Group events by time
    const timeGroups: Record<string, number> = {}
    const typeBreakdown: Record<string, number> = {}
    const sourceBreakdown: Record<string, number> = {}

    periodEvents.forEach((event) => {
      const eventDate = new Date(event.timestamp)
      let timeKey: string

      switch (groupBy) {
        case "minute":
          timeKey = `${eventDate.getHours()}:${eventDate.getMinutes().toString().padStart(2, "0")}`
          break
        case "hour":
          timeKey = `${eventDate.getMonth() + 1}/${eventDate.getDate()} ${eventDate.getHours()}:00`
          break
        case "day":
          timeKey = `${eventDate.getMonth() + 1}/${eventDate.getDate()}`
          break
        default:
          timeKey = eventDate.toISOString().split("T")[0]
      }

      timeGroups[timeKey] = (timeGroups[timeKey] || 0) + 1
      typeBreakdown[event.type] = (typeBreakdown[event.type] || 0) + 1
      sourceBreakdown[event.source] = (sourceBreakdown[event.source] || 0) + 1
    })

    // Calculate trends
    const previousPeriodStart = new Date(timeRange.getTime() - (now.getTime() - timeRange.getTime()))
    const previousPeriodEvents = events.filter((event) => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= previousPeriodStart && eventDate < timeRange
    })

    const currentCount = periodEvents.length
    const previousCount = previousPeriodEvents.length
    const trend = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0

    // Top event types
    const topTypes = Object.entries(typeBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }))

    // Recent activity (last 10 events)
    const recentActivity = events.slice(0, 10).map((event) => ({
      id: event.id,
      type: event.type,
      source: event.source,
      timestamp: event.timestamp,
    }))

    // Error rate calculation
    const errorEvents = periodEvents.filter(
      (event) => event.type.includes("error") || event.metadata?.error || event.data?.error,
    )
    const errorRate = periodEvents.length > 0 ? (errorEvents.length / periodEvents.length) * 100 : 0

    return NextResponse.json({
      success: true,
      period,
      groupBy,
      timeRange: {
        start: timeRange.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        totalEvents: basicStats.total,
        periodEvents: currentCount,
        previousPeriodEvents: previousCount,
        trend: Math.round(trend * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
      },
      breakdown: {
        byTime: timeGroups,
        byType: typeBreakdown,
        bySource: sourceBreakdown,
      },
      topTypes,
      recentActivity,
      basicStats,
    })
  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
