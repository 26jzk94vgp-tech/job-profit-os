export const metadata = { title: 'Offline - CIMO' }

export default function Offline() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-3">CIMO</h1>
        <div className="bg-[#2C2C2E] rounded-2xl p-6 space-y-3">
          <p className="text-4xl">📡</p>
          <p className="font-semibold">You're offline</p>
          <p className="text-[#8E8E93] text-sm">No internet connection. Your data is safe — reconnect to continue. Pages you've already opened may still work.</p>
        </div>
      </div>
    </main>
  )
}
