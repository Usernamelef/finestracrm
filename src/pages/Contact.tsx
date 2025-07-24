import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Send, CheckCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create form data for Formspree
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Submit to Formspree
    fetch('https://formspree.io/f/xblyzvwk', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '' });
        }, 5000);
      }
    }).catch(error => {
      console.error('Error:', error);
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif font-bold text-primary mb-6 animate-fade-in-up">
              Contact
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Nous sommes à votre disposition pour répondre à toutes vos questions 
              et vous accueillir dans les meilleures conditions.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              {/* Address */}
              <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in-up">
                <div className="flex items-start space-x-4">
                  <MapPin className="text-accent mt-1" size={24} />
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-2">Adresse</h3>
                    <p className="text-gray-700">
                      Rue de la Cité 11<br />
                      1204 Genève<br />
                      Suisse
                    </p>
                    <a 
                      href="https://maps.google.com/?q=Rue+de+la+Cité+11,+1204+Genève"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-accent hover:text-primary transition-colors"
                    >
                      Voir sur Google Maps →
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone and Email */}
              <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Phone className="text-accent" size={24} />
                    <div>
                      <h3 className="text-xl font-bold text-primary">Téléphone</h3>
                      <a 
                        href="tel:+41223122322"
                        className="text-gray-700 hover:text-accent transition-colors"
                      >
                        +41(0)22 312 23 22
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Mail className="text-accent" size={24} />
                    <div>
                      <h3 className="text-xl font-bold text-primary">Email</h3>
                      <a 
                        href="mailto:reservation@lafinestra.ch"
                        className="text-gray-700 hover:text-accent transition-colors"
                      >
                        reservation@lafinestra.ch
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="flex items-start space-x-4">
                  <Clock className="text-accent mt-1" size={24} />
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-3">Horaires d'ouverture</h3>
                    <div className="space-y-2 text-gray-700">
                      <div className="flex justify-between">
                        <span className="font-semibold">Lundi - Vendredi</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Midi:</span>
                        <span>12h00 - 14h30</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Soir:</span>
                        <span>19h00 - 22h30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Samedi</span>
                        <span>19h00 - 22h30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Dimanche</span>
                        <span className="text-accent">Fermé</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <h3 className="text-xl font-bold text-primary mb-4">Suivez-nous</h3>
                <div className="flex space-x-4">
                  <a 
                    href="https://facebook.com/lafinestrarestaurant" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-700 hover:text-accent transition-colors"
                  >
                    <Facebook size={20} />
                    <span>Facebook</span>
                  </a>
                  <a 
                    href="https://instagram.com/lafinestrarestaurant" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-700 hover:text-accent transition-colors"
                  >
                    <Instagram size={20} />
                    <span>Instagram</span>
                  </a>
                  <a 
                    href="https://www.tiktok.com/@lafinestra.geneve?_t=ZN-8xpusYF7OVy&_r=1" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-700 hover:text-accent transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span>TikTok</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <h2 className="text-2xl font-serif font-bold text-primary mb-8 pt-4 text-center">
                Contactez-nous
              </h2>
              
              {isSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-bold text-primary mb-2">Message envoyé !</h3>
                  <p className="text-gray-700">
                    Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-2">
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
                      <label className="block text-sm font-semibold text-primary mb-2">
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
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">
                      Sujet
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      <option value="">Choisir un sujet</option>
                      <option value="reservation">Réservation</option>
                      <option value="event">Événement privé</option>
                      <option value="menu">Question sur le menu</option>
                      <option value="feedback">Commentaire</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="Votre message..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Send size={20} />
                    <span>Envoyer le message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-center text-primary mb-8">
            Comment nous trouver
          </h2>
          
          <div className="rounded-lg overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2761.365869977858!2d6.144164000000001!3d46.2031763!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478c6529711f9ed5%3A0x34703c7889b27bb1!2sla%20Finestra!5e0!3m2!1sfr!2sch!4v1751626759410!5m2!1sfr!2sch"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localisation de La Finestra - Rue de la Cité 11, Genève"
            />
          </div>
          
          <div className="text-center mt-6">
            <p className="text-gray-600 mb-4">
              <strong>Rue de la Cité 11, 1204 Genève</strong><br />
              À 15 minutes à pied de la gare Cornavin
            </p>
            <a 
              href="https://maps.google.com/?q=Rue+de+la+Cité+11,+1204+Genève"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 transition-colors"
            >
              <MapPin size={20} />
              <span>Ouvrir dans Google Maps</span>
            </a>
          </div>
        </div>
      </section>

      {/* Virtual Visit Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-center text-primary mb-8">
            Visiter notre restaurant
          </h2>
          
          <p className="text-center text-gray-700 max-w-3xl mx-auto mb-8">
            Découvrez l'intérieur de La Finestra comme si vous y étiez grâce à la visite virtuelle Google.
          </p>
          
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!4v1751974371858!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJQ1pxNWVCcHdF!2m2!1d46.20314379066236!2d6.144058391159511!3f47.09!4f-62.45!5f0.5970117501821992"
                width="100%"
                height="450"
                className="border-0 rounded-lg shadow-lg h-[300px] md:h-[450px]"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Visite virtuelle du restaurant La Finestra"
              />
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              <strong>Visite virtuelle interactive</strong><br />
              Explorez notre restaurant à 360° et découvrez notre ambiance chaleureuse
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;