import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, MessageSquare, CheckCircle } from 'lucide-react';
import { createReservation, sendEmail, sendSMS, getConfirmationEmailTemplate, getConfirmationSMSTemplate, formatPhoneNumber } from '../lib/supabase';

const Reservations = () => {
  const [formData, setFormData] = useState({
    type: 'table',
    date: '',
    time: '',
    guests: '',
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Début de la soumission du formulaire...')
      
      // Envoyer à Formspree (méthode principale)
      console.log('Envoi à Formspree...')
      const form = e.target as HTMLFormElement;
      const formDataForFormspree = new FormData(form);
      
      // Ajouter des champs cachés pour Formspree
      formDataForFormspree.append('_subject', `Nouvelle réservation - ${formData.name}`);
      formDataForFormspree.append('_template', 'table');
      
      const formspreeResponse = await fetch('https://formspree.io/f/xblyzvwk', {
        method: 'POST',
        body: formDataForFormspree,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!formspreeResponse.ok) {
        const errorText = await formspreeResponse.text();
        console.error('Erreur Formspree:', formspreeResponse.status, errorText);
        throw new Error(`Erreur lors de l'envoi de l'email: ${formspreeResponse.status}`);
      }
      
      console.log('Formspree - Succès')
      
      // Enregistrer la réservation dans Supabase pour le CRM
      try {
        console.log('Enregistrement dans Supabase pour le CRM...')
        const reservationData = {
          nom_client: formData.name,
          email_client: formData.email,
          telephone_client: formData.phone,
          date_reservation: formData.date,
          heure_reservation: formData.time,
          nombre_personnes: parseInt(formData.guests),
          commentaire: formData.message || null,
          statut: 'nouvelle' // Statut pour apparaître dans "Nouvelles réservations"
        };
        
        await createReservation(reservationData);
        console.log('Réservation enregistrée dans Supabase avec succès');
      } catch (supabaseError) {
        console.warn('Erreur Supabase (non bloquante):', supabaseError);
        // Ne pas faire échouer la réservation si Supabase échoue
      }
      
      // Tentative d'envoi SMS de confirmation si Supabase est configuré
      try {
        console.log('=== TENTATIVE ENVOI SMS ===')
        console.log('Téléphone saisi:', formData.phone)
        
        const formattedPhone = formatPhoneNumber(formData.phone);
        console.log('Téléphone formaté:', formattedPhone)
        
        const smsMessage = getConfirmationSMSTemplate(
          formData.name,
          new Date(formData.date).toLocaleDateString('fr-FR'),
          formData.time,
          parseInt(formData.guests)
        );
        console.log('Message SMS généré:', smsMessage)
        console.log('Longueur du message:', smsMessage.length, 'caractères')
        
        const smsResult = await sendSMS(formattedPhone, smsMessage);
        console.log('=== SMS ENVOYÉ AVEC SUCCÈS ===')
        console.log('Résultat SMS:', smsResult)
      } catch (smsError) {
        console.warn('=== ERREUR SMS (NON BLOQUANTE) ===')
        console.warn('Erreur SMS:', smsError)
        // Ne pas faire échouer la réservation si le SMS échoue
      }
      
      // Envoyer un email de confirmation au client via Formspree
      console.log('Envoi email de confirmation au client...')
      const confirmationData = new FormData();
      confirmationData.append('email', formData.email);
      confirmationData.append('name', formData.name);
      confirmationData.append('date', formData.date);
      confirmationData.append('time', formData.time);
      confirmationData.append('guests', formData.guests);
      confirmationData.append('_subject', 'Confirmation de votre réservation - La Finestra');
      confirmationData.append('_template', 'confirmation');
      
      // Envoyer la confirmation au client (optionnel - ne pas faire échouer si ça ne marche pas)
      try {
        await fetch('https://formspree.io/f/xblyzvwk', {
          method: 'POST',
          body: confirmationData,
          headers: {
            'Accept': 'application/json'
          }
        });
        console.log('Email de confirmation envoyé au client');
      } catch (confirmError) {
        console.warn('Erreur envoi confirmation client (non bloquant):', confirmError);
      }
      
      console.log('Soumission complète réussie!')

      // Afficher le succès
      setIsSubmitted(true);
      
      console.log('Réservation envoyée par email via Formspree');
      
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ 
          type: 'table',
          date: '',
          time: '',
          guests: '',
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      
      alert(`Une erreur est survenue lors de l'envoi: ${error.message}\n\nVeuillez réessayer ou nous contacter directement au +41(0)22 312 23 22.`);
      
      console.log('Détails de l\'erreur complète:', error);
    }
  };

  // Horaires de base (suppression de 11:30)
  const baseTimeSlots = [
    '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
    '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45'
  ];

  // Fonction pour filtrer les horaires disponibles
  const availableTimeSlots = useMemo(() => {
    if (!formData.date) return baseTimeSlots;

    const selectedDate = new Date(formData.date);
    const today = new Date();
    
    // Normaliser les dates pour comparer seulement jour/mois/année
    const selectedDateString = selectedDate.toDateString();
    const todayString = today.toDateString();

    // Si la date sélectionnée est aujourd'hui
    if (selectedDateString === todayString) {
      const currentHour = today.getHours();
      const currentMinutes = today.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinutes;

      return baseTimeSlots.filter(timeSlot => {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotTimeInMinutes = hours * 60 + minutes;
        
        // Retourner seulement les créneaux qui sont après l'heure actuelle
        return slotTimeInMinutes > currentTimeInMinutes;
      });
    }

    // Pour les dates futures, retourner tous les créneaux
    return baseTimeSlots;
  }, [formData.date]);

  // Vérifier si la date sélectionnée est dans le passé
  const isDateInPast = useMemo(() => {
    if (!formData.date) return false;
    
    const selectedDate = new Date(formData.date);
    const today = new Date();
    
    // Normaliser les dates pour comparer seulement jour/mois/année
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return selectedDate < today;
  }, [formData.date]);

  // Vérifier si le formulaire peut être soumis
  const canSubmit = !isDateInPast && formData.date && formData.time && formData.guests && formData.name && formData.email && formData.phone;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-primary mb-4">Demande envoyée !</h2>
          <p className="text-gray-700 mb-6">
            Merci pour votre demande de réservation. Nous avons bien reçu votre demande
            et vous confirmerons les détails par email ou téléphone dans les plus brefs délais.
          </p>
          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-semibold text-primary mb-2">Récapitulatif</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Type:</strong> {formData.type === 'table' ? 'Table' : 'Salle événementielle'}</p>
              <p><strong>Date:</strong> {formData.date}</p>
              <p><strong>Heure:</strong> {formData.time}</p>
              <p><strong>Personnes:</strong> {formData.guests}</p>
              <p><strong>Nom:</strong> {formData.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsSubmitted(false)}
            className="mt-6 bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-full font-semibold transition-colors"
          >
            Nouvelle réservation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif font-bold text-primary mb-6 animate-fade-in-up">
              Réservation
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Réservez votre table ou notre salle privée pour une expérience culinaire inoubliable.
            </p>
          </div>
        </div>
      </section>

      {/* Reservation Form */}
      <section className="py-16 bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reservation Type */}
              <div className="animate-fade-in-up">
                <label className="block text-lg font-semibold text-primary mb-3">
                  Type de réservation
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="table"
                      checked={formData.type === 'table'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      formData.type === 'table' ? 'border-accent bg-accent/10' : 'border-gray-300 hover:border-accent'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Users className="text-accent" size={24} />
                        <div>
                          <h3 className="font-semibold text-primary">Table</h3>
                          <p className="text-sm text-gray-600">Réservation de table classique</p>
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="event"
                      checked={formData.type === 'event'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      formData.type === 'event' ? 'border-accent bg-accent/10' : 'border-gray-300 hover:border-accent'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-accent" size={24} />
                        <div>
                          <h3 className="font-semibold text-primary">Salle événementielle</h3>
                          <p className="text-sm text-gray-600">Événement privé jusqu'à 45 personnes</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">
                    <Calendar className="inline mr-2" size={20} />
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                      isDateInPast ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {isDateInPast && (
                    <p className="text-red-500 text-sm mt-1">
                      Veuillez sélectionner une date future.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">
                    <Clock className="inline mr-2" size={20} />
                    Heure
                  </label>
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    disabled={!formData.date || isDateInPast}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Choisir une heure</option>
                    {availableTimeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  {formData.date && availableTimeSlots.length === 0 && (
                    <p className="text-orange-600 text-sm mt-1">
                      Aucun créneau disponible pour aujourd'hui. Veuillez choisir une date future.
                    </p>
                  )}
                </div>
              </div>

              {/* Number of Guests */}
              <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <label className="block text-lg font-semibold text-primary mb-3">
                  <Users className="inline mr-2" size={20} />
                  Nombre de personnes
                </label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">Choisir le nombre de personnes</option>
                  {formData.type === 'table' ? (
                    Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>{num} personne{num > 1 ? 's' : ''}</option>
                    ))
                  ) : (
                    Array.from({ length: 43 }, (_, i) => i + 3).map((num) => (
                      <option key={num} value={num}>{num} personnes</option>
                    ))
                  )}
                </select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="+41 xx xxx xx xx"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                <label className="block text-lg font-semibold text-primary mb-3">
                  <MessageSquare className="inline mr-2" size={20} />
                  Message personnalisé (optionnel)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Allergies, demandes spéciales, occasion particulière..."
                />
              </div>

              {/* Submit Button */}
              <div className="text-center animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform ${
                    canSubmit
                      ? 'bg-accent hover:bg-accent/90 text-white hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Envoyer la demande
                </button>
                {!canSubmit && formData.date && formData.time && (
                  <p className="text-gray-500 text-sm mt-2">
                    Veuillez remplir tous les champs obligatoires
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-serif font-bold mb-4">Informations importantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Réservations de table</h4>
              <p>Confirmation par email ou téléphone sous 24h. Annulation possible jusqu'à 2h avant la réservation.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Événements privés</h4>
              <p>Devis personnalisé sur demande.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Reservations;