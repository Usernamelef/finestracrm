import React, { useState } from 'react';
import { sendSMS } from '../lib/supabase';

interface SMSFormState {
  numero: string;
  message: string;
  isLoading: boolean;
  successMessage: string;
  errorMessage: string;
}

const SMSForm: React.FC = () => {
  const [state, setState] = useState<SMSFormState>({
    numero: '',
    message: '',
    isLoading: false,
    successMessage: '',
    errorMessage: ''
  });

  // Fonction pour mettre à jour un champ spécifique
  const updateField = (field: keyof SMSFormState, value: string | boolean) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  // Fonction pour réinitialiser les messages
  const clearMessages = () => {
    setState(prev => ({ 
      ...prev, 
      successMessage: '', 
      errorMessage: '' 
    }));
  };

  // Fonction principale d'envoi SMS (protégée contre les appels multiples)
  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Empêcher les appels multiples
    if (state.isLoading) {
      console.log('⏳ Envoi SMS déjà en cours, veuillez patienter...');
      return;
    }

    // Réinitialiser les messages et activer le loading
    clearMessages();
    updateField('isLoading', true);

    try {
      // Appel de la fonction SMS
      const result = await sendSMS(state.numero.trim(), state.message.trim());
      
      // Succès
      updateField('successMessage', result.message);
      
      // Optionnel: réinitialiser le formulaire après succès
      setState(prev => ({
        ...prev,
        numero: '',
        message: '',
        isLoading: false,
        successMessage: result.message,
        errorMessage: ''
      }));

    } catch (error) {
      // Gestion des erreurs
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      updateField('errorMessage', errorMessage);
      updateField('isLoading', false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Envoyer un SMS
      </h2>

      <form onSubmit={handleSendSMS} className="space-y-4">
        {/* Champ numéro */}
        <div>
          <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            id="numero"
            value={state.numero}
            onChange={(e) => updateField('numero', e.target.value)}
            placeholder="+41781234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={state.isLoading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Format international requis (ex: +41781234567)
          </p>
        </div>

        {/* Champ message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id="message"
            value={state.message}
            onChange={(e) => updateField('message', e.target.value)}
            placeholder="Votre message..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            disabled={state.isLoading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {state.message.length} caractères
          </p>
        </div>

        {/* Bouton d'envoi */}
        <button
          type="submit"
          disabled={state.isLoading || !state.numero.trim() || !state.message.trim()}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            state.isLoading || !state.numero.trim() || !state.message.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {state.isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Envoi en cours...
            </span>
          ) : (
            'Envoyer SMS'
          )}
        </button>
      </form>

      {/* Messages de succès */}
      {state.successMessage && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {state.successMessage}
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {state.errorMessage && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {state.errorMessage}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Instructions:</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Le numéro doit être au format international (+41...)</li>
          <li>• Le message doit contenir au moins 1 caractère</li>
          <li>• Un seul envoi par clic (protection contre les doublons)</li>
          <li>• Vérifiez la console pour les logs détaillés</li>
        </ul>
      </div>
    </div>
  );
};

export default SMSForm;