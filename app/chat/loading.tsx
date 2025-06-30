export default function ChatLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold animate-pulse">
          d3
        </div>
        <p className="text-gray-300">جاري تحميل المحادثة...</p>
      </div>
    </div>
  )
}
