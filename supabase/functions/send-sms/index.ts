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

    // Identifiants SMSTools depuis les variables d'environnement
    const client_id = Deno.env.get('SMSTOOLS_CLIENT_ID')
    const client_secret = Deno.env.get('SMSTOOLS_CLIENT_SECRET')
    
    if (!client_id || !client_secret) {
      console.error('Variables d\'environnement SMSTools manquantes')
      throw new Error('Configuration SMSTools manquante: SMSTOOLS_CLIENT_ID et SMSTOOLS_CLIENT_SECRET requis')
    }
    
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
    const apiUrl = 'https://api.smsgatewayapi.com/v1/message/send'
    console.log('URL API appelée:', apiUrl)
    
    const response = await fetch(apiUrl, {
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
      
      throw new Error(`Erreur parsing JSON. Status: ${response.status}. Réponse: ${textResponse.substring(0, 300)}`)
    }

    if (!response.ok) {
      console.error('=== ERREUR API SMSTOOLS ===')
      console.error('Statut:', response.status)
      console.error('Réponse:', result)
      
      // Gestion spécifique des codes d'erreur SMSTools
      let errorMessage = `SMSTools Error ${response.status}`
      
      // Codes d'erreur SMSTools courants
      if (result.error === '111') {
        errorMessage += ': Identifiants invalides (Client ID/Secret incorrects)'
      } else if (result.error === '112') {
        errorMessage += ': Numéro de téléphone invalide'
      } else if (result.error === '113') {
        errorMessage += ': Message vide ou trop long'
      } else if (result.error === '114') {
        errorMessage += ': Crédit insuffisant'
      } else if (result.error) {
        errorMessage += `: Code ${result.error}`
      } else if (result.message) {
        errorMessage += `: ${result.message}`
      } else {
        errorMessage += `: ${JSON.stringify(result).substring(0, 100)}`
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