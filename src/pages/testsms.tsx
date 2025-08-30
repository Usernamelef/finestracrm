import React from 'react';
import SMSForm from '../components/SMSForm';

const TestSMS: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Test d'envoi SMS
          </h1>
          <p className="text-gray-600">
            Interface de test pour la fonction SMS sécurisée
          </p>
        </div>
        
        <SMSForm />
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Configuration requise:
          </h3>
          <p className="text-xs text-yellow-700">
            Définissez la variable d'environnement <code>VITE_SMS_API_KEY</code> 
            dans votre fichier <code>.env</code> avec votre vraie clé API SMS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestSMS;