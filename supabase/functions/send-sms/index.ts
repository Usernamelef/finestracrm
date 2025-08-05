const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== DÉBUT FONCTION SMS ===')
    
    const requestBody = await req.json()
    console.log('Corps de la requête reçu:', requestBody)
    
    const { to, message, sender } = requestBody

    // Vos identifiants corrects
    const client_id = '13742224586362909733'
    const client_secret = 'gOMbIkbDEN3k2zPRrupC'
    
    console.log('Identifiants utilisés:')
    console.log('- Client ID:', client_id)
    console.log('- Client Secret:', client_secret ? '[DÉFINI]' : '[NON DÉFINI]')
    console.log('- Destinataire:', to)
    console.log('- Message:', message)
    console.log('- Expéditeur:', sender || 'La Finestra')
    console.log('- Longueur du message:', message.length, 'caractères')
    
    // Vérifier la longueur du message
    if (message.length > 150) {
      console.error('Message trop long:', message.length, 'caractères (max 150)')
      throw new Error(`Message trop long: ${message.length} caractères (maximum 150)`)
    }

    // Format des données selon la documentation SMS Gateway API
    const smsData = {
      message: message,
      to: to,
      sender: sender || 'La Finestra',
    }
    
    console.log('Données SMS à envoyer:', smsData)

    console.log('Envoi de la requête à l\'API SMS...')
    const response = await fetch('https://api.smsgatewayapi.com/v1/message/send', {
      method: 'POST',
      headers: {
        'X-Client-Id': client_id,
        'X-Client-Secret': client_secret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData),
    })

    console.log('Statut de la réponse API:', response.status)
    console.log('Headers de la réponse:', Object.fromEntries(response.headers.entries()))

    const result = await response.json()
    console.log('Réponse complète de l\'API:', result)

    if (!response.ok) {
      console.error('=== ERREUR API SMS ===')
      console.error('Statut:', response.status)
      console.error('Réponse:', result)
      
      // Gestion spécifique des codes d'erreur
      let errorMessage = `SMS API Error (${response.status})`
      if (result.error) {
        errorMessage += `: ${result.error}`
      } else if (result.message) {
        errorMessage += `: ${result.message}`
      } else if (result.code) {
        errorMessage += `: Code ${result.code}`
      } else {
        errorMessage += `: ${JSON.stringify(result)}`
      }
      
      throw new Error(errorMessage)
    }

    console.log('=== SMS ENVOYÉ AVEC SUCCÈS ===')
    console.log('Résultat:', result)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('=== ERREUR DANS LA FONCTION SMS ===')
    console.error('Type d\'erreur:', error.constructor.name)
    console.error('Message d\'erreur:', error.message)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.constructor.name,
        details: 'Voir les logs pour plus de détails'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})