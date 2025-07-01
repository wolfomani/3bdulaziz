"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Send, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WebhookEvent {
  id: string
  type: string
  timestamp: string
  status: "success" | "failed" | "pending"
  payload: any
  response?: any
}

export default function WebhooksPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [webhookType, setWebhookType] = useState("test.event")
  const [webhookData, setWebhookData] = useState('{\n  "message": "Hello from drx3!",\n  "user": "admin"\n}')
  const { toast } = useToast()

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks`
  const testUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/test`

  useEffect(() => {
    // Load events from localStorage
    const savedEvents = localStorage.getItem("webhook-events")
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents))
    }
  }, [])

  const saveEvents = (newEvents: WebhookEvent[]) => {
    setEvents(newEvents)
    localStorage.setItem("webhook-events", JSON.stringify(newEvents))
  }

  const sendTestWebhook = async () => {
    setIsLoading(true)

    try {
      let parsedData
      try {
        parsedData = JSON.parse(webhookData)
      } catch {
        parsedData = { raw: webhookData }
      }

      const newEvent: WebhookEvent = {
        id: crypto.randomUUID(),
        type: webhookType,
        timestamp: new Date().toISOString(),
        status: "pending",
        payload: { type: webhookType, data: parsedData },
      }

      const updatedEvents = [newEvent, ...events]
      saveEvents(updatedEvents)

      const response = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: webhookType, data: parsedData }),
      })

      const result = await response.json()

      // Update event status
      newEvent.status = response.ok ? "success" : "failed"
      newEvent.response = result

      const finalEvents = updatedEvents.map((e) => (e.id === newEvent.id ? newEvent : e))
      saveEvents(finalEvents)

      toast({
        title: response.ok ? "Webhook sent successfully!" : "Webhook failed",
        description: result.message || "Check the events list for details",
        variant: response.ok ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "Error sending webhook",
        description: "Failed to send test webhook",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "URL copied successfully",
    })
  }

  const clearEvents = () => {
    setEvents([])
    localStorage.removeItem("webhook-events")
    toast({
      title: "Events cleared",
      description: "All webhook events have been cleared",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            إدارة Webhooks
          </h1>
          <p className="text-gray-400 mt-2">إدارة ومراقبة webhook events لمنصة drx3</p>
        </div>

        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="send">إرسال Webhook</TabsTrigger>
            <TabsTrigger value="events">الأحداث</TabsTrigger>
            <TabsTrigger value="config">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-orange-400">إرسال Webhook تجريبي</CardTitle>
                <CardDescription>اختبر webhook endpoint بإرسال بيانات تجريبية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="webhook-type">نوع الحدث</Label>
                    <Input
                      id="webhook-type"
                      value={webhookType}
                      onChange={(e) => setWebhookType(e.target.value)}
                      placeholder="test.event"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label>حالة الإرسال</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={isLoading ? "secondary" : "default"}>
                        {isLoading ? "جاري الإرسال..." : "جاهز"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="webhook-data">بيانات JSON</Label>
                  <Textarea
                    id="webhook-data"
                    value={webhookData}
                    onChange={(e) => setWebhookData(e.target.value)}
                    rows={6}
                    className="bg-gray-700 border-gray-600 font-mono"
                    placeholder='{"message": "Hello from drx3!"}'
                  />
                </div>

                <Button
                  onClick={sendTestWebhook}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      إرسال Webhook
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-orange-400">سجل الأحداث</CardTitle>
                  <CardDescription>آخر {events.length} حدث webhook</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={clearEvents}
                  className="border-gray-600 hover:bg-gray-700 bg-transparent"
                >
                  مسح الكل
                </Button>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">لا توجد أحداث webhook حتى الآن</div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(event.status)}
                            <Badge variant="outline">{event.type}</Badge>
                            <span className="text-sm text-gray-400">
                              {new Date(event.timestamp).toLocaleString("ar")}
                            </span>
                          </div>
                          <Badge variant={event.status === "success" ? "default" : "destructive"}>{event.status}</Badge>
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                            عرض التفاصيل
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                          {event.response && (
                            <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto">
                              <strong>Response:</strong>
                              {JSON.stringify(event.response, null, 2)}
                            </pre>
                          )}
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-orange-400">إعدادات Webhook</CardTitle>
                <CardDescription>URLs وإعدادات webhook endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Webhook Endpoint</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={webhookUrl} readOnly className="bg-gray-700 border-gray-600" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrl)}
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Test Endpoint</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={testUrl} readOnly className="bg-gray-700 border-gray-600" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(testUrl)}
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Webhook.site URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value="https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614"
                      readOnly
                      className="bg-gray-700 border-gray-600"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard("https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614")}
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-600">
                  <h3 className="text-lg font-semibold mb-2">معلومات التكامل</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>GitHub Repository:</strong>
                      <br />
                      <code className="text-orange-400">wolfomani/3bdulaziz</code>
                    </div>
                    <div>
                      <strong>Vercel Deployment:</strong>
                      <br />
                      <code className="text-orange-400">3bdulaziz.vercel.app</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
