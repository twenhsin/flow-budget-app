import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('records')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
