"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Zap, Activity, ExternalLink, Copy, CheckCircle, TrendingUp } from "lucide-react"
import Link from "next/link"

interface WebhookEvent {
  id: string
  type: string
  source: string
  payload: any
  created_at: string
  processed: boolean
}

interface WebhookStats {
  total_events: number
  processed_events: number
  failed_events: number
  events_by_source: Record<string, number>
  recent_events: WebhookEvent[]
}

export default function WebhooksPage() {
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const webhookUrl =
    "https://v0-drx3apipage2-git-main-balqees0alalawi-gmailcoms-projects.vercel.app/api/webhooks/github"
  const monitoringUrl = "https://webhook.site/b9656a38-2592-49ef-98c9-e16ccff6134a"

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
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testWebhook = async () => {
    try {
      const response = await fetch("/api/webhooks/test", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert("تم إرسال webhook تجريبي بنجاح!")
        loadWebhookStats()
      } else {
        alert("فشل في إرسال webhook التجريبي")
      }
    } catch (error) {
      alert("حدث خطأ أثناء الاختبار")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
            >
              عبد العزيز الحمداني
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  لوحة التحكم
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">إدارة Webhooks</h1>
          <p className="text-gray-400">مراقبة وإدارة webhooks من GitHub وVercel</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* GitHub Webhook Setup */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Github className="w-5 h-5 ml-2" />
                  إعداد GitHub Webhook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input value={webhookUrl} readOnly className="bg-white/10 border-white/20 text-white" />
                    <Button
                      onClick={() => copyToClipboard(webhookUrl)}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">الأحداث المدعومة</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["ping", "push", "pull_request", "issues", "release", "star"].map((event) => (
                      <Badge key={event} className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testWebhook}
                    className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
                  >
                    <Zap className="w-4 h-4 ml-2" />
                    اختبار Webhook
                  </Button>
                  <Button
                    onClick={() => window.open("https://github.com/wolfomani/3bdulaziz/settings/hooks", "_blank")}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    إعدادات GitHub
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Monitoring */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 ml-2" />
                  مراقبة الأحداث
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">رابط المراقبة</Label>
                  <div className="flex gap-2">
                    <Input value={monitoringUrl} readOnly className="bg-white/10 border-white/20 text-white" />
                    <Button
                      onClick={() => window.open(monitoringUrl, "_blank")}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-400">
                  يمكنك مراقبة جميع الـ webhooks الواردة في الوقت الفعلي من خلال webhook.site
                </p>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">الأحداث الأخيرة</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center text-gray-400 py-8">جاري التحميل...</div>
                ) : stats?.recent_events?.length ? (
                  <div className="space-y-3">
                    {stats.recent_events.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${event.processed ? "bg-green-400" : "bg-yellow-400"}`}
                          />
                          <div>
                            <div className="text-white text-sm font-medium">{event.type}</div>
                            <div className="text-gray-400 text-xs">{event.source}</div>
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(event.created_at).toLocaleString("ar-SA")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">لا توجد أحداث حتى الآن</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            {/* Stats Overview */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">الإحصائيات</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center text-gray-400">جاري التحميل...</div>
                ) : stats ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.total_events}</div>
                      <div className="text-sm text-gray-400">إجمالي الأحداث</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.processed_events}</div>
                      <div className="text-sm text-gray-400">تم معالجتها</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{stats.failed_events}</div>
                      <div className="text-sm text-gray-400">فشلت</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>

            {/* Events by Source */}
            {stats?.events_by_source && Object.keys(stats.events_by_source).length > 0 && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">الأحداث حسب المصدر</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.events_by_source).map(([source, count]) => (
                      <div key={source} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {source === "github" && <Github className="w-4 h-4 text-gray-400" />}
                          <span className="text-white capitalize">{source}</span>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-red-600/20 to-orange-500/20 backdrop-blur-sm border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={loadWebhookStats} className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                  <TrendingUp className="w-4 h-4 ml-2" />
                  تحديث الإحصائيات
                </Button>
                <Button
                  onClick={() =>
                    window.open("https://docs.github.com/en/developers/webhooks-and-events/webhooks", "_blank")
                  }
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  دليل GitHub Webhooks
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
