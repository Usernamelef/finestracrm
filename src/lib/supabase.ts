import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérification de la disponibilité de Supabase
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseUrl.includes('.supabase.co') && 
  supabaseAnonKey.length > 50

// Clients Supabase (null si non configuré)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null
export const supabaseAnon = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'sb-anon-only',
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }
}) : null


export interface Reservation {
  id?: string
  nom_client: string
  email_client: string
  telephone_client: string
  date_reservation: string
  heure_reservation: string
  nombre_personnes: number
  commentaire?: string
  statut: 'nouvelle' | 'en_attente' | 'assignee' | 'arrivee' | 'annulee'
  table_assignee?: number
  date_creation: string
  date_annulation?: string
}

// Fonction pour créer une réservation
export const createReservation = async (reservationData: Omit<Reservation, 'id' | 'date_creation'> & { statut?: string }) => {
  if (!isSupabaseConfigured) {
    throw new Error('Configuration Supabase manquante. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env')
  }

  try {
    // Utilisation directe de fetch pour éviter complètement le SDK Supabase
    // et garantir qu'aucun token d'authentification ne soit envoyé
    const response = await fetch(`${supabaseUrl}/rest/v1/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...reservationData,
        statut: reservationData.statut || 'nouvelle',
        date_creation: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erreur HTTP lors de la création de réservation:', response.status, errorText)
      
      // Gestion spécifique de l'erreur 401 (clé API invalide)
      if (response.status === 401) {
        throw new Error('Clé API Supabase invalide. Veuillez vérifier votre VITE_SUPABASE_ANON_KEY dans le fichier .env. Consultez les paramètres API de votre projet Supabase pour obtenir la bonne clé.')
      }
      
      throw new Error(`Erreur base de données (${response.status}): ${errorText}`)
    }
    
    const data = await response.json()
    
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée retournée après insertion')
    }
    
    console.log('Réservation créée avec succès:', data[0])
    return data[0]
  } catch (error) {
    console.error('Erreur dans createReservation:', error)
    throw error
  }
}

// Fonction pour récupérer les réservations par statut
export const getReservationsByStatus = async (statut: string) => {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré')
  }

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('statut', statut)
    .order('date_reservation', { ascending: true })

  if (error) throw error
  return data
}

// Fonction pour récupérer toutes les réservations
export const getAllReservations = async () => {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré')
  }

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('date_creation', { ascending: false })

  if (error) throw error
  return data
}

// Fonction pour mettre à jour le statut d'une réservation
export const updateReservationStatus = async (id: string, statut: string, tableAssignee?: number, tablesMultiples?: number[]) => {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré')
  }

  const updateData: any = { statut }
  
  if (tableAssignee) {
    updateData.table_assignee = tableAssignee
  }
  
  // Stocker les tables multiples dans le commentaire si nécessaire
  if (tablesMultiples && tablesMultiples.length > 1) {
    const currentReservation = await supabase
      .from('reservations')
      .select('commentaire')
      .eq('id', id)
      .single();
    
    const existingComment = currentReservation.data?.commentaire || '';
    const tablesInfo = `[Tables: ${tablesMultiples.join(', ')}]`;
    
    // Ajouter l'info des tables au commentaire
    updateData.commentaire = existingComment ? `${existingComment} ${tablesInfo}` : tablesInfo;
  }
  
  if (statut === 'annulee') {
    updateData.date_annulation = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

// Fonction pour envoyer un email
export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase n\'est pas configuré pour l\'envoi d\'emails')
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        to,
        subject,
        html
      })
    })

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi de l\'email')
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur email:', error)
    throw error
  }
}
// Fonction pour envoyer un SMS
export const sendSMS = async (to: string, message: string, sender?: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Configuration Supabase manquante pour l\'envoi de SMS')
  }

  try {
    console.log('=== DÉBUT ENVOI SMS ===')
    console.log('URL Supabase:', supabaseUrl)
    console.log('Destinataire:', to)
    console.log('Message:', message)
    console.log('Longueur message:', message.length, 'caractères')
    console.log('Sender:', sender || 'La Finestra')
    
    console.log('=== ENVOI SMS ===')
    console.log('Destinataire:', to)
    console.log('Message:', message)
    console.log('Longueur:', message.length, 'caractères')
    
    // Vérifier la longueur du message
    if (message.length > 160) {
      console.error('Message SMS trop long:', message.length, 'caractères')
      throw new Error(`Message trop long: ${message.length} caractères (max 160)`)
    }
    
    console.log('=== APPEL FONCTION EDGE SMS ===')
    const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        to,
        message,
        sender: sender || 'La Finestra'
      })
    })

    // Cloner la réponse immédiatement pour éviter l'erreur "Body already consumed"
    const clonedResponse = response.clone()

    console.log('=== RÉPONSE SMS ===')
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await clonedResponse.text()
      console.error('=== ERREUR SMS ===')
      console.error('Status:', response.status)
      console.error('Response complète:', errorText)
      console.error('URL appelée:', `${supabaseUrl}/functions/v1/send-sms`)
      // Ne pas faire échouer - retourner un succès simulé
      throw new Error(`Erreur SMS (${response.status}): ${errorText}`)
    }

    const result = await clonedResponse.json()
    console.log('=== SMS ENVOYÉ AVEC SUCCÈS ===')
    console.log('Résultat:', result)
    return result
  } catch (error) {
    console.error('=== ERREUR SMS ===')
    console.error('Type:', error.constructor.name)
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    // Ne pas faire échouer - retourner un succès simulé
    throw error
  }
}

// Templates d'emails
export const getConfirmationEmailTemplate = (nom: string, date: string, heure: string, personnes: number) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #440F1E;">✅ Votre réservation est confirmée – La Finestra</h2>
      <p>Bonjour ${nom},</p>
      <p>Votre réservation du <strong>${date}</strong> à <strong>${heure}</strong> pour <strong>${personnes}</strong> personne${personnes > 1 ? 's' : ''} a bien été confirmée.</p>
      <p>À très bientôt à La Finestra !</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        La Finestra<br>
        Rue de la Cité 11, 1204 Genève<br>
        +41(0)22 312 23 22
      </p>
    </div>
  `
}

// Templates de SMS
export const getConfirmationSMSTemplate = (nom: string, date: string, heure: string, personnes: number) => {
  const message = `Bonjour ${nom}, réservation ${date} ${heure} pour ${personnes}p confirmée. À bientôt ! La Finestra +41223122322`
  return message.length > 150 ? message.substring(0, 146) + '...' : message
}

export const getCancellationSMSTemplate = (nom: string, date: string, heure: string) => {
  const message = `Bonjour ${nom}, réservation ${date} ${heure} annulée. Contactez-nous pour réserver. La Finestra +41223122322`
  return message.length > 150 ? message.substring(0, 146) + '...' : message
}

// Fonction pour nettoyer le numéro de téléphone (format international)
export const formatPhoneNumber = (phone: string) => {
  console.log('=== FORMATAGE NUMÉRO ===')
  console.log('Numéro original:', phone)
  
  // Supprimer tous les espaces, tirets, parenthèses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  console.log('Après nettoyage:', cleaned)
  
  // Si le numéro commence par +41, supprimer le +
  if (cleaned.startsWith('+41')) {
    const result = cleaned.substring(1)
    console.log('Format +41 détecté, résultat:', result)
    return result
  }
  
  // Si le numéro commence par 0041, le garder
  if (cleaned.startsWith('0041')) {
    const result = '41' + cleaned.substring(4) // Supprimer 0041 et ajouter 41
    console.log('Format 0041 détecté, résultat:', result)
    return result
  }
  
  // Si le numéro commence par 0, remplacer par 41
  if (cleaned.startsWith('0')) {
    const result = '41' + cleaned.substring(1)
    console.log('Format 0 détecté, résultat:', result)
    return result
  }
  
  // Si le numéro ne commence pas par 41, l'ajouter
  if (!cleaned.startsWith('41')) {
    const result = '41' + cleaned
    console.log('Ajout du préfixe 41, résultat:', result)
    return result
  }
  
  console.log('Numéro déjà au bon format:', cleaned)
  return cleaned
}
export const getCancellationEmailTemplate = (nom: string, date: string, heure: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #440F1E;">❌ Votre réservation a été annulée – La Finestra</h2>
      <p>Bonjour ${nom},</p>
      <p>Votre réservation du <strong>${date}</strong> à <strong>${heure}</strong> a été annulée.</p>
      <p>Contactez-nous si vous souhaitez réserver à nouveau.</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        La Finestra<br>
        Rue de la Cité 11, 1204 Genève<br>
        +41(0)22 312 23 22
      </p>
    </div>
  `
}