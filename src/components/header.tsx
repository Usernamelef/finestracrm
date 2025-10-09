import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Facebook, Instagram } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/about', label: 'À propos' },
    { path: '/menu', label: 'Menu' },
    { path: '/events', label: 'Événements' },
    { path: '/reservations', label: 'Réservation' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-primary shadow-lg' : 'bg-primary/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img
                src="/lafinestra-geneve-favicon.png"
                alt="La Finestra Genève"
                className="h-14 w-auto"
                loading="eager"
                decoding="async"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`font-sans text-sm uppercase tracking-wide transition-colors hover:text-secondary ${
                    location.pathname === item.path ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Social Media Icons - Positioned on the right */}
            <div className="hidden md:flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <a 
                href="https://facebook.com/lafinestrarestaurant" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-secondary transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com/lafinestrarestaurant" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-secondary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.tiktok.com/@lafinestra.geneve?_t=ZN-8xpusYF7OVy&_r=1" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-secondary transition-colors"
                aria-label="TikTok"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.10z"/>
                </svg>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white hover:text-secondary transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
        isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
        <nav className={`absolute top-0 right-0 h-full w-80 bg-primary shadow-xl transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="pt-20 px-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block py-4 font-sans text-lg transition-colors hover:text-secondary ${
                  location.pathname === item.path ? 'text-secondary border-l-4 border-secondary pl-4' : 'text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Mobile Social Media Icons */}
          <div className="px-6 py-4 border-t border-gray-700">
            <div className="flex justify-center space-x-6">
              <a 
                href="https://facebook.com/lafinestrarestaurant" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-secondary transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </a>
              <a 
                href="https://instagram.com/lafinestrarestaurant" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-secondary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
              <a 
                href="https://www.tiktok.com/@lafinestra.geneve?_t=ZN-8xpusYF7OVy&_r=1" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-secondary transition-colors"
                aria-label="TikTok"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.10z"/>
                </svg>
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;