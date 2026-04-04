export default function AdminHome({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">🏛️</div>
      <div className="text-2xl font-black text-orange-800">Admin Panel</div>
      <div className="text-orange-400 text-sm mt-1">{user?.email}</div>
      <button onClick={onLogout} className="mt-8 text-red-400 text-sm underline">Logout</button>
    </div>
  )
}