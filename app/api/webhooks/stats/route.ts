import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger } from "@/lib/webhook-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "24h" // 1h, 24h, 7d, 30d
    const groupBy = searchParams.get("group_by") || "hour" // hour, day, type, source

    // Get all events
    const allEvents = globalWebhookLogger.getEvents()

    // Calculate time ranges
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
    const periodEvents = allEvents.filter((event) => new Date(event.timestamp) >= startTime)

    // Group events
    const groupedData: Record<string, any> = {}

    if (groupBy === "hour") {
      // Group by hour
      periodEvents.forEach((event) => {
        const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ":00:00.000Z"
        if (!groupedData[hour]) {
          groupedData[hour] = { count: 0, events: [] }
        }
        groupedData[hour].count++
        groupedData[hour].events.push(event.type)
      })
    } else if (groupBy === "day") {
      // Group by day
      periodEvents.forEach((event) => {
        const day = new Date(event.timestamp).toISOString().slice(0, 10)
        if (!groupedData[day]) {
          groupedData[day] = { count: 0, events: [] }
        }
        groupedData[day].count++
        groupedData[day].events.push(event.type)
      })
    } else if (groupBy === "type") {
      // Group by event type
      periodEvents.forEach((event) => {
        if (!groupedData[event.type]) {
          groupedData[event.type] = { count: 0, latest: null, sources: new Set() }
        }
        groupedData[event.type].count++
        groupedData[event.type].latest = event.timestamp
        groupedData[event.type].sources.add(event.source)
      })

      // Convert sets to arrays
      Object.keys(groupedData).forEach((key) => {
        groupedData[key].sources = Array.from(groupedData[key].sources)
      })
    } else if (groupBy === "source") {
      // Group by source
      periodEvents.forEach((event) => {
        if (!groupedData[event.source]) {
          groupedData[event.source] = { count: 0, types: new Set(), latest: null }
        }
        groupedData[event.source].count++
        groupedData[event.source].types.add(event.type)
        groupedData[event.source].latest = event.timestamp
      })

      // Convert sets to arrays
      Object.keys(groupedData).forEach((key) => {
        groupedData[key].types = Array.from(groupedData[key].types)
      })
    }

    // Calculate summary statistics
    const summary = {
      total_events: allEvents.length,
      period_events: periodEvents.length,
      period_start: startTime.toISOString(),
      period_end: now.toISOString(),
      unique_sources: [...new Set(periodEvents.map((e) => e.source))],
      unique_types: [...new Set(periodEvents.map((e) => e.type))],
      events_per_hour:
        periodEvents.length / (period === "1h" ? 1 : period === "24h" ? 24 : period === "7d" ? 168 : 720),
      most_active_source: getMostActive(periodEvents, "source"),
      most_common_type: getMostActive(periodEvents, "type"),
    }

    // Calculate trends
    const trends = calculateTrends(periodEvents, period)

    return NextResponse.json({
      success: true,
      period,
      group_by: groupBy,
      summary,
      grouped_data: groupedData,
      trends,
      generated_at: now.toISOString(),
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

function getMostActive(events: any[], field: "source" | "type"): { name: string; count: number } | null {
  const counts: Record<string, number> = {}

  events.forEach((event) => {
    const value = event[field]
    counts[value] = (counts[value] || 0) + 1
  })

  const entries = Object.entries(counts)
  if (entries.length === 0) return null

  const [name, count] = entries.reduce((max, current) => (current[1] > max[1] ? current : max))
  return { name, count }
}

function calculateTrends(events: any[], period: string) {
  const now = new Date()
  const halfPeriod =
    period === "1h"
      ? 30 * 60 * 1000
      : period === "24h"
        ? 12 * 60 * 60 * 1000
        : period === "7d"
          ? 3.5 * 24 * 60 * 60 * 1000
          : 15 * 24 * 60 * 60 * 1000

  const midPoint = new Date(now.getTime() - halfPeriod)

  const firstHalf = events.filter((event) => new Date(event.timestamp) < midPoint)
  const secondHalf = events.filter((event) => new Date(event.timestamp) >= midPoint)

  const trend = secondHalf.length - firstHalf.length
  const trendPercentage = firstHalf.length > 0 ? ((trend / firstHalf.length) * 100).toFixed(1) : "N/A"

  return {
    first_half_count: firstHalf.length,
    second_half_count: secondHalf.length,
    trend_direction: trend > 0 ? "increasing" : trend < 0 ? "decreasing" : "stable",
    trend_change: trend,
    trend_percentage: trendPercentage,
  }
}
