import { type NextRequest, NextResponse } from "next/server"
import { globalWebhookLogger } from "@/lib/webhook-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Query parameters
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
    const total = events.length
    const paginatedEvents = events.slice(offset, offset + limit)

    // Calculate pagination info
    const hasMore = offset + limit < total
    const nextOffset = hasMore ? offset + limit : null

    return NextResponse.json({
      success: true,
      events: paginatedEvents,
      pagination: {
        total,
        limit,
        offset,
        count: paginatedEvents.length,
        hasMore,
        nextOffset,
      },
      filters: {
        type,
        source,
        since,
        until,
      },
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
    const action = searchParams.get("action")

    if (action === "clear") {
      // Clear all events
      const deletedCount = globalWebhookLogger.clearEvents()

      return NextResponse.json({
        success: true,
        message: `Cleared ${deletedCount} events`,
        deletedCount,
      })
    }

    if (eventId) {
      // Delete specific event
      const deleted = globalWebhookLogger.deleteEvent(eventId)

      if (deleted) {
        return NextResponse.json({
          success: true,
          message: `Event ${eventId} deleted`,
          eventId,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Event not found",
            eventId,
          },
          { status: 404 },
        )
      }
    }

    // Bulk delete by criteria
    const body = await request.json().catch(() => ({}))
    const { type, source, olderThan } = body

    const events = globalWebhookLogger.getEvents()
    let toDelete: string[] = []

    if (type) {
      toDelete = events.filter((event) => event.type.includes(type)).map((event) => event.id)
    } else if (source) {
      toDelete = events.filter((event) => event.source === source).map((event) => event.id)
    } else if (olderThan) {
      const cutoffDate = new Date(olderThan)
      toDelete = events.filter((event) => new Date(event.timestamp) < cutoffDate).map((event) => event.id)
    }

    // Delete the events
    let deletedCount = 0
    toDelete.forEach((id) => {
      if (globalWebhookLogger.deleteEvent(id)) {
        deletedCount++
      }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} events`,
      deletedCount,
      criteria: { type, source, olderThan },
    })
  } catch (error) {
    console.error("Delete events error:", error)
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
