import React from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <img
              src="/assets/lafinestra-geneve-logo-blanc.png"
              alt="La Finestra Genève"
              className="h-10 w-auto mb-4"
            />
            <p className="text-sm text-gray-300 mb-4">
              Une fenêtre sur l'Italie au cœur de Genève depuis 2006. 
              Cuisine traditionnelle italienne dans un cadre chaleureux et authentique.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-secondary" />
                <span className="text-sm">Rue de la Cité 11, 1204 Genève</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-secondary" />
                <span className="text-sm">+41(0)22 312 23 22</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-secondary" />
                <span className="text-sm">reservation@lafinestra.ch</span>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Horaires</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Lun - Ven:</span>
                <span>12h00 - 14h30</span>
              </div>
              <div className="flex justify-between">
                <span></span>
                <span>19h00 - 22h30</span>
              </div>
              <div className="flex justify-between">
                <span>Samedi:</span>
                <span>19h00 - 22h30</span>
              </div>
              <div className="flex justify-between">
                <span>Dimanche:</span>
                <span>Fermé</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Suivez-nous</h4>
            <div className="flex space-x-6">
              <a 
                href="https://facebook.com/lafinestrarestaurant" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com/lafinestrarestaurant" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.tiktok.com/@lafinestra.geneve?_t=ZN-8xpusYF7OVy&_r=1" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © 2025 La Finestra. Tous droits réservés.
          </p>
          <p className="text-sm text-gray-400 mt-2 md:mt-0">
            Site créé par <a href="https://qora.ch" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-white transition-colors">Qora</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;