// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server

// Edge function to delete a user account with admin privileges
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session and user from the request
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const userId = session.user.id

    // Create a Supabase service role client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete user's data in the correct order
    await supabaseAdmin
      .from('messages')
      .delete()
      .eq('user_id', userId)

    await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('user_id', userId)

    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    // Finally, delete the user from auth.users
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 