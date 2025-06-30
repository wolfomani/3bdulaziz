import { type NextRequest, NextResponse } from "next/server"
import { mlopsOrchestrator, ExperimentAPI } from "@/lib/mlops-pipeline"

export async function POST(request: NextRequest) {
  try {
    const experimentConfig = await request.json()

    // التحقق من صحة البيانات
    if (!experimentConfig.name || !experimentConfig.model_type) {
      return NextResponse.json({ error: "Name and model_type are required" }, { status: 400 })
    }

    // إنشاء تجربة جديدة
    const experimentId = await ExperimentAPI.createExperiment(experimentConfig)

    return NextResponse.json({
      success: true,
      experiment_id: experimentId,
      message: "Experiment started successfully",
    })
  } catch (error) {
    console.error("Experiment creation error:", error)

    return NextResponse.json({ error: "Failed to create experiment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const experimentId = searchParams.get("id")
    const action = searchParams.get("action")

    if (experimentId) {
      // الحصول على تجربة محددة
      const experiment = await ExperimentAPI.getExperimentStatus(experimentId)

      if (!experiment) {
        return NextResponse.json({ error: "Experiment not found" }, { status: 404 })
      }

      return NextResponse.json({ experiment })
    }

    if (action === "analytics") {
      // الحصول على تحليلات التجارب
      const analytics = await ExperimentAPI.getAnalytics()
      return NextResponse.json({ analytics })
    }

    if (action === "status") {
      // الحصول على حالة النظام
      const systemStatus = await mlopsOrchestrator.getSystemStatus()
      return NextResponse.json({ status: systemStatus })
    }

    // الحصول على جميع التجارب
    const experiments = mlopsOrchestrator.getAllExperiments()
    return NextResponse.json({ experiments })
  } catch (error) {
    console.error("Experiments API error:", error)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
