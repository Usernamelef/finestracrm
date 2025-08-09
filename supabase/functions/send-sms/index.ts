const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== DÉBUT FONCTION SMS SMSTOOLS ===')
    
    const requestBody = await req.json()
    console.log('Corps de la requête reçu:', requestBody)
    
    const { to, message, sender } = requestBody

    // Récupération des identifiants SMSTools depuis les variables d'environnement
    const client_id = Deno.env.get('SMS_CLIENT_ID') || '13742224586362909733'
    const client_secret = Deno.env.get('SMS_CLIENT_SECRET') || 'gOMbIkbDEN3k2zPRrupC'
    
    console.log('Identifiants SMSTools utilisés:')
    console.log('- Client ID:', client_id)
    console.log('- Client Secret:', client_secret ? '[DÉFINI]' : '[NON DÉFINI]')
    console.log('- Destinataire:', to)
    console.log('- Message:', message)
    console.log('- Expéditeur:', sender || 'La Finestra')
    console.log('- Longueur du message:', message.length, 'caractères')
    
    // Vérifier la longueur du message
    if (message.length > 160) {
      console.error('Message trop long:', message.length, 'caractères (max 160)')
      throw new Error(`Message trop long: ${message.length} caractères (maximum 160)`)
    }

    // Format des données pour SMSTools API
    const smsData = {
      message: message,
      to: to,
      sender: sender || 'La Finestra',
    }
    
    console.log('Données SMS à envoyer:', smsData)

    console.log('Envoi de la requête à SMSTools API...')
    const response = await fetch('https://api.smstools.com/send', {
      method: 'POST',
      headers: {
        'X-Client-Id': client_id,
        'X-Client-Secret': client_secret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData),
    })

    console.log('Statut de la réponse SMSTools:', response.status)
    console.log('Headers de la réponse:', Object.fromEntries(response.headers.entries()))

    // Cloner la réponse pour éviter l'erreur "Body already consumed"
    const responseForJson = response.clone()
    const responseForText = response.clone()

    let result
    try {
      result = await responseForJson.json()
      console.log('Réponse complète de SMSTools:', result)
    } catch (jsonError) {
      console.error('Erreur de parsing JSON, récupération du texte brut...')
      const textResponse = await responseForText.text()
      console.error('Réponse HTML/texte de SMSTools:', textResponse)
      
      throw new Error(`SMSTools API a retourné une page HTML d'erreur au lieu de JSON. Vérifiez vos identifiants SMS_CLIENT_ID et SMS_CLIENT_SECRET. Réponse: ${textResponse.substring(0, 200)}...`)
    }

    if (!response.ok) {
      console.error('=== ERREUR API SMSTOOLS ===')
      console.error('Statut:', response.status)
      console.error('Réponse:', result)
      
      // Gestion spécifique des codes d'erreur SMSTools
      let errorMessage = `SMSTools API Error (${response.status})`
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

    console.log('=== SMS ENVOYÉ AVEC SUCCÈS VIA SMSTOOLS ===')
    console.log('Résultat:', result)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('=== ERREUR DANS LA FONCTION SMS SMSTOOLS ===')
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