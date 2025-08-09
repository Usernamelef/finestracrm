const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== DÉBUT FONCTION SMS SMSTOOLS (TEST) ===')
    
    const requestBody = await req.json()
    console.log('Corps de la requête reçu:', requestBody)
    
    const { to, message, sender } = requestBody

    // Récupération des identifiants depuis les variables d'environnement
    const client_id = Deno.env.get('SMSTOOLS_CLIENT_ID')
    const client_secret = Deno.env.get('SMSTOOLS_CLIENT_SECRET')
    
    if (!client_id || !client_secret) {
      console.error('=== ERREUR: VARIABLES D\'ENVIRONNEMENT MANQUANTES ===')
      console.error('SMSTOOLS_CLIENT_ID:', client_id ? 'DÉFINI' : 'MANQUANT')
      console.error('SMSTOOLS_CLIENT_SECRET:', client_secret ? 'DÉFINI' : 'MANQUANT')
      throw new Error('Variables d\'environnement SMSTOOLS_CLIENT_ID et SMSTOOLS_CLIENT_SECRET requises')
    }
    
    console.log('=== IDENTIFIANTS UTILISÉS (DEPUIS ENV) ===')
    console.log('Client ID:', client_id)
    console.log('Client Secret:', client_secret ? '***DÉFINI***' : 'MANQUANT')
    console.log('Destinataire:', to)
    console.log('Message:', message)
    console.log('Expéditeur:', sender || 'La Finestra')
    console.log('Longueur du message:', message.length, 'caractères')
    
    // Vérifier la longueur du message
    if (message.length > 160) {
      console.error('Message trop long:', message.length, 'caractères (max 160)')
      throw new Error(`Message trop long: ${message.length} caractères (maximum 160)`)
    }

    // Vérifier le format du numéro de téléphone
    console.log('=== VÉRIFICATION DU NUMÉRO ===')
    console.log('Numéro original:', to)
    
    // Nettoyer le numéro : supprimer espaces, tirets, parenthèses, +
    let cleanedNumber = to.replace(/[\s\-\(\)\+]/g, '')
    console.log('Numéro nettoyé:', cleanedNumber)
    
    // Gestion spécifique des formats suisses
    if (cleanedNumber.startsWith('41')) {
      // Déjà au bon format
      console.log('Format 41 détecté, gardé tel quel:', cleanedNumber)
    } else if (cleanedNumber.startsWith('0041')) {
      cleanedNumber = cleanedNumber.substring(2) // Supprimer 00, garder 41
      console.log('Format 0041 converti en:', cleanedNumber)
    } else if (cleanedNumber.startsWith('0')) {
      cleanedNumber = '41' + cleanedNumber.substring(1) // Remplacer 0 par 41
      console.log('Format 0 converti en:', cleanedNumber)
    } else {
      // Ajouter 41 si pas de code pays
      cleanedNumber = '41' + cleanedNumber
      console.log('Ajout du code pays 41:', cleanedNumber)
    }
    
    // Validation finale du format
    if (!cleanedNumber.match(/^41\d{9}$/)) {
      console.error('ERREUR: Format de numéro invalide après nettoyage:', cleanedNumber)
      console.error('Le numéro doit être au format 41XXXXXXXXX (12 chiffres total)')
      throw new Error(`Format de numéro invalide: ${cleanedNumber}. Attendu: 41XXXXXXXXX`)
    }
    
    console.log('Numéro final utilisé:', cleanedNumber)

    // Format des données pour SMSTools API
    const smsData = {
      message: message,
      to: cleanedNumber,
      sender: sender || 'La Finestra',
    }
    
    console.log('=== DONNÉES ENVOYÉES À SMSTOOLS ===')
    console.log('Données complètes:', JSON.stringify(smsData, null, 2))

    const apiUrl = 'https://api.smsgatewayapi.com/v1/message/send'
    console.log('URL API:', apiUrl)
    
    const headers = {
      'X-Client-Id': client_id,
      'X-Client-Secret': client_secret,
      'Content-Type': 'application/json',
    }
    
    console.log('=== HEADERS ENVOYÉS ===')
    console.log('Headers:', JSON.stringify(headers, null, 2))
    
    console.log('=== ENVOI DE LA REQUÊTE ===')
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(smsData),
    })

    console.log('=== RÉPONSE REÇUE ===')
    console.log('Statut:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Headers de réponse:', Object.fromEntries(response.headers.entries()))

    // Cloner la réponse pour éviter l'erreur "Body already consumed"
    const responseText = await response.text()
    console.log('Corps de la réponse (texte brut):', responseText)

    let result
    try {
      result = JSON.parse(responseText)
      console.log('Réponse parsée en JSON:', result)
    } catch (jsonError) {
      console.error('Impossible de parser en JSON:', jsonError)
      result = { raw_response: responseText }
    }

    if (!response.ok) {
      console.error('=== ERREUR API SMSTOOLS ===')
      console.error('Statut HTTP:', response.status)
      console.error('Réponse complète:', result)
      
      // Analyse détaillée des erreurs SMSTools
      let errorMessage = `SMSTools Error ${response.status}`
      
      if (result.error) {
        console.error('Code d\'erreur SMSTools:', result.error)
        
        switch (result.error) {
          case '111':
            errorMessage += ': Identifiants invalides (Client ID/Secret incorrects)'
            console.error('DIAGNOSTIC: Vérifiez que les identifiants SMSTools sont corrects')
            break
          case '112':
            errorMessage += ': Numéro de téléphone invalide'
            console.error('DIAGNOSTIC: Format du numéro incorrect:', cleanedNumber)
            break
          case '113':
            errorMessage += ': Message vide ou trop long'
            console.error('DIAGNOSTIC: Problème avec le message:', message)
            break
          case '114':
            errorMessage += ': Crédit insuffisant'
            console.error('DIAGNOSTIC: Pas assez de crédit sur le compte SMSTools')
            break
          default:
            errorMessage += `: Code d'erreur ${result.error}`
        }
      } else {
        errorMessage += `: ${responseText}`
      }
      
      throw new Error(errorMessage)
    }

    console.log('=== SMS ENVOYÉ AVEC SUCCÈS ===')
    console.log('Résultat final:', result)

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
    console.error('=== ERREUR DANS LA FONCTION SMS ===')
    console.error('Type d\'erreur:', error.constructor.name)
    console.error('Message d\'erreur:', error.message)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.constructor.name,
        details: 'Voir les logs Supabase pour plus de détails'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})