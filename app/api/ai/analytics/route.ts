import { type NextRequest, NextResponse } from "next/server"
import { DrXDatabase } from "@/lib/database"
import { cache } from "@/lib/redis-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")
    const provider = searchParams.get("provider")

    // محاولة الحصول على البيانات من الذاكرة المؤقتة أولاً
    const cacheKey = `analytics:${days}:${provider || "all"}`
    const cachedData = await cache.get(cacheKey)

    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        timestamp: new Date().toISOString(),
      })
    }

    // الحصول على إحصائيات الاستخدام
    const usageStats = await DrXDatabase.getUsageStats(days)

    // تحليل البيانات
    const analytics = {
      totalRequests: 0,
      successRate: 0,
      averageProcessingTime: 0,
      totalTokensUsed: 0,
      providerBreakdown: {} as Record<string, any>,
      modelPerformance: {} as Record<string, any>,
      dailyUsage: [] as any[],
      errorAnalysis: {} as Record<string, number>,
      costEstimate: 0,
    }

    // معالجة البيانات
    for (const stat of usageStats) {
      analytics.totalRequests += stat.total_requests || 0
      analytics.totalTokensUsed += stat.total_tokens || 0

      // تحليل حسب المزود
      if (stat.provider) {
        if (!analytics.providerBreakdown[stat.provider]) {
          analytics.providerBreakdown[stat.provider] = {
            requests: 0,
            successRate: 0,
            avgProcessingTime: 0,
            tokens: 0,
          }
        }

        analytics.providerBreakdown[stat.provider].requests += stat.total_requests || 0
        analytics.providerBreakdown[stat.provider].tokens += stat.total_tokens || 0
        analytics.providerBreakdown[stat.provider].avgProcessingTime = stat.avg_processing_time || 0
        analytics.providerBreakdown[stat.provider].successRate = stat.success_rate || 0
      }

      // تحليل الأخطاء
      if (stat.error_message) {
        analytics.errorAnalysis[stat.error_message] = (analytics.errorAnalysis[stat.error_message] || 0) + 1
      }
    }

    // حساب المعدلات
    if (analytics.totalRequests > 0) {
      const successfulRequests = usageStats.filter((s) => s.success).length
      analytics.successRate = (successfulRequests / analytics.totalRequests) * 100

      const totalProcessingTime = usageStats.reduce((sum, s) => sum + (s.avg_processing_time || 0), 0)
      analytics.averageProcessingTime = totalProcessingTime / analytics.totalRequests

      // تقدير التكلفة (تقديري)
      analytics.costEstimate = (analytics.totalTokensUsed / 1000) * 0.0002
    }

    // إضافة معلومات إضافية
    const enhancedAnalytics = {
      ...analytics,
      period: `${days} days`,
      generatedAt: new Date().toISOString(),
      insights: {
        mostUsedProvider: Object.keys(analytics.providerBreakdown).reduce(
          (a, b) => (analytics.providerBreakdown[a]?.requests > analytics.providerBreakdown[b]?.requests ? a : b),
          Object.keys(analytics.providerBreakdown)[0],
        ),
        peakUsageHour: "14:00-15:00", // تقدير
        averageResponseLength: Math.floor((analytics.totalTokensUsed / Math.max(analytics.totalRequests, 1)) * 4),
        qualityScore:
          Math.min((analytics.successRate / 100) * (2000 / Math.max(analytics.averageProcessingTime, 1)), 1) * 100,
      },
    }

    // حفظ في الذاكرة المؤقتة لمدة 10 دقائق
    await cache.set(cacheKey, enhancedAnalytics, { ttl: 600 })

    return NextResponse.json(enhancedAnalytics)
  } catch (error) {
    console.error("Analytics API error:", error)

    return NextResponse.json(
      {
        error: "فشل في جلب الإحصائيات",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case "clear_cache":
        await cache.deletePattern("analytics:*")
        return NextResponse.json({
          success: true,
          message: "تم مسح ذاكرة التخزين المؤقت للإحصائيات",
        })

      case "export_data":
        const exportData = await DrXDatabase.getUsageStats(30) // آخر 30 يوم
        return NextResponse.json({
          success: true,
          data: exportData,
          exportedAt: new Date().toISOString(),
          recordCount: exportData.length,
        })

      default:
        return NextResponse.json(
          {
            error: "إجراء غير مدعوم",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("Analytics POST error:", error)

    return NextResponse.json(
      {
        error: "فشل في تنفيذ الإجراء",
        details: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
