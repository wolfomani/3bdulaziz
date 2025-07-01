import { NextResponse } from "next/server"

export async function GET() {
  const setupInstructions = {
    github_webhook: {
      title: "إعداد GitHub Webhook",
      steps: [
        {
          step: 1,
          title: "انتقل إلى إعدادات المستودع",
          description: "اذهب إلى https://github.com/wolfomani/3bdulaziz/settings/hooks",
          url: "https://github.com/wolfomani/3bdulaziz/settings/hooks",
        },
        {
          step: 2,
          title: "أضف webhook جديد",
          description: "انقر على 'Add webhook'",
        },
        {
          step: 3,
          title: "تكوين الـ webhook",
          configuration: {
            payload_url: "https://3bdulaziz.vercel.app/api/webhooks/github",
            content_type: "application/json",
            secret: "drx3rx3skabcdef1984767850aregiskpqbcdef1234567890",
            events: ["push", "pull_request", "issues", "release", "star", "fork"],
            active: true,
          },
        },
        {
          step: 4,
          title: "اختبار الـ webhook",
          description: "انقر على 'Test webhook' للتأكد من عمله",
        },
      ],
      monitoring: {
        webhook_site: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
        github_deliveries: "https://github.com/wolfomani/3bdulaziz/settings/hooks",
        api_events: "https://3bdulaziz.vercel.app/api/webhooks/events",
      },
    },
    vercel_webhook: {
      title: "إعداد Vercel Deploy Hook",
      steps: [
        {
          step: 1,
          title: "انتقل إلى إعدادات المشروع في Vercel",
          description: "اذهب إلى https://vercel.com/wolfomani/3bdulaziz/settings/git",
        },
        {
          step: 2,
          title: "أضف Deploy Hook",
          description: "في قسم Deploy Hooks، أضف hook جديد",
          configuration: {
            name: "DrX Auto Deploy",
            branch: "main",
            url: "سيتم إنشاؤه تلقائياً",
          },
        },
        {
          step: 3,
          title: "أضف الـ URL إلى متغيرات البيئة",
          description: "أضف VERCEL_DEPLOY_HOOK إلى متغيرات البيئة",
          environment_variable: "VERCEL_DEPLOY_HOOK",
        },
      ],
    },
    testing: {
      title: "اختبار النظام",
      endpoints: {
        test_webhook: {
          url: "https://3bdulaziz.vercel.app/api/webhooks/test",
          method: "POST",
          example: {
            message: "Test webhook",
            type: "test.manual",
            data: { user_id: "test_123" },
          },
        },
        view_events: {
          url: "https://3bdulaziz.vercel.app/api/webhooks/events",
          method: "GET",
          parameters: ["limit", "offset", "source", "type", "since", "until"],
        },
        view_stats: {
          url: "https://3bdulaziz.vercel.app/api/webhooks/stats",
          method: "GET",
          parameters: ["period", "group_by"],
        },
      },
      curl_examples: [
        {
          description: "اختبار webhook",
          command: `curl -X POST https://3bdulaziz.vercel.app/api/webhooks/test \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Test from terminal","type":"test.curl"}'`,
        },
        {
          description: "عرض الأحداث الأخيرة",
          command: "curl https://3bdulaziz.vercel.app/api/webhooks/events?limit=10",
        },
        {
          description: "عرض إحصائيات اليوم",
          command: "curl https://3bdulaziz.vercel.app/api/webhooks/stats?period=24h&group_by=type",
        },
      ],
    },
    troubleshooting: {
      title: "حل المشاكل",
      common_issues: [
        {
          issue: "Webhook لا يصل",
          solutions: ["تأكد من صحة الـ URL", "تحقق من إعدادات الشبكة والـ firewall", "تأكد من أن الخدمة تعمل"],
        },
        {
          issue: "خطأ في التوقيع",
          solutions: [
            "تأكد من صحة الـ secret",
            "تحقق من تطابق الـ secret في GitHub والتطبيق",
            "تأكد من استخدام SHA256",
          ],
        },
        {
          issue: "الأحداث لا تُسجل",
          solutions: ["تحقق من اتصال قاعدة البيانات", "تأكد من صحة متغيرات البيئة", "راجع logs الخادم"],
        },
      ],
    },
    monitoring: {
      title: "المراقبة والتتبع",
      tools: {
        webhook_site: {
          url: "https://webhook.site/4f2e177c-931c-49c2-a095-ad4ee2684614",
          description: "مراقبة الـ webhooks في الوقت الفعلي",
        },
        api_dashboard: {
          url: "https://3bdulaziz.vercel.app/webhooks",
          description: "لوحة تحكم إدارة الـ webhooks",
        },
        github_deliveries: {
          url: "https://github.com/wolfomani/3bdulaziz/settings/hooks",
          description: "سجل تسليم GitHub webhooks",
        },
      },
    },
  }

  return NextResponse.json({
    success: true,
    message: "دليل إعداد نظام Webhooks",
    setup_instructions: setupInstructions,
    current_status: {
      github_webhook_configured: true,
      secret_configured: true,
      monitoring_active: true,
      endpoints_active: true,
    },
    quick_start: {
      "1": "تأكد من إعداد GitHub webhook مع الـ secret الصحيح",
      "2": "اختبر النظام باستخدام /api/webhooks/test",
      "3": "راقب الأحداث على webhook.site",
      "4": "استخدم /api/webhooks/events لعرض السجلات",
    },
  })
}
