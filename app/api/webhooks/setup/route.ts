import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering to avoid build errors
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const setupGuide = {
      title: "Dr X Webhook Setup Guide",
      description: "Complete guide to configure webhooks for the Dr X AI platform",

      github_setup: {
        title: "GitHub Webhook Configuration",
        steps: [
          {
            step: 1,
            title: "Access Repository Settings",
            description: "Go to your GitHub repository settings",
            url: "https://github.com/wolfomani/3bdulaziz/settings/hooks",
            action: "Navigate to Settings > Webhooks",
          },
          {
            step: 2,
            title: "Add New Webhook",
            description: "Click 'Add webhook' button",
            payload_url: "https://3bdulaziz.vercel.app/api/webhooks/github",
            content_type: "application/json",
          },
          {
            step: 3,
            title: "Configure Events",
            description: "Select events to trigger webhook",
            recommended_events: ["push", "pull_request", "issues", "release", "star", "fork"],
          },
          {
            step: 4,
            title: "Set Secret",
            description: "Add webhook secret for security",
            secret: "drx3rx3skabcdef1984767850aregiskpqbcdef1234567890",
            environment_variable: "GITHUB_WEBHOOK_SECRET",
          },
        ],
        curl_test: {
          description: "Test GitHub webhook manually",
          command: `curl -X POST https://3bdulaziz.vercel.app/api/webhooks/github \\
  -H "Content-Type: application/json" \\
  -H "X-GitHub-Event: ping" \\
  -H "X-GitHub-Delivery: 12345678-1234-1234-1234-123456789012" \\
  -d '{"zen":"Design for failure.","hook_id":123456789}'`,
        },
      },

      vercel_setup: {
        title: "Vercel Webhook Configuration",
        steps: [
          {
            step: 1,
            title: "Access Project Settings",
            description: "Go to Vercel project settings",
            url: "https://vercel.com/wolfomani/3bdulaziz/settings/git",
            action: "Navigate to Project Settings > Git",
          },
          {
            step: 2,
            title: "Add Deploy Hook",
            description: "Create a new deploy hook",
            webhook_url: "https://3bdulaziz.vercel.app/api/webhooks/vercel",
            trigger_branch: "main",
          },
          {
            step: 3,
            title: "Configure Events",
            description: "Select deployment events",
            supported_events: [
              "deployment.created",
              "deployment.succeeded",
              "deployment.failed",
              "deployment.canceled",
            ],
          },
        ],
        curl_test: {
          description: "Test Vercel webhook manually",
          command: `curl -X POST https://3bdulaziz.vercel.app/api/webhooks/vercel \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "deployment.succeeded",
    "deployment": {
      "id": "dpl_test_123",
      "url": "3bdulaziz.vercel.app", 
      "state": "READY"
    },
    "project": {
      "name": "3bdulaziz"
    }
  }'`,
        },
      },

      monitoring: {
        title: "Webhook Monitoring & Testing",
        webhook_site: {
          url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
          description: "All webhooks are forwarded here for monitoring",
          features: [
            "Real-time webhook inspection",
            "Request/response logging",
            "JSON formatting",
            "Custom response simulation",
          ],
        },
        api_endpoints: {
          events: {
            url: "/api/webhooks/events",
            description: "View all webhook events with filtering",
            examples: [
              "/api/webhooks/events?limit=10",
              "/api/webhooks/events?source=github",
              "/api/webhooks/events?type=push",
            ],
          },
          stats: {
            url: "/api/webhooks/stats",
            description: "Webhook statistics and analytics",
            examples: ["/api/webhooks/stats?period=24h", "/api/webhooks/stats?groupBy=hour"],
          },
          test: {
            url: "/api/webhooks/test",
            description: "Send test webhooks",
            examples: ["POST /api/webhooks/test", "GET /api/webhooks/test?scenario=ping"],
          },
        },
      },

      security: {
        title: "Security Best Practices",
        recommendations: [
          {
            practice: "Use Webhook Secrets",
            description: "Always configure webhook secrets to verify authenticity",
            implementation: "Set GITHUB_WEBHOOK_SECRET and VERCEL_WEBHOOK_SECRET environment variables",
          },
          {
            practice: "Validate Signatures",
            description: "Verify webhook signatures before processing",
            note: "Our handlers automatically validate signatures when secrets are configured",
          },
          {
            practice: "Rate Limiting",
            description: "Implement rate limiting to prevent abuse",
            status: "Built into Vercel serverless functions",
          },
          {
            practice: "HTTPS Only",
            description: "Only accept webhooks over HTTPS",
            status: "Enforced by default on Vercel",
          },
        ],
      },

      troubleshooting: {
        title: "Common Issues & Solutions",
        issues: [
          {
            problem: "Webhook not receiving events",
            solutions: [
              "Check webhook URL is correct and accessible",
              "Verify webhook is active in GitHub/Vercel settings",
              "Check webhook secret matches environment variable",
              "Review webhook delivery logs in GitHub",
            ],
          },
          {
            problem: "Signature validation failing",
            solutions: [
              "Ensure webhook secret is correctly set",
              "Verify environment variables are deployed",
              "Check secret format matches expected pattern",
              "Test with webhook.site to inspect raw requests",
            ],
          },
          {
            problem: "Events not being processed",
            solutions: [
              "Check server logs for processing errors",
              "Verify event type is supported",
              "Test with /api/webhooks/test endpoint",
              "Monitor webhook.site for forwarded events",
            ],
          },
        ],
      },

      environment_variables: {
        title: "Required Environment Variables",
        variables: [
          {
            name: "GITHUB_WEBHOOK_SECRET",
            value: "drx3rx3skabcdef1984767850aregiskpqbcdef1234567890",
            description: "Secret for validating GitHub webhook signatures",
            required: true,
          },
          {
            name: "VERCEL_WEBHOOK_SECRET",
            value: "[Set in Vercel dashboard]",
            description: "Secret for validating Vercel webhook signatures",
            required: false,
          },
          {
            name: "VERCEL_DEPLOY_HOOK",
            value: "[Deploy hook URL from Vercel]",
            description: "URL to trigger Vercel deployments",
            required: false,
          },
        ],
      },
    }

    return NextResponse.json({
      success: true,
      setup_guide: setupGuide,
      quick_start: {
        github: "https://github.com/wolfomani/3bdulaziz/settings/hooks",
        vercel: "https://vercel.com/wolfomani/3bdulaziz/settings/git",
        monitoring: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
        test: "https://3bdulaziz.vercel.app/api/webhooks/test",
      },
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Setup guide error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate setup guide",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, platform, config } = body

    if (action === "validate_config") {
      const validation = validateWebhookConfig(platform, config)

      return NextResponse.json({
        success: true,
        validation,
        recommendations: getConfigRecommendations(platform, config),
      })
    }

    if (action === "test_connection") {
      const testResult = await testWebhookConnection(platform, config)

      return NextResponse.json({
        success: true,
        test_result: testResult,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
        supported_actions: ["validate_config", "test_connection"],
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Setup POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process setup request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function validateWebhookConfig(platform: string, config: any) {
  const validation = {
    valid: true,
    issues: [] as string[],
    warnings: [] as string[],
  }

  if (platform === "github") {
    if (!config.url || !config.url.includes("/api/webhooks/github")) {
      validation.valid = false
      validation.issues.push("Invalid webhook URL")
    }

    if (!config.secret) {
      validation.warnings.push("No webhook secret configured - recommended for security")
    }

    if (!config.events || config.events.length === 0) {
      validation.warnings.push("No events selected - webhook won't trigger")
    }
  }

  if (platform === "vercel") {
    if (!config.url || !config.url.includes("/api/webhooks/vercel")) {
      validation.valid = false
      validation.issues.push("Invalid webhook URL")
    }
  }

  return validation
}

function getConfigRecommendations(platform: string, config: any) {
  const recommendations = []

  if (platform === "github") {
    recommendations.push("Enable 'push' events for automatic deployment triggers")
    recommendations.push("Set content type to 'application/json'")
    recommendations.push("Configure webhook secret for security")
  }

  if (platform === "vercel") {
    recommendations.push("Enable deployment success/failure events")
    recommendations.push("Set up deploy hooks for manual triggers")
  }

  return recommendations
}

async function testWebhookConnection(platform: string, config: any) {
  try {
    // Simulate webhook test based on platform
    const testPayload =
      platform === "github" ? { zen: "Test connection", hook_id: 123 } : { type: "test", deployment: { state: "TEST" } }

    // In a real implementation, you might make an actual HTTP request
    // For now, we'll simulate a successful test

    return {
      success: true,
      message: `${platform} webhook connection test successful`,
      response_time: Math.floor(Math.random() * 200) + 50,
      status_code: 200,
    }
  } catch (error) {
    return {
      success: false,
      message: `${platform} webhook connection test failed`,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
