import { createClient } from '@/lib/supabase/server'

export default async function AdminConfigPage() {
  const supabase = await createClient()
  const { data: admins } = await supabase.from('admin_users').select('*').order('created_at')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-title text-4xl text-white mb-1">Configuración</h1>
        <p className="text-gray-600 text-sm">Admins y configuración general</p>
      </div>

      {/* Admins */}
      <div className="mb-8 p-4 rounded-sm" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
        <h2 className="font-title text-xl text-white mb-1">Administradores</h2>
        <p className="text-gray-600 text-xs mb-4">
          Para agregar admins, insertá registros en la tabla <code className="text-pink">admin_users</code> en Supabase.
        </p>

        {admins?.length === 0 ? (
          <p className="text-gray-700 text-sm">Sin admins registrados en la tabla. Tu acceso es por variable de entorno.</p>
        ) : (
          <div className="space-y-2">
            {admins?.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                <div>
                  <p className="text-white text-sm">{admin.email}</p>
                  {admin.notes && <p className="text-gray-600 text-xs">{admin.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-900/50 border border-gray-800 rounded-sm">
          <p className="text-gray-600 text-xs font-mono">
            INSERT INTO admin_users (email, notes)<br />
            VALUES (&apos;email@ejemplo.com&apos;, &apos;Descripción&apos;);
          </p>
        </div>
      </div>

      {/* Info técnica */}
      <div className="p-4 rounded-sm" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
        <h2 className="font-title text-xl text-white mb-4">Variables de entorno requeridas</h2>
        <div className="space-y-2 text-xs font-mono">
          {[
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'NEXT_PUBLIC_SITE_URL',
            'ADMIN_EMAILS',
          ].map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  process.env[v] ? 'bg-green-400' : 'bg-red-500'
                }`}
              />
              <span className="text-gray-400">{v}</span>
              <span className={process.env[v] ? 'text-green-600' : 'text-red-600'}>
                {process.env[v] ? '✓ configurada' : '✗ falta'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
