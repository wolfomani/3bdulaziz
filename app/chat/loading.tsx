export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center mx-auto">
          <span className="text-white font-bold">d3</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <span className="text-gray-400">جاري التحميل...</span>
        </div>
      </div>
    </div>
  )
}
