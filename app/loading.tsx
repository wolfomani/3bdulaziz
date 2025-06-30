export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold gradient-text animate-pulse">drx3</div>
        <div className="loading-dots text-red-500">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  )
}
