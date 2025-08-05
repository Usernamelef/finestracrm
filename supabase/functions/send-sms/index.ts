import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, sender } = await req.json()

    // Utiliser directement les identifiants pour éviter les problèmes de configuration
    const client_id = '13742224586362909733'
    const client_secret = 'gOMbIkbDEN3k2zPRrupC'

    const data = JSON.stringify({
      message: message,
      to: to,
      sender: sender || 'La Finestra',
    })

    const response = await fetch('https://api.smsgatewayapi.com/v1/message/send', {
      method: 'POST',
      headers: {
        'X-Client-Id': client_id,
        'X-Client-Secret': client_secret,
        'Content-Type': 'application/json',
      },
      body: data,
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('SMS API Error:', result)
      throw new Error(`SMS API Error: ${result.message || result.error || 'Unknown error'}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('SMS Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})