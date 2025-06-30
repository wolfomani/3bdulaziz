import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger } from "@/lib/webhook-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "24h" // 1h, 24h, 7d, 30d
    const groupBy = searchParams.get("groupBy") || "hour" // hour, day, type, source

    const events = globalWebhookLogger.getEvents()

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalEvents: 0,
          period,
          groupBy,
          stats: {},
          message: "No webhook events found",
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Calculate time range based on period
    const now = new Date()
    let startTime: Date

    switch (period) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    // Filter events by time period
    const filteredEvents = events.filter((event) => new Date(event.timestamp) >= startTime)

    // Calculate basic statistics
    const totalEvents = filteredEvents.length
    const uniqueTypes = [...new Set(filteredEvents.map((e) => e.type))]
    const uniqueSources = [...new Set(filteredEvents.map((e) => e.source))]

    // Group events by specified criteria
    let groupedStats: Record<string, any> = {}

    switch (groupBy) {
      case "hour":
        groupedStats = groupEventsByHour(filteredEvents)
        break
      case "day":
        groupedStats = groupEventsByDay(filteredEvents)
        break
      case "type":
        groupedStats = groupEventsByType(filteredEvents)
        break
      case "source":
        groupedStats = groupEventsBySource(filteredEvents)
        break
    }

    // Calculate event rates
    const periodHours = getPeriodHours(period)
    const eventsPerHour = totalEvents / periodHours
    const eventsPerMinute = eventsPerHour / 60

    // Get top event types and sources
    const typeStats = getTypeStatistics(filteredEvents)
    const sourceStats = getSourceStatistics(filteredEvents)

    // Calculate success/error rates
    const successEvents = filteredEvents.filter((e) => !e.type.includes("error") && !e.type.includes("failed"))
    const errorEvents = filteredEvents.filter((e) => e.type.includes("error") || e.type.includes("failed"))
    const successRate = totalEvents > 0 ? (successEvents.length / totalEvents) * 100 : 0

    // Recent activity (last hour)
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    const recentEvents = filteredEvents.filter((event) => new Date(event.timestamp) >= lastHour)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEvents,
          uniqueTypes: uniqueTypes.length,
          uniqueSources: uniqueSources.length,
          period,
          timeRange: {
            start: startTime.toISOString(),
            end: now.toISOString(),
          },
        },
        rates: {
          eventsPerHour: Math.round(eventsPerHour * 100) / 100,
          eventsPerMinute: Math.round(eventsPerMinute * 100) / 100,
          successRate: Math.round(successRate * 100) / 100,
        },
        distribution: {
          byType: typeStats,
          bySource: sourceStats,
          successEvents: successEvents.length,
          errorEvents: errorEvents.length,
        },
        timeline: groupedStats,
        recentActivity: {
          lastHour: recentEvents.length,
          lastEvent: filteredEvents[0]?.timestamp || null,
        },
        topEvents: {
          mostCommonType: typeStats[0]?.type || null,
          mostActiveSource: sourceStats[0]?.source || null,
        },
      },
      metadata: {
        groupBy,
        calculatedAt: now.toISOString(),
        dataPoints: Object.keys(groupedStats).length,
      },
    })
  } catch (error) {
    console.error("Webhook stats error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate webhook statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper functions
function groupEventsByHour(events: any[]) {
  const groups: Record<string, number> = {}

  events.forEach((event) => {
    const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ":00:00Z"
    groups[hour] = (groups[hour] || 0) + 1
  })

  return groups
}

function groupEventsByDay(events: any[]) {
  const groups: Record<string, number> = {}

  events.forEach((event) => {
    const day = new Date(event.timestamp).toISOString().slice(0, 10)
    groups[day] = (groups[day] || 0) + 1
  })

  return groups
}

function groupEventsByType(events: any[]) {
  const groups: Record<string, number> = {}

  events.forEach((event) => {
    groups[event.type] = (groups[event.type] || 0) + 1
  })

  return groups
}

function groupEventsBySource(events: any[]) {
  const groups: Record<string, number> = {}

  events.forEach((event) => {
    groups[event.source] = (groups[event.source] || 0) + 1
  })

  return groups
}

function getTypeStatistics(events: any[]) {
  const typeCount: Record<string, number> = {}

  events.forEach((event) => {
    typeCount[event.type] = (typeCount[event.type] || 0) + 1
  })

  return Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

function getSourceStatistics(events: any[]) {
  const sourceCount: Record<string, number> = {}

  events.forEach((event) => {
    sourceCount[event.source] = (sourceCount[event.source] || 0) + 1
  })

  return Object.entries(sourceCount)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
}

function getPeriodHours(period: string): number {
  switch (period) {
    case "1h":
      return 1
    case "24h":
      return 24
    case "7d":
      return 7 * 24
    case "30d":
      return 30 * 24
    default:
      return 24
  }
}
