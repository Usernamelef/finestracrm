// Service SMS sécurisé
export interface SMSResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface SMSError {
  status: number;
  message: string;
  response: any;
}

/**
 * Fonction sécurisée pour envoyer un SMS
 * @param numero - Numéro de téléphone au format international (ex: +41781234567)
 * @param message - Message à envoyer (minimum 1 caractère)
 * @returns Promise<SMSResponse>
 */
export async function sendSMS(numero: string, message: string): Promise<SMSResponse> {
  // Validation des paramètres
  if (!numero || typeof numero !== 'string') {
    console.error('❌ Erreur SMS: Le numéro de téléphone est requis');
    throw new Error('Le numéro de téléphone est requis');
  }

  if (!numero.startsWith('+')) {
    console.error('❌ Erreur SMS: Le numéro doit commencer par "+" (format international)');
    throw new Error('Le numéro doit être au format international (+41781234567)');
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    console.error('❌ Erreur SMS: Le message est requis et doit contenir au moins 1 caractère');
    throw new Error('Le message est requis et doit contenir au moins 1 caractère');
  }

  // Récupération de la clé API depuis les variables d'environnement
  const apiKey = import.meta.env.VITE_SMS_API_KEY || 'VOTRE_CLE_API';
  
  if (apiKey === 'VOTRE_CLE_API') {
    console.warn('⚠️ Attention: Utilisez une vraie clé API en définissant VITE_SMS_API_KEY');
  }

  try {
    console.log(`📱 Envoi SMS vers ${numero}...`);
    
    const response = await fetch('https://api.smsprovider.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        numero: numero,
        message: message
      })
    });

    // Récupération du corps de la réponse
    const responseData = await response.json().catch(() => ({}));

    // Gestion des erreurs HTTP
    if (!response.ok) {
      const errorInfo: SMSError = {
        status: response.status,
        message: responseData.message || response.statusText || 'Erreur inconnue',
        response: responseData
      };

      console.error('❌ Erreur SMS API:', {
        status: errorInfo.status,
        message: errorInfo.message,
        corpsComplet: errorInfo.response
      });

      throw new Error(`Erreur SMS (${errorInfo.status}): ${errorInfo.message}`);
    }

    // Succès
    console.log(`✅ SMS envoyé avec succès à ${numero}`);
    
    return {
      success: true,
      message: `SMS envoyé avec succès à ${numero}`,
      data: responseData
    };

  } catch (error) {
    // Gestion des erreurs réseau ou autres
    if (error instanceof Error) {
      console.error('❌ Erreur lors de l\'envoi SMS:', error.message);
      throw error;
    } else {
      console.error('❌ Erreur inconnue lors de l\'envoi SMS:', error);
      throw new Error('Erreur inconnue lors de l\'envoi SMS');
    }
  }
}