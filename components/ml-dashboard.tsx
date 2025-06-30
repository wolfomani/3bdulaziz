"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Brain, Cpu, Database, TrendingUp, Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface SystemStatus {
  experiments: { total: number; running: number; successful: number }
  deployments: { total: number; active: number; healthy: number }
  resources: { cpu_usage: number; memory_usage: number; gpu_usage: number }
}

interface ModelInfo {
  name: string
  version: string
  task: string
  performance: {
    accuracy: number
    latency: number
    throughput: number
  }
}

export default function MLDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()

    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // جلب حالة النظام
      const statusResponse = await fetch("/api/ml/experiments?action=status")
      const statusData = await statusResponse.json()
      setSystemStatus(statusData.status)

      // جلب معلومات النماذج
      const modelsResponse = await fetch("/api/ai?action=models")
      const modelsData = await modelsResponse.json()
      setModels(modelsData.models)

      // جلب التحليلات
      const analyticsResponse = await fetch("/api/ml/experiments?action=analytics")
      const analyticsData = await analyticsResponse.json()
      setAnalytics(analyticsData.analytics)

      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">لوحة تحكم التعلم الآلي</h1>
          <p className="text-gray-400">مراقبة وإدارة نماذج الذكاء الاصطناعي</p>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التجارب النشطة</CardTitle>
              <Brain className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus?.experiments.running || 0}</div>
              <p className="text-xs text-gray-400">من أصل {systemStatus?.experiments.total || 0} تجربة</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النماذج المنشورة</CardTitle>
              <Zap className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus?.deployments.active || 0}</div>
              <p className="text-xs text-gray-400">{systemStatus?.deployments.healthy || 0} نموذج صحي</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">استخدام GPU</CardTitle>
              <Cpu className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(systemStatus?.resources.gpu_usage || 0)}%</div>
              <Progress value={systemStatus?.resources.gpu_usage || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((analytics?.successRate || 0) * 100)}%</div>
              <p className="text-xs text-gray-400">متوسط الدقة: {(analytics?.averageAccuracy || 0).toFixed(3)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Views */}
        <Tabs defaultValue="models" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="models">النماذج</TabsTrigger>
            <TabsTrigger value="experiments">التجارب</TabsTrigger>
            <TabsTrigger value="monitoring">المراقبة</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model, index) => (
                <Card key={index} className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <Badge variant="secondary">{model.version}</Badge>
                    </div>
                    <CardDescription>{model.task}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>الدقة</span>
                        <span>{(model.performance.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={model.performance.accuracy * 100} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">زمن الاستجابة</span>
                        <div className="font-medium">{model.performance.latency}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-400">الإنتاجية</span>
                        <div className="font-medium">{model.performance.throughput}/s</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Activity className="h-4 w-4 mr-2" />
                        مراقبة
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Database className="h-4 w-4 mr-2" />
                        تحديث
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="experiments" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>التجارب الحديثة</CardTitle>
                <CardDescription>آخر التجارب المنفذة ونتائجها</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentTrends?.map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {trend.experiment}
                        </div>
                        <div>
                          <div className="font-medium">تجربة #{trend.experiment}</div>
                          <div className="text-sm text-gray-400">دقة: {(trend.accuracy * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={trend.accuracy > 0.9 ? "default" : "secondary"}>
                          {trend.accuracy > 0.9 ? "ممتاز" : "جيد"}
                        </Badge>
                        <div className="text-sm text-gray-400">{trend.latency.toFixed(0)}ms</div>
                      </div>
                    </div>
                  )) || <div className="text-center text-gray-400 py-8">لا توجد تجارب حديثة</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>استخدام الموارد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU</span>
                      <span>{Math.round(systemStatus?.resources.cpu_usage || 0)}%</span>
                    </div>
                    <Progress value={systemStatus?.resources.cpu_usage || 0} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>الذاكرة</span>
                      <span>{Math.round(systemStatus?.resources.memory_usage || 0)}%</span>
                    </div>
                    <Progress value={systemStatus?.resources.memory_usage || 0} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>GPU</span>
                      <span>{Math.round(systemStatus?.resources.gpu_usage || 0)}%</span>
                    </div>
                    <Progress value={systemStatus?.resources.gpu_usage || 0} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>حالة النماذج</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span>النماذج الصحية</span>
                      </div>
                      <span className="font-bold">{systemStatus?.deployments.healthy || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg border border-yellow-700">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-400" />
                        <span>قيد المراقبة</span>
                      </div>
                      <span className="font-bold">
                        {(systemStatus?.deployments.active || 0) - (systemStatus?.deployments.healthy || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-700">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <span>تحتاج تدخل</span>
                      </div>
                      <span className="font-bold">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>إحصائيات الأداء</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{analytics?.totalExperiments || 0}</div>
                      <div className="text-sm text-gray-400">إجمالي التجارب</div>
                    </div>

                    <div className="text-center p-4 bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        {Math.round((analytics?.successRate || 0) * 100)}%
                      </div>
                      <div className="text-sm text-gray-400">معدل النجاح</div>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {(analytics?.averageAccuracy || 0).toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-400">متوسط الدقة</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>أفضل نموذج</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.bestModel ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-700">
                        <div className="font-bold text-lg mb-2">{analytics.bestModel.experiment_id}</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">الدقة</span>
                            <div className="font-medium">
                              {(analytics.bestModel.metrics.accuracy * 100).toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">زمن الاستجابة</span>
                            <div className="font-medium">{analytics.bestModel.metrics.latency}ms</div>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full">نشر هذا النموذج</Button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">لا توجد نماذج متاحة</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
