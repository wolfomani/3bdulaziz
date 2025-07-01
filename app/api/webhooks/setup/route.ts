import { NextResponse } from "next/server"

export async function GET() {
  const setupInstructions = {
    title: "Dr X Webhook Setup Guide",
    description: "Complete guide to setting up webhooks for the Dr X platform",

    endpoints: {
      main: {
        url: "https://3bdulaziz.vercel.app/api/webhooks",
        description: "Main webhook endpoint - handles all webhook types",
        methods: ["POST", "GET"],
      },
      github: {
        url: "https://3bdulaziz.vercel.app/api/webhooks/github",
        description: "GitHub-specific webhook endpoint",
        methods: ["POST"],
      },
      vercel: {
        url: "https://3bdulaziz.vercel.app/api/webhooks/vercel",
        description: "Vercel deployment webhook endpoint",
        methods: ["POST"],
      },
      test: {
        url: "https://3bdulaziz.vercel.app/api/webhooks/test",
        description: "Test webhook endpoint",
        methods: ["POST", "GET"],
      },
    },

    github_setup: {
      title: "GitHub Webhook Setup",
      steps: [
        {
          step: 1,
          title: "Navigate to Repository Settings",
          description: "Go to your GitHub repository → Settings → Webhooks",
          url: "https://github.com/wolfomani/3bdulaziz/settings/hooks",
        },
        {
          step: 2,
          title: "Add New Webhook",
          description: "Click 'Add webhook' button",
        },
        {
          step: 3,
          title: "Configure Webhook",
          description: "Fill in the webhook configuration",
          config: {
            payload_url: "https://3bdulaziz.vercel.app/api/webhooks/github",
            content_type: "application/json",
            secret: "drx3rx3skabcdef1984767850aregiskpqbcdef1234567890",
            events: ["push", "pull_request", "issues", "release", "star"],
            active: true,
          },
        },
        {
          step: 4,
          title: "Test the Webhook",
          description: "GitHub will send a ping event to test the webhook",
        },
      ],
      curl_example: `curl -X POST https://api.github.com/repos/wolfomani/3bdulaziz/hooks \\
  -H "Authorization: token YOUR_GITHUB_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "web",
    "active": true,
    "events": ["push", "pull_request", "issues"],
    "config": {
      "url": "https://3bdulaziz.vercel.app/api/webhooks/github",
      "content_type": "json",
      "secret": "drx3rx3skabcdef1984767850aregiskpqbcdef1234567890"
    }
  }'`,
    },

    vercel_setup: {
      title: "Vercel Deploy Hook Setup",
      steps: [
        {
          step: 1,
          title: "Access Project Settings",
          description: "Go to Vercel Dashboard → Your Project → Settings → Git",
        },
        {
          step: 2,
          title: "Create Deploy Hook",
          description: "Scroll to 'Deploy Hooks' section and create a new hook",
          config: {
            name: "Dr X Webhook",
            branch: "main",
          },
        },
        {
          step: 3,
          title: "Configure Webhook Notification",
          description: "Add webhook notification URL",
          webhook_url: "https://3bdulaziz.vercel.app/api/webhooks/vercel",
        },
      ],
      curl_example: `# Trigger deployment
curl -X POST 'YOUR_VERCEL_DEPLOY_HOOK_URL'

# Or with custom webhook notification
curl -X POST 'YOUR_VERCEL_DEPLOY_HOOK_URL' \\
  -H "Content-Type: application/json" \\
  -d '{"webhook": "https://3bdulaziz.vercel.app/api/webhooks/vercel"}'`,
    },

    testing: {
      title: "Testing Your Webhooks",
      methods: [
        {
          name: "Test Endpoint",
          description: "Use the built-in test endpoint",
          examples: [
            {
              title: "Basic Test",
              curl: `curl -X POST https://3bdulaziz.vercel.app/api/webhooks/test \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello from Dr X!"}'`,
            },
            {
              title: "GitHub Push Simulation",
              curl: `curl -X GET "https://3bdulaziz.vercel.app/api/webhooks/test?scenario=github_push"`,
            },
            {
              title: "Vercel Deployment Simulation",
              curl: `curl -X GET "https://3bdulaziz.vercel.app/api/webhooks/test?scenario=vercel_deployment"`,
            },
          ],
        },
        {
          name: "Webhook.site Monitoring",
          description: "Monitor webhook deliveries in real-time",
          url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
        },
        {
          name: "Event Logs",
          description: "Check webhook event logs via API",
          examples: [
            {
              title: "Recent Events",
              curl: `curl "https://3bdulaziz.vercel.app/api/webhooks/events?limit=10"`,
            },
            {
              title: "GitHub Events Only",
              curl: `curl "https://3bdulaziz.vercel.app/api/webhooks/events?source=github"`,
            },
            {
              title: "Statistics",
              curl: `curl "https://3bdulaziz.vercel.app/api/webhooks/stats?period=24h"`,
            },
          ],
        },
      ],
    },

    troubleshooting: {
      title: "Common Issues & Solutions",
      issues: [
        {
          problem: "Webhook not receiving events",
          solutions: [
            "Check the webhook URL is correct and accessible",
            "Verify the webhook is active in GitHub/Vercel settings",
            "Check firewall and network settings",
            "Test with the /api/webhooks/test endpoint",
          ],
        },
        {
          problem: "Signature verification failed",
          solutions: [
            "Ensure the secret matches exactly",
            "Check for extra whitespace in the secret",
            "Verify the signature algorithm (SHA-256 for GitHub)",
            "Test without signature first, then add it back",
          ],
        },
        {
          problem: "Events not being processed",
          solutions: [
            "Check server logs for errors",
            "Verify the webhook handler is running",
            "Test with different event types",
            "Check the event format matches expected structure",
          ],
        },
        {
          problem: "High latency or timeouts",
          solutions: [
            "Optimize webhook processing logic",
            "Use async processing for heavy operations",
            "Implement proper error handling",
            "Consider using a queue for processing",
          ],
        },
      ],
    },

    security: {
      title: "Security Best Practices",
      practices: [
        {
          title: "Use Webhook Secrets",
          description: "Always use webhook secrets to verify payload authenticity",
          secret: "drx3rx3skabcdef1984767850aregiskpqbcdef1234567890",
        },
        {
          title: "Validate Signatures",
          description: "Verify HMAC signatures for all incoming webhooks",
        },
        {
          title: "Use HTTPS",
          description: "Always use HTTPS endpoints for webhook URLs",
        },
        {
          title: "Rate Limiting",
          description: "Implement rate limiting to prevent abuse",
        },
        {
          title: "Input Validation",
          description: "Validate all incoming webhook payloads",
        },
        {
          title: "Error Handling",
          description: "Implement proper error handling and logging",
        },
      ],
    },

    monitoring: {
      title: "Monitoring & Analytics",
      tools: [
        {
          name: "Webhook.site",
          url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
          description: "Real-time webhook monitoring and debugging",
        },
        {
          name: "Events API",
          url: "https://3bdulaziz.vercel.app/api/webhooks/events",
          description: "Query and filter webhook events",
        },
        {
          name: "Statistics API",
          url: "https://3bdulaziz.vercel.app/api/webhooks/stats",
          description: "Webhook analytics and performance metrics",
        },
        {
          name: "Management UI",
          url: "https://3bdulaziz.vercel.app/webhooks",
          description: "Web interface for webhook management",
        },
      ],
    },
  }

  return NextResponse.json(setupInstructions, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  })
}
