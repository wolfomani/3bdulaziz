interface WebhookConfig {
  url: string
  secret?: string
  retryAttempts: number
  timeout: number
}

export class WebhookHandler {
  private config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = config
  }

  async send(payload: any, headers: Record<string, string> = {}): Promise<boolean> {
    let attempts = 0

    while (attempts < this.config.retryAttempts) {
      try {
        const response = await fetch(this.config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Timestamp": Date.now().toString(),
            "X-Webhook-Signature": this.generateSignature(payload),
            ...headers,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.config.timeout),
        })

        if (response.ok) {
          return true
        }

        console.warn(`Webhook attempt ${attempts + 1} failed:`, response.status)
      } catch (error) {
        console.error(`Webhook attempt ${attempts + 1} error:`, error)
      }

      attempts++

      if (attempts < this.config.retryAttempts) {
        await this.delay(Math.pow(2, attempts) * 1000) // Exponential backoff
      }
    }

    return false
  }

  private generateSignature(payload: any): string {
    if (!this.config.secret) return "no-signature"

    // In a real implementation, use HMAC-SHA256
    return `sha256=${Buffer.from(JSON.stringify(payload) + this.config.secret).toString("base64")}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Default webhook configurations
export const webhookConfigs = {
  webhookSite: {
    url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
    retryAttempts: 3,
    timeout: 10000,
  },
  github: {
    url: "https://api.github.com/repos/wolfomani/3bdulaziz/dispatches",
    retryAttempts: 2,
    timeout: 5000,
  },
}
