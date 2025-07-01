"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Webhook, Github, Activity, CheckCircle, XCircle, RefreshCw, Settings, BarChart3 } from "lucide-react"
import { toast } from "sonner"

interface WebhookStats {
  total_events: number
  processed_events: number
  failed_events: number
  events_by_source: Record<string, number>
  recent_events: Array<{
    id: string
    type: string
    source: string
    created_at: string
    processed: boolean
  }>
}

export default function WebhooksPage() {
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [testUrl, setTestUrl] = useState("https://webhook.site/b9656a38-2592-49ef-98c9-e16ccff6134a")

  useEffect(() => {
    loadWebhookStats()
  }, [])

  const loadWebhookStats = async () => {
    try {
      const response = await fetch("/api/webhooks/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to load webhook stats:", error)
      toast.error("فشل في تحميل إحصائيات Webhooks")
    } finally {
      setLoading(false)
    }
  }

  const testWebhook = async () => {
    try {
      const response = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: testUrl }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("تم إرسال webhook تجريبي بنجاح")
      } else {
        toast.error(data.message || "فشل في إرسال webhook")
      }
    } catch (error) {
      toast.error("حدث خطأ في الاتصال")
    }
  }

  const setupGitHubWebhook = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/github`
    navigator.clipboard.writeText(webhookUrl)
    toast.success("تم نسخ رابط webhook إلى الحافظة")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Webhook className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">إدارة Webhooks</h1>
            </div>
            <Button onClick={loadWebhookStats} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الأحداث</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_events || 0}</div>
                  <p className="text-xs text-muted-foreground">آخر 24 ساعة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">تم المعالجة</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats?.processed_events || 0}</div>
                  <p className="text-xs text-muted-foreground">نجح</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">فشل</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats?.failed_events || 0}</div>
                  <p className="text-xs text-muted-foreground">خطأ</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>الأحداث الأخيرة</CardTitle>
                <CardDescription>آخر 10 أحداث webhook</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recent_events && stats.recent_events.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recent_events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          {event.source === "github" ? (
                            <Github className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Webhook className="w-5 h-5 text-gray-600" />
                          )}
                          <div>
                            <div className="font-medium">{event.type}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(event.created_at).toLocaleString("ar-SA")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Badge variant={event.source === "github" ? "default" : "secondary"}>{event.source}</Badge>
                          <Badge variant={event.processed ? "default" : "destructive"}>
                            {event.processed ? "تم" : "فشل"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أحداث حتى الآن</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* GitHub Webhook Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Github className="w-5 h-5" />
                  <span>GitHub Webhook</span>
                </CardTitle>
                <CardDescription>إعداد webhook لمستودع GitHub</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>انسخ الرابط أدناه وأضفه في إعدادات webhook في مستودع GitHub</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>رابط Webhook</Label>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Input
                      value={`${window.location.origin}/api/webhooks/github`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button onClick={setupGitHubWebhook} size="sm">
                      نسخ
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الأحداث المدعومة</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">push</Badge>
                    <Badge variant="outline">pull_request</Badge>
                    <Badge variant="outline">issues</Badge>
                    <Badge variant="outline">star</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Webhook */}
            <Card>
              <CardHeader>
                <CardTitle>اختبار Webhook</CardTitle>
                <CardDescription>إرسال webhook تجريبي لاختبار النظام</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-url">رابط الاختبار</Label>
                  <Input
                    id="test-url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://webhook.site/..."
                  />
                </div>

                <Button onClick={testWebhook} className="w-full">
                  <Activity className="w-4 h-4 mr-2" />
                  إرسال webhook تجريبي
                </Button>
              </CardContent>
            </Card>

            {/* Events by Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <BarChart3 className="w-5 h-5" />
                  <span>الأحداث حسب المصدر</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.events_by_source && Object.keys(stats.events_by_source).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.events_by_source).map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {source === "github" ? <Github className="w-4 h-4" /> : <Webhook className="w-4 h-4" />}
                          <span className="capitalize">{source}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
