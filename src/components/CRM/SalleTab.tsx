import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Clock, X, AlertCircle, RefreshCw } from 'lucide-react';
import { getAllReservations, updateReservationStatus, type Reservation } from '../../lib/supabase';

interface Table {
  number: number;
  capacity: number;
  status: 'available' | 'reserved' | 'occupied' | 'unavailable';
  reservations: Reservation[];
  section: 'main' | 'terrace';
}

interface SalleTabProps {
  currentService: 'midi' | 'soir';
  setCurrentService: React.Dispatch<React.SetStateAction<'midi' | 'soir'>>;
  selectedDate: string;
  handleDateChange: (date: string) => void;
  selectedReservation: any;
  setSelectedReservation: React.Dispatch<React.SetStateAction<any>>;
  handleAssignTable: (reservation: any, tableNumbers: number[], fromSalleTab?: boolean) => void;
  addActivity: (action: string) => void;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  selectedTable: Table | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  showTableModal: boolean;
  setShowTableModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleFreeTable: (tableNumber: number) => void;
  getAvailableAdjacentTables: (guestCount: number) => number[][];
  reservationsData: any[];
  formatSelectedDate: (dateString: string) => string;
  handleUnassignReservation: (reservationId: string) => void;
}

const SalleTab: React.FC<SalleTabProps> = ({
  currentService,
  selectedDate,
  handleDateChange,
  selectedReservation,
  setSelectedReservation,
  handleAssignTable,
  addActivity,
  tables,
  setTables,
  selectedTable,
  setSelectedTable,
  showTableModal,
  setShowTableModal,
  handleFreeTable,
  getAvailableAdjacentTables,
  reservationsData,
  formatSelectedDate,
  handleUnassignReservation
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fonction pour déterminer le service basé sur l'heure
  const getServiceFromTime = (heure: string) => {
    const [hour, minute] = heure.split(':').map(Number);
    const totalMinutes = hour * 60 + minute;
    // 12:00 à 13:45 = midi, 19:00 à 21:45 = soir
    if (totalMinutes >= 12 * 60 && totalMinutes <= 13 * 60 + 45) {
      return 'midi';
    } else if (totalMinutes >= 19 * 60 && totalMinutes <= 21 * 60 + 45) {
      return 'soir';
    }
    // Par défaut, déterminer selon l'heure (avant 16h = midi, après = soir)
    return totalMinutes < 16 * 60 ? 'midi' : 'soir';
  };

  // Charger les réservations depuis Supabase avec rafraîchissement temps réel
  const fetchReservations = async () => {
    try {
      const allReservations = await getAllReservations();
      setReservations(allReservations);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des réservations:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    
    // Rafraîchissement automatique toutes les 5 secondes
    const interval = setInterval(fetchReservations, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Mettre à jour l'état des tables basé sur les réservations
  useEffect(() => {
    const updatedTables = tables.map(table => {
      // Trouver les réservations pour cette table, date et service
      const tableReservations = reservations.filter(reservation => {
        const reservationDate = reservation.date_reservation;
        const reservationService = getServiceFromTime(reservation.heure_reservation);
        const isCorrectDateAndService = reservationDate === selectedDate && reservationService === currentService;
        
        // Vérifier si cette table est assignée à cette réservation
        const isAssignedToTable = reservation.table_assignee === table.number ||
          (reservation.commentaire && reservation.commentaire.includes(`[Tables: ${table.number}`)) ||
          (reservation.commentaire && reservation.commentaire.includes(`, ${table.number}`)) ||
          (reservation.commentaire && reservation.commentaire.includes(`${table.number},`)) ||
          (reservation.commentaire && reservation.commentaire.includes(`${table.number}]`));
        
        return isCorrectDateAndService && isAssignedToTable && ['assignee', 'arrivee'].includes(reservation.statut);
      });

      if (tableReservations.length > 0) {
        const reservation = tableReservations[0];
        return {
          ...table,
          status: reservation.statut === 'arrivee' ? 'occupied' as const : 'reserved' as const,
          reservations: tableReservations
        };
      }

      return {
        ...table,
        status: 'available' as const,
        reservations: []
      };
    });

    setTables(updatedTables);
  }, [reservations, selectedDate, currentService]);

  const handleTableClick = (table: Table) => {
    if (selectedReservation && selectedReservation.statut !== 'arrivee') {
      // Mode assignation
      if (selectedTables.includes(table.number)) {
        setSelectedTables(selectedTables.filter(t => t !== table.number));
      } else {
        setSelectedTables([...selectedTables, table.number]);
      }
    } else {
      // Mode consultation
      setSelectedTable(table);
      setShowTableModal(true);
    }
  };

  const handleAssignSelectedTables = async () => {
    if (selectedTables.length === 0 || !selectedReservation) return;
    
    setIsAssigning(true);
    try {
      await handleAssignTable(selectedReservation, selectedTables, true);
      setSelectedTables([]);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getTableColor = (table: Table) => {
    if (selectedReservation && selectedReservation.statut !== 'arrivee') {
      // Mode assignation
      if (selectedTables.includes(table.number)) {
        return 'bg-blue-500 text-white border-blue-600';
      }
      if (table.status === 'available') {
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer';
      }
      return 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed';
    }
    
    // Mode normal
    switch (table.status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer';
      case 'reserved':
        return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 cursor-pointer';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 cursor-pointer';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  // Disposition exacte selon l'image
  const tablePositions = {
    // Section gauche (colonne verticale)
    25: { top: '5%', left: '2%' },
    25: { top: '25%', left: '2%' }, // Table 25 à gauche (milieu)
    22: { top: '25%', left: '12%' },
    6: { top: '45%', left: '12%' },
    
    // Section centre-gauche
    7: { top: '25%', left: '25%' },
    9: { top: '25%', left: '40%' },
    1: { top: '45%', left: '40%' },
    
    // Section centre-droite
    10: { top: '25%', left: '60%' },
    13: { top: '25%', left: '75%' },
    4: { top: '45%', left: '60%' },
    2: { top: '45%', left: '75%' },
    
    // Section en haut à droite
    31: { top: '5%', left: '60%' },
    30: { top: '5%', left: '75%' },
    
    // Section en haut à gauche
    25: { top: '5%', left: '12%' }, // Table 25 en haut
    
    // Section du bas (ligne horizontale)
    24: { top: '70%', left: '2%' },
    23: { top: '75%', left: '2%' },
    22: { top: '80%', left: '2%' },
        {renderTable(25, { top: '8%', left: '8%' })}
    20: { top: '90%', left: '2%' },
    10: { top: '95%', left: '2%' },
        {renderTable(31, { top: '8%', left: '68%' })}
        {renderTable(30, { top: '8%', left: '82%' })}
    9: { top: '70%', left: '25%' },
    4: { top: '70%', left: '40%' },
        {renderTable(25, { top: '28%', left: '8%' })}
        {renderTable(22, { top: '28%', left: '22%' })}
        {renderTable(7, { top: '28%', left: '36%' })}
        {renderTable(9, { top: '28%', left: '50%' })}
        {renderTable(10, { top: '28%', left: '68%' })}
        {renderTable(13, { top: '28%', left: '82%' })}
  const renderTable = (tableNumber: number, position: { top: string; left: string }) => {
    const table = tables.find(t => t.number === tableNumber);
        {renderTable(6, { top: '48%', left: '22%' })}
        {renderTable(1, { top: '48%', left: '50%' })}
        {renderTable(4, { top: '48%', left: '68%' })}
        {renderTable(2, { top: '48%', left: '82%' })}
    return (
      <div
        {renderTable(24, { top: '68%', left: '8%' })}
        {renderTable(23, { top: '73%', left: '8%' })}
        {renderTable(22, { top: '78%', left: '8%' })}
        {renderTable(21, { top: '83%', left: '8%' })}
        {renderTable(20, { top: '88%', left: '8%' })}
        {renderTable(10, { top: '93%', left: '8%' })}
        <div className="text-xs">Table</div>
        {reservation && (
        {renderTable(9, { top: '78%', left: '36%' })}
        {renderTable(4, { top: '78%', left: '46%' })}
        {renderTable(8, { top: '78%', left: '56%' })}
        {renderTable(2, { top: '78%', left: '68%' })}
        {renderTable(2, { top: '78%', left: '82%' })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Plan de salle - {formatSelectedDate(selectedDate)}
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="text-primary" size={20} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <button
            onClick={fetchReservations}
            className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Mode assignation */}
      {selectedReservation && selectedReservation.statut !== 'arrivee' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Assigner une table à {selectedReservation.nom_client || selectedReservation.name}
              </h3>
              <p className="text-blue-700">
                {selectedReservation.date_reservation || selectedReservation.date} à {selectedReservation.heure_reservation || selectedReservation.time} • 
                {selectedReservation.nombre_personnes || selectedReservation.guests} personne{(selectedReservation.nombre_personnes || selectedReservation.guests) > 1 ? 's' : ''}
              </p>
              {selectedTables.length > 0 && (
                <p className="text-blue-600 mt-1">
                  Tables sélectionnées: {selectedTables.join(', ')}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAssignSelectedTables}
                disabled={selectedTables.length === 0 || isAssigning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isAssigning ? 'Assignation...' : 'Assigner'}
              </button>
              <button
                onClick={() => {
                  setSelectedReservation(null);
                  setSelectedTables([]);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Plan de salle */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan de salle</h2>
            
            {/* Légende */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                <span>Réservée</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>Occupée</span>
              </div>
              {selectedReservation && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
                  <span>Sélectionnée</span>
                </div>
              )}
            </div>

            {/* Plan des tables - Disposition exacte selon l'image */}
            <div className="relative bg-gray-50 rounded-lg border-2 border-gray-200 h-96 sm:h-[500px] lg:h-[600px] overflow-hidden">
              {/* Section en haut à gauche */}
              {renderTable(25, { top: '8%', left: '8%' })}
              
              {/* Section gauche (colonne verticale) */}
              {renderTable(25, { top: '30%', left: '3%' })}
              {renderTable(22, { top: '30%', left: '15%' })}
              
              {/* Section centre-gauche */}
              {renderTable(7, { top: '30%', left: '30%' })}
              {renderTable(9, { top: '30%', left: '45%' })}
              
              {/* Section centre */}
              {renderTable(6, { top: '50%', left: '15%' })}
              {renderTable(1, { top: '50%', left: '45%' })}
              
              {/* Section centre-droite */}
              {renderTable(10, { top: '30%', left: '65%' })}
              {renderTable(13, { top: '30%', left: '80%' })}
              {renderTable(4, { top: '50%', left: '65%' })}
              {renderTable(2, { top: '50%', left: '80%' })}
              
              {/* Section en haut à droite */}
              {renderTable(31, { top: '8%', left: '65%' })}
              {renderTable(30, { top: '8%', left: '80%' })}
              
              {/* Section du bas (colonne gauche verticale) */}
              {renderTable(24, { top: '70%', left: '3%' })}
              {renderTable(23, { top: '75%', left: '3%' })}
              {renderTable(22, { top: '80%', left: '3%' })}
              {renderTable(21, { top: '85%', left: '3%' })}
              {renderTable(20, { top: '90%', left: '3%' })}
              {renderTable(10, { top: '95%', left: '3%' })}
              
              {/* Section du bas (ligne horizontale) */}
              {renderTable(9, { top: '75%', left: '30%' })}
              {renderTable(4, { top: '75%', left: '40%' })}
              {renderTable(8, { top: '75%', left: '50%' })}
              {renderTable(2, { top: '75%', left: '65%' })}
              {renderTable(2, { top: '75%', left: '75%' })} {/* Deuxième table 2 */}
            </div>
          </div>
        </div>

        {/* Sidebar avec réservations */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Réservations du {currentService}
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reservations
                .filter(reservation => {
                  const reservationDate = reservation.date_reservation;
                  const reservationService = getServiceFromTime(reservation.heure_reservation);
                  return reservationDate === selectedDate && 
                         reservationService === currentService &&
                         ['assignee', 'arrivee', 'en_attente'].includes(reservation.statut);
                })
                .sort((a, b) => {
                  const [hourA, minA] = a.heure_reservation.split(':').map(Number);
                  const [hourB, minB] = b.heure_reservation.split(':').map(Number);
                  return (hourA * 60 + minA) - (hourB * 60 + minB);
                })
                .map((reservation) => (
                <div 
                  key={reservation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedReservation?.id === reservation.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReservation(reservation)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{reservation.nom_client}</h4>
                    <span className="text-xs text-gray-600">{reservation.heure_reservation}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? 's' : ''}
                  </p>
                  {reservation.table_assignee && (
                    <p className="text-xs font-medium text-blue-600">
                      {(() => {
                        if (reservation.commentaire && reservation.commentaire.includes('[Tables:')) {
                          const match = reservation.commentaire.match(/\[Tables: ([^\]]+)\]/);
                          if (match) {
                            return `Tables: ${match[1]}`;
                          }
                        }
                        return `Table: ${reservation.table_assignee}`;
                      })()}
                    </p>
                  )}
                  <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                    reservation.statut === 'assignee' ? 'bg-orange-100 text-orange-800' :
                    reservation.statut === 'arrivee' ? 'bg-red-100 text-red-800' :
                    'bg-pink-100 text-pink-800'
                  }`}>
                    {reservation.statut === 'assignee' ? 'Assignée' :
                     reservation.statut === 'arrivee' ? 'Arrivée' :
                     'En attente'}
                  </div>
                </div>
              ))}
              
              {reservations.filter(reservation => {
                const reservationDate = reservation.date_reservation;
                const reservationService = getServiceFromTime(reservation.heure_reservation);
                return reservationDate === selectedDate && 
                       reservationService === currentService &&
                       ['assignee', 'arrivee', 'en_attente'].includes(reservation.statut);
              }).length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Aucune réservation pour ce service
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal détail table */}
      {showTableModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-primary">Table {selectedTable.number}</h3>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Capacité:</span>
                <span className="font-medium">{selectedTable.capacity} personnes</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTable.status === 'available' ? 'bg-green-100 text-green-800' :
                  selectedTable.status === 'reserved' ? 'bg-orange-100 text-orange-800' :
                  selectedTable.status === 'occupied' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedTable.status === 'available' ? 'Disponible' :
                   selectedTable.status === 'reserved' ? 'Réservée' :
                   selectedTable.status === 'occupied' ? 'Occupée' : 'Indisponible'}
                </span>
              </div>
              
              {selectedTable.reservations.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-medium text-gray-900 mb-2">Réservation actuelle:</h4>
                  {selectedTable.reservations.map((reservation) => (
                    <div key={reservation.id} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{reservation.nom_client}</p>
                      <p className="text-sm text-gray-600">{reservation.heure_reservation} • {reservation.nombre_personnes} pers.</p>
                      {reservation.commentaire && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{reservation.commentaire}"</p>
                      )}
                      
                      <button
                        onClick={async () => {
                          try {
                            await handleUnassignReservation(reservation.id);
                            setShowTableModal(false);
                            addActivity(`Table ${selectedTable.number} désassignée - ${reservation.nom_client} remis en attente`);
                          } catch (error) {
                            console.error('Erreur:', error);
                            alert('Erreur lors de la désassignation');
                          }
                        }}
                        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Désassigner
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalleTab;