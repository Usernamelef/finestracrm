import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Client Supabase principal (avec authentification)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client Supabase complètement anonyme - force l'utilisation du rôle anon
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'sb-anon-only', // Clé de stockage différente pour éviter les conflits
    storage: {
      // Stockage factice qui ne sauvegarde rien
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  },
  global: {
    headers: {
      // Force l'utilisation de la clé anon uniquement
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }
})

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
      throw new Error(`Erreur base de données: ${response.status} - ${errorText}`)
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
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('date_creation', { ascending: false })

  if (error) throw error
  return data
}

// Fonction pour mettre à jour le statut d'une réservation
export const updateReservationStatus = async (id: string, statut: string, tableAssignee?: number, tablesMultiples?: number[]) => {
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
  try {
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

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi du SMS')
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur SMS:', error)
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
  return `Bonjour ${nom}, votre réservation du ${date} à ${heure} pour ${personnes} personne${personnes > 1 ? 's' : ''} est confirmée. À bientôt à La Finestra ! +41(0)22 312 23 22`
}

export const getCancellationSMSTemplate = (nom: string, date: string, heure: string) => {
  return `Bonjour ${nom}, votre réservation du ${date} à ${heure} a été annulée. Contactez-nous pour réserver à nouveau. La Finestra +41(0)22 312 23 22`
}

// Fonction pour nettoyer le numéro de téléphone (format international)
export const formatPhoneNumber = (phone: string) => {
  // Supprimer tous les espaces, tirets, parenthèses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Si le numéro commence par +41, le garder tel quel
  if (cleaned.startsWith('+41')) {
    return cleaned.replace('+', '')
  }
  
  // Si le numéro commence par 0041, le garder tel quel
  if (cleaned.startsWith('0041')) {
    return cleaned
  }
  
  // Si le numéro commence par 0, remplacer par 41
  if (cleaned.startsWith('0')) {
    return '41' + cleaned.substring(1)
  }
  
  // Si le numéro ne commence pas par 41, l'ajouter
  if (!cleaned.startsWith('41')) {
    return '41' + cleaned
  }
  
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