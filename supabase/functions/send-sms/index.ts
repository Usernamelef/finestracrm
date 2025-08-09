const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== DÉBUT FONCTION SMS SUPABASE ===')
    
    const requestBody = await req.json()
    console.log('Corps de la requête:', requestBody)
    
    const { to, message, sender } = requestBody

    // Identifiants en dur pour test
    const client_id = '13742224586362909733'
    const client_secret = 'gOMbIkbDEN3k2zPRrupC'
    
    console.log('=== PARAMÈTRES ===')
    console.log('Client ID:', client_id)
    console.log('Destinataire original:', to)
    console.log('Message:', message)
    console.log('Longueur message:', message.length)
    
    // Nettoyer le numéro
    let cleanedNumber = to.replace(/[\s\-\(\)\+]/g, '')
    
    if (cleanedNumber.startsWith('41')) {
      // Déjà bon
    } else if (cleanedNumber.startsWith('0041')) {
      cleanedNumber = cleanedNumber.substring(2)
    } else if (cleanedNumber.startsWith('0')) {
      cleanedNumber = '41' + cleanedNumber.substring(1)
    } else {
      cleanedNumber = '41' + cleanedNumber
    }
    
    console.log('Numéro nettoyé:', cleanedNumber)
    
    // Validation
    if (!cleanedNumber.match(/^41\d{9}$/)) {
      throw new Error(`Format invalide: ${cleanedNumber}`)
    }
    
    if (message.length > 160) {
      throw new Error(`Message trop long: ${message.length} caractères`)
    }

    // Données pour SMSTools
    const smsData = {
      message: message,
      to: cleanedNumber,
      sender: sender || 'LaFinestra',
    }
    
    console.log('=== ENVOI À SMSTOOLS ===')
    console.log('URL:', 'https://api.smsgatewayapi.com/v1/message/send')
    console.log('Données:', JSON.stringify(smsData))
    
    const response = await fetch('https://api.smsgatewayapi.com/v1/message/send', {
      method: 'POST',
      headers: {
        'X-Client-Id': client_id,
        'X-Client-Secret': client_secret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData),
    })

    console.log('=== RÉPONSE SMSTOOLS ===')
    console.log('Status:', response.status)
    
    const responseText = await response.text()
    console.log('Réponse brute:', responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { raw_response: responseText }
    }

    if (!response.ok) {
      console.error('=== ERREUR SMSTOOLS ===')
      console.error('Status:', response.status)
      console.error('Réponse:', result)
      
      throw new Error(`SMSTools Error ${response.status}: ${responseText}`)
    }

    console.log('=== SUCCÈS ===')
    console.log('Résultat:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        debug: {
          original_number: to,
          cleaned_number: cleanedNumber,
          message_length: message.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('=== ERREUR FONCTION ===')
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.constructor.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})