import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger } from "@/lib/webhook-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const source = searchParams.get("source")
    const type = searchParams.get("type")
    const since = searchParams.get("since")
    const until = searchParams.get("until")

    // Get all events
    let events = globalWebhookLogger.getEvents()

    // Apply filters
    if (source) {
      events = events.filter((event) => event.source === source)
    }

    if (type) {
      events = events.filter((event) => event.type.includes(type))
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

    // Calculate statistics
    const statistics = globalWebhookLogger.getStatistics()

    return NextResponse.json({
      success: true,
      events: paginatedEvents,
      pagination: {
        total: totalEvents,
        limit,
        offset,
        has_more: offset + limit < totalEvents,
        next_offset: offset + limit < totalEvents ? offset + limit : null,
      },
      filters: {
        source,
        type,
        since,
        until,
      },
      statistics,
    })
  } catch (error) {
    console.error("Events API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve events",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("id")
    const clearAll = searchParams.get("clear") === "true"

    if (clearAll) {
      // Clear all events
      const deletedCount = globalWebhookLogger.clearEvents()

      return NextResponse.json({
        success: true,
        message: `Cleared ${deletedCount} webhook events`,
        deleted_count: deletedCount,
      })
    } else if (eventId) {
      // Delete specific event
      const deleted = globalWebhookLogger.deleteEvent(eventId)

      if (deleted) {
        return NextResponse.json({
          success: true,
          message: `Event ${eventId} deleted successfully`,
          event_id: eventId,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Event not found",
            event_id: eventId,
          },
          { status: 404 },
        )
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Missing event ID or clear parameter",
          usage: {
            delete_specific: "DELETE /api/webhooks/events?id=event_id",
            clear_all: "DELETE /api/webhooks/events?clear=true",
          },
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Events DELETE error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete events",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, event_ids } = body

    if (action === "bulk_delete" && Array.isArray(event_ids)) {
      let deletedCount = 0
      const results = []

      for (const eventId of event_ids) {
        const deleted = globalWebhookLogger.deleteEvent(eventId)
        if (deleted) {
          deletedCount++
          results.push({ event_id: eventId, deleted: true })
        } else {
          results.push({ event_id: eventId, deleted: false, reason: "not_found" })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk delete completed: ${deletedCount}/${event_ids.length} events deleted`,
        deleted_count: deletedCount,
        total_requested: event_ids.length,
        results,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action or missing event_ids",
          supported_actions: ["bulk_delete"],
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Events POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process bulk action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
