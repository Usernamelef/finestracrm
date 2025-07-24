import React, { useState } from 'react';
import { Mail, Phone, User, Calendar } from 'lucide-react';

interface ClientsTabProps {
  reservationsData: any[];
}

const ClientsTab: React.FC<ClientsTabProps> = ({ reservationsData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Base de données clients</h1>
        <div className="text-sm text-gray-600">
          {Array.from(new Set(reservationsData.map(r => r.email))).length} clients uniques
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <input
          type="text"
          placeholder="Rechercher un client par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Liste des clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from(new Set(reservationsData.map(r => r.email)))
          .map(email => {
            const clientReservations = reservationsData.filter(r => r.email === email);
            const latestReservation = clientReservations.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            
            if (searchTerm && !latestReservation.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !latestReservation.email.toLowerCase().includes(searchTerm.toLowerCase())) {
              return null;
            }
            
            return (
              <div key={email} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{latestReservation.name}</h3>
                      <p className="text-sm text-gray-600">{clientReservations.length} réservation{clientReservations.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="text-gray-400" size={16} />
                    <span className="text-gray-700">{latestReservation.email}</span>
                  </div>
                  {latestReservation.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="text-gray-400" size={16} />
                      <span className="text-gray-700">{latestReservation.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-gray-400" size={16} />
                    <span className="text-gray-700">
                      Dernière visite: {new Date(latestReservation.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                
                {/* Historique des réservations */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Historique récent</h4>
                  <div className="space-y-1">
                    {clientReservations.slice(0, 3).map((reservation) => (
                      <div key={reservation.id} className="text-xs text-gray-600 flex justify-between">
                        <span>{new Date(reservation.date).toLocaleDateString('fr-FR')}</span>
                        <span>{reservation.guests}p • {reservation.service}</span>
                      </div>
                    ))}
                    {clientReservations.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        +{clientReservations.length - 3} autre{clientReservations.length - 3 > 1 ? 's' : ''}...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notes client */}
                {latestReservation.message && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Dernière note</h4>
                    <p className="text-xs text-gray-600 italic">"{latestReservation.message}"</p>
                  </div>
                )}
              </div>
            );
          })
          .filter(Boolean)}
      </div>
    </div>
  );
};

export default ClientsTab;