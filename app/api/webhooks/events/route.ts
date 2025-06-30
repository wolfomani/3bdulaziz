import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger } from "@/lib/webhook-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type")
    const source = searchParams.get("source")
    const since = searchParams.get("since")
    const until = searchParams.get("until")

    // Get all events
    let events = globalWebhookLogger.getEvents()

    // Apply filters
    if (type) {
      events = events.filter((event) => event.type.includes(type))
    }

    if (source) {
      events = events.filter((event) => event.source === source)
    }

    if (since) {
      const sinceDate = new Date(since)
      events = events.filter((event) => new Date(event.timestamp) >= sinceDate)
    }

    if (until) {
      const untilDate = new Date(until)
      events = events.filter((event) => new Date(event.timestamp) <= untilDate)
    }

    // Apply pagination
    const totalEvents = events.length
    const paginatedEvents = events.slice(offset, offset + limit)

    // Calculate summary statistics
    const eventTypes = [...new Set(events.map((e) => e.type))]
    const eventSources = [...new Set(events.map((e) => e.source))]
    const recentEvents = events.slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        events: paginatedEvents,
        pagination: {
          total: totalEvents,
          limit,
          offset,
          hasMore: offset + limit < totalEvents,
        },
        summary: {
          totalEvents,
          uniqueTypes: eventTypes.length,
          uniqueSources: eventSources.length,
          dateRange: {
            earliest: events.length > 0 ? events[events.length - 1].timestamp : null,
            latest: events.length > 0 ? events[0].timestamp : null,
          },
        },
        filters: {
          type,
          source,
          since,
          until,
        },
        availableTypes: eventTypes,
        availableSources: eventSources,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Events API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve events",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    // Clear all events
    const clearedCount = globalWebhookLogger.clearEvents()

    console.log(`Cleared ${clearedCount} webhook events`)

    return NextResponse.json({
      success: true,
      message: "All webhook events cleared successfully",
      clearedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Clear events error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear events",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, eventId, filters } = body

    switch (action) {
      case "delete_event":
        if (!eventId) {
          return NextResponse.json({ error: "Event ID required" }, { status: 400 })
        }

        const deleted = globalWebhookLogger.deleteEvent(eventId)
        return NextResponse.json({
          success: deleted,
          message: deleted ? "Event deleted successfully" : "Event not found",
        })

      case "bulk_delete":
        if (!filters) {
          return NextResponse.json({ error: "Filters required for bulk delete" }, { status: 400 })
        }

        let events = globalWebhookLogger.getEvents()

        // Apply filters for bulk delete
        if (filters.type) {
          events = events.filter((event) => event.type.includes(filters.type))
        }
        if (filters.source) {
          events = events.filter((event) => event.source === filters.source)
        }
        if (filters.before) {
          const beforeDate = new Date(filters.before)
          events = events.filter((event) => new Date(event.timestamp) < beforeDate)
        }

        // Delete filtered events
        let deletedCount = 0
        events.forEach((event) => {
          if (globalWebhookLogger.deleteEvent(event.id)) {
            deletedCount++
          }
        })

        return NextResponse.json({
          success: true,
          message: `Bulk deleted ${deletedCount} events`,
          deletedCount,
        })

      case "export":
        const exportEvents = globalWebhookLogger.getEvents()
        return NextResponse.json({
          success: true,
          data: exportEvents,
          exportedAt: new Date().toISOString(),
          totalEvents: exportEvents.length,
        })

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Events POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Action failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
