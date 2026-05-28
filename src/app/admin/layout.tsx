import { requireAdmin } from '@/lib/auth/utils'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-black">
      <AdminNav />
      <main className="pt-14 md:pl-56">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
