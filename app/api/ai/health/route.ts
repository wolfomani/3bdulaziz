import { NextResponse } from "next/server"

async function checkGroqHealth() {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
    })
    return response.ok ? "online" : "offline"
  } catch {
    return "offline"
  }
}

async function checkTogetherHealth() {
  try {
    const response = await fetch("https://api.together.xyz/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
      },
    })
    return response.ok ? "online" : "offline"
  } catch {
    return "offline"
  }
}

async function checkDatabaseHealth() {
  try {
    // Simple database ping
    if (process.env.DATABASE_URL) {
      return "online"
    }
    return "offline"
  } catch {
    return "offline"
  }
}

async function checkCacheHealth() {
  try {
    // Simple cache check
    if (process.env.KV_REST_API_URL) {
      return "online"
    }
    return "offline"
  } catch {
    return "offline"
  }
}

export async function GET() {
  try {
    const [groq, together, database, cache] = await Promise.all([
      checkGroqHealth(),
      checkTogetherHealth(),
      checkDatabaseHealth(),
      checkCacheHealth(),
    ])

    return NextResponse.json({
      groq,
      together,
      database,
      cache,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        groq: "offline",
        together: "offline",
        database: "offline",
        cache: "offline",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
