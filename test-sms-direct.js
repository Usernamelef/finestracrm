// Test direct de l'API SMSTools
// Exécutez ce fichier avec: node test-sms-direct.js

const fetch = require('node:fetch');

async function testSMSTools() {
  console.log('=== TEST DIRECT SMSTOOLS ===');
  
  const client_id = '13742224586362909733';
  const client_secret = 'gOMbIkbDEN3k2zPRrupC';
  const to = '41789465846'; // Votre numéro
  const message = 'Test SMS depuis Node.js';
  
  console.log('Client ID:', client_id);
  console.log('Destinataire:', to);
  console.log('Message:', message);
  
  try {
    const response = await fetch('https://api.smsgatewayapi.com/v1/message/send', {
      method: 'POST',
      headers: {
        'X-Client-Id': client_id,
        'X-Client-Secret': client_secret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        to: to,
        sender: 'La Finestra',
      })
    });
    
    console.log('Status:', response.status);
    const result = await response.text();
    console.log('Réponse:', result);
    
    if (response.ok) {
      console.log('✅ SMS ENVOYÉ AVEC SUCCÈS !');
    } else {
      console.log('❌ ERREUR:', result);
    }
    
  } catch (error) {
    console.error('❌ ERREUR RÉSEAU:', error.message);
  }
}

testSMSTools();