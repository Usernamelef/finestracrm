import React from 'react';
import { X, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AutumnMenuPopupProps {
  onClose: () => void;
}

const AutumnMenuPopup: React.FC<AutumnMenuPopupProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleViewMenu = () => {
    onClose();
    navigate('/menu');
    setTimeout(() => {
      const specialeSection = document.querySelector('[data-category="speciale"]');
      if (specialeSection) {
        specialeSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center p-4 pt-8 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full relative overflow-hidden animate-fade-in-up my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
          aria-label="Fermer"
        >
          <X size={24} />
        </button>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center border-b-4 border-amber-600">
          <div className="inline-block bg-white rounded-full p-4 mb-4 shadow-lg">
            <ChefHat className="text-amber-600" size={48} />
          </div>
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-2">
            Spéciale D'automne
          </h2>
          <p className="text-lg text-gray-700 font-medium">La Chasse</p>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4 text-center">
              Filet mignon de Cerf
            </h3>
            <p className="text-gray-700 leading-relaxed text-center">
              Accompagné d'une sauce vin rouge, ravioli à la courge, poire,
              choux rouge et confiture de coing
            </p>
          </div>

          <div className="bg-amber-50 rounded-lg p-6 mb-6 border-l-4 border-amber-600">
            <p className="text-gray-800 text-center italic">
              Découvrez notre nouveau menu de saison mettant à l'honneur
              les saveurs authentiques de l'automne
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleViewMenu}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Découvrir le menu complet
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-all duration-300"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutumnMenuPopup;
