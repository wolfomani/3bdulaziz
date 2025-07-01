"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Webhook, Activity, CheckCircle, XCircle, Clock, Send, Settings, BarChart3, RefreshCw } from "lucide-react"

interface WebhookEvent {
  id: string
  event_type: string
  delivery_id: string
  processed: boolean
  created_at: string
  payload: any
}

interface WebhookStats {
  total: number
  processed: number
  failed: number
  recent: WebhookEvent[]
}

export default function WebhooksPage() {
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testPayload, setTestPayload] = useState("")
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    fetchWebhookStats()
    const interval = setInterval(fetchWebhookStats, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchWebhookStats = async () => {
    try {
      const response = await fetch("/api/webhooks/stats")
      if (!response.ok) throw new Error("Failed to fetch webhook stats")
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testWebhook = async () => {
    setTestLoading(true)
    try {
      const response = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: testPayload || '{"test": true, "timestamp": "' + new Date().toISOString() + '"}',
        }),
      })

      if (!response.ok) throw new Error("Test webhook failed")

      const result = await response.json()
      alert("Test webhook sent successfully!")
      fetchWebhookStats() // Refresh stats
    } catch (err) {
      alert("Test webhook failed: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setTestLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "push":
        return "📝"
      case "pull_request":
        return "🔄"
      case "issues":
        return "🐛"
      case "star":
        return "⭐"
      case "fork":
        return "🍴"
      default:
        return "📡"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Webhook className="w-8 h-8 mr-3 text-purple-600" />
              Webhook Management
            </h1>
            <p className="text-gray-600 mt-1">Monitor and manage webhook events</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              Webhooks Active
            </Badge>
            <Button onClick={fetchWebhookStats} size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">Error loading webhook data: {error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
              <p className="text-xs text-gray-600">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.processed || 0}</div>
              <p className="text-xs text-gray-600">
                {stats?.total ? Math.round(((stats.processed || 0) / stats.total) * 100) : 0}% success rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
              <p className="text-xs text-gray-600">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="events">Recent Events</TabsTrigger>
            <TabsTrigger value="test">Test Webhook</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Webhook Events</CardTitle>
                <CardDescription>Latest webhook events received and processed</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recent && stats.recent.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recent.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getEventIcon(event.event_type)}</span>
                          <div>
                            <div className="font-medium">{event.event_type}</div>
                            <div className="text-sm text-gray-600">ID: {event.delivery_id}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={event.processed ? "default" : "destructive"}>
                            {event.processed ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Processed
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </>
                            )}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDate(event.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No webhook events received yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Test Webhook</CardTitle>
                <CardDescription>Send a test webhook event to verify your configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-payload">Test Payload (JSON)</Label>
                  <Textarea
                    id="test-payload"
                    placeholder='{"test": true, "message": "Hello from webhook test"}'
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    rows={6}
                    className="mt-1"
                  />
                </div>
                <Button onClick={testWebhook} disabled={testLoading} className="w-full">
                  {testLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending Test...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Test Webhook
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>Configure webhook endpoints and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="github-webhook">GitHub Webhook URL</Label>
                  <Input
                    id="github-webhook"
                    value={`${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/api/webhooks/github`}
                    readOnly
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">Use this URL in your GitHub repository webhook settings</p>
                </div>

                <div>
                  <Label htmlFor="vercel-webhook">Vercel Webhook URL</Label>
                  <Input
                    id="vercel-webhook"
                    value={`${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/api/webhooks/vercel`}
                    readOnly
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">Use this URL in your Vercel project webhook settings</p>
                </div>

                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Make sure to configure the webhook secrets in your environment variables:
                    <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
                      GITHUB_WEBHOOK_SECRET=your-secret
                      <br />
                      VERCEL_WEBHOOK_SECRET=your-secret
                    </code>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
