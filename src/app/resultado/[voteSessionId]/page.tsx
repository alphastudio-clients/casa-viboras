import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/utils'
import { Header } from '@/components/layout/Header'
import { PublicResultView } from '@/components/voting/PublicResultView'
import type { Player, VoteSession } from '@/types'

export const revalidate = 30

interface Props {
  params: Promise<{ voteSessionId: string }>
}

export default async function ResultadoPage({ params }: Props) {
  const { voteSessionId } = await params
  const supabase = await createClient()
  const profile = await getProfile()

  const { data: session } = await supabase
    .from('vote_sessions')
    .select('*, season:seasons(*), winner:players(*)')
    .eq('id', voteSessionId)
    .single()

  if (!session) notFound()
  if (session.status !== 'published') redirect('/votar')

  const { data: winner } = session.winner_player_id
    ? await supabase.from('players').select('*').eq('id', session.winner_player_id).single()
    : { data: null }

  return (
    <div className="min-h-screen bg-black">
      <Header profile={profile} />
      <main className="pt-14">
        <PublicResultView
          session={session as VoteSession}
          winner={winner as Player | null}
        />
      </main>
    </div>
  )
}
