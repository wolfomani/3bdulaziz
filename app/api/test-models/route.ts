import { NextResponse } from "next/server"
import { aiOrchestrator } from "@/lib/ai-providers"

export async function GET() {
  try {
    const testResults = await aiOrchestrator.testProviders()
    const systemHealth = await aiOrchestrator.getSystemHealth()

    return NextResponse.json({
      success: true,
      data: {
        providers: testResults,
        system_health: systemHealth,
        available_providers: Object.keys(testResults).filter(key => testResults[key]),
        timestamp: new Date().toISOString()
      }
    }, {
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Model test error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: "فشل في اختبار النماذج",
        details: error instanceof Error ? error.message : "خطأ غير معروف"
      },
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

export async function POST() {
  try {
    // Test with a simple Arabic message
    const testMessage = "مرحبا، هذا اختبار للنظام"
    
    const results = await Promise.allSettled([
      aiOrchestrator.generateResponse(testMessage, { provider: "groq" }),
      aiOrchestrator.generateResponse(testMessage, { provider: "together" }),
      aiOrchestrator.generateResponse(testMessage, { provider: "auto" })
    ])

    const testData = results.map((result, index) => {
      const providers = ["groq", "together", "auto"]
      return {
        provider: providers[index],
        status: result.status,
        success: result.status === "fulfilled" ? result.value.success : false,
        response: result.status === "fulfilled" ? result.value.response?.substring(0, 100) : null,
        error: result.status === "rejected" ? result.reason.message : 
               (result.status === "fulfilled" && !result.value.success ? result.value.error : null)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        test_results: testData,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Model test POST error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: "فشل في تشغيل اختبار النماذج",
        details: error instanceof Error ? error.message : "خطأ غير معروف"
      },
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
