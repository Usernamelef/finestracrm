import React, { useState, useEffect } from 'react';
import { MapPin, Users, Calendar, Clock, Plus, X, Check, Ban, RotateCcw } from 'lucide-react';
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
  handleAssignTable: (reservation: any, tableNumbers: number[], fromSalleTab: boolean) => void;
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
  setCurrentService,
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
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [newReservation, setNewReservation] = useState({
    name: '',
    email: '',
    phone: '',
    time: '',
    guests: '',
    message: ''
  });

  // Charger toutes les réservations depuis Supabase
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
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

    fetchReservations();
  }, []);

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

  // Mettre à jour l'état des tables basé sur les réservations Supabase
  useEffect(() => {
    const updatedTables = tables.map(table => {
      // Réinitialiser la table
      const resetTable = {
        ...table,
        status: 'available' as const,
        reservations: []
      };

      // Chercher les réservations pour cette table à la date et service sélectionnés
      const tableReservations = reservations.filter(reservation => {
        const reservationDate = reservation.date_reservation;
        const reservationService = getServiceFromTime(reservation.heure_reservation);
        const isCorrectDateAndService = reservationDate === selectedDate && reservationService === currentService;
        
        // Vérifier si cette table est assignée à cette réservation
        const isAssignedToThisTable = reservation.table_assignee === table.number ||
          (reservation.commentaire && reservation.commentaire.includes(`[Tables: `) && 
           reservation.commentaire.includes(`${table.number}`));
        
        return isCorrectDateAndService && isAssignedToThisTable && 
               ['assignee', 'arrivee'].includes(reservation.statut);
      });

      if (tableReservations.length > 0) {
        const reservation = tableReservations[0];
        return {
          ...resetTable,
          status: reservation.statut === 'arrivee' ? 'occupied' as const : 'reserved' as const,
          reservations: tableReservations
        };
      }

      return resetTable;
    });

    setTables(updatedTables);
  }, [reservations, selectedDate, currentService]);

  const handleTableClick = (table: Table) => {
    if (selectedReservation) {
      // Mode assignation
      if (table.status === 'available') {
        if (selectedTables.includes(table.number)) {
          setSelectedTables(selectedTables.filter(t => t !== table.number));
        } else {
          setSelectedTables([...selectedTables, table.number]);
        }
      }
    } else {
      // Mode consultation
      if (table.status !== 'available') {
        setSelectedTable(table);
        setShowTableModal(true);
      }
    }
  };

  const handleConfirmAssignment = () => {
    if (selectedReservation && selectedTables.length > 0) {
      handleAssignTable(selectedReservation, selectedTables, true);
      setSelectedTables([]);
      setSelectedReservation(null);
    }
  };

  const handleCancelAssignment = () => {
    setSelectedTables([]);
    setSelectedReservation(null);
  };

  const handleAddReservation = async () => {
    if (newReservation.name && newReservation.phone && newReservation.time && newReservation.guests) {
      try {
        const { createReservation } = await import('../../lib/supabase');
        
        const reservationData = {
          nom_client: newReservation.name,
          email_client: newReservation.email || 'N/A',
          telephone_client: newReservation.phone,
          date_reservation: selectedDate,
          heure_reservation: newReservation.time,
          nombre_personnes: parseInt(newReservation.guests),
          commentaire: newReservation.message || null,
          statut: 'en_attente'
        };

        await createReservation(reservationData);
        
        // Recharger les réservations
        const allReservations = await getAllReservations();
        setReservations(allReservations);
        
        setNewReservation({
          name: '',
          email: '',
          phone: '',
          time: '',
          guests: '',
          message: ''
        });
        setShowNewReservationModal(false);
        
        addActivity(`Réservation ajoutée pour ${newReservation.name} (${newReservation.guests} pers.)`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réservation:', error);
        alert('Erreur lors de l\'ajout de la réservation. Veuillez réessayer.');
      }
    }
  };

  const getTableColor = (table: Table) => {
    if (selectedReservation && selectedTables.includes(table.number)) {
      return 'bg-blue-500 text-white border-blue-600';
    }
    
    switch (table.status) {
      case 'available':
        return selectedReservation 
          ? 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300 cursor-pointer'
          : 'bg-green-100 text-green-800 border-green-300';
      case 'reserved':
        return 'bg-orange-100 text-orange-800 border-orange-300 cursor-pointer hover:bg-orange-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300 cursor-pointer hover:bg-red-200';
      case 'unavailable':
        return 'bg-gray-100 text-gray-500 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Plan de salle</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Chargement du plan de salle...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Plan de salle</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Plan de salle</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Service du {currentService} - {formatSelectedDate(selectedDate)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
            <div className="flex items-center space-x-2">
              <Calendar className="text-gray-600" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            
            <button
              onClick={() => setShowNewReservationModal(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
            >
              <Plus size={20} />
              <span>Nouvelle réservation</span>
            </button>
          </div>
        </div>

        {/* Légende */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Légende</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm text-gray-700">Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-sm text-gray-700">Réservée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-sm text-gray-700">Occupée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
              <span className="text-sm text-gray-700">Sélectionnée</span>
            </div>
          </div>
        </div>

        {/* Mode assignation */}
        {selectedReservation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-4">
              Mode assignation - {selectedReservation.nom_client || selectedReservation.name}
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-blue-800">
                <p>
                  {formatDate(selectedReservation.date_reservation || selectedReservation.date)} à {selectedReservation.heure_reservation || selectedReservation.time} • {selectedReservation.nombre_personnes || selectedReservation.guests} personne{(selectedReservation.nombre_personnes || selectedReservation.guests) > 1 ? 's' : ''}
                </p>
                {selectedTables.length > 0 && (
                  <p className="mt-1">
                    Table{selectedTables.length > 1 ? 's' : ''} sélectionnée{selectedTables.length > 1 ? 's' : ''}: {selectedTables.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={handleConfirmAssignment}
                  disabled={selectedTables.length === 0}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Confirmer l'assignation
                </button>
                <button
                  onClick={handleCancelAssignment}
                  className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan de salle */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6">
            Tables du restaurant (25 tables)
          </h3>
          
          {/* Grille des tables */}
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3">
            {tables.map((table) => (
              <div
                key={table.number}
                onClick={() => handleTableClick(table)}
                className={`
                  relative aspect-square border-2 rounded-lg flex flex-col items-center justify-center
                  transition-all duration-200 text-xs sm:text-sm font-medium
                  ${getTableColor(table)}
                  ${selectedReservation && table.status === 'available' ? 'transform hover:scale-105' : ''}
                  ${!selectedReservation && table.status !== 'available' ? 'transform hover:scale-105' : ''}
                `}
              >
                <div className="text-center">
                  <div className="font-bold">{table.number}</div>
                  <div className="text-xs opacity-75">{table.capacity}p</div>
                </div>
                
                {table.reservations.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
            <div className="text-xs sm:text-sm text-gray-600 space-y-1">
              {selectedReservation ? (
                <>
                  <p>• Cliquez sur une ou plusieurs tables vertes pour les sélectionner</p>
                  <p>• Cliquez sur "Confirmer l'assignation" pour valider</p>
                  <p>• Cliquez sur "Annuler" pour quitter le mode assignation</p>
                </>
              ) : (
                <>
                  <p>• Cliquez sur une table réservée (orange) ou occupée (rouge) pour voir les détails</p>
                  <p>• Utilisez l'onglet "Réservations" pour assigner des tables aux clients en attente</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal détail table */}
      {showTableModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary">Table {selectedTable.number}</h3>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Capacité:</span>
                <span className="font-medium">{selectedTable.capacity} personnes</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Statut:</span>
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
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Réservation actuelle</h4>
                  {selectedTable.reservations.map((reservation) => (
                    <div key={reservation.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Client:</span>
                        <span className="font-medium">{reservation.nom_client}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Heure:</span>
                        <span>{reservation.heure_reservation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Personnes:</span>
                        <span>{reservation.nombre_personnes}</span>
                      </div>
                      {reservation.commentaire && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">Note:</span>
                          <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{reservation.commentaire}</p>
                        </div>
                      )}
                      
                      {/* Actions sur la réservation */}
                      <div className="mt-4 space-y-2">
                        {reservation.statut === 'assignee' && (
                          <button
                            onClick={async () => {
                              try {
                                await updateReservationStatus(reservation.id, 'arrivee');
                                const allReservations = await getAllReservations();
                                setReservations(allReservations);
                                addActivity(`Client ${reservation.nom_client} marqué comme arrivé.`);
                                setShowTableModal(false);
                              } catch (error) {
                                console.error("Erreur:", error);
                                alert("Erreur lors du marquage comme arrivé.");
                              }
                            }}
                            className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            Marquer comme arrivé
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            handleUnassignReservation(reservation.id);
                            setShowTableModal(false);
                          }}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-2"
                        >
                          <RotateCcw size={16} />
                          <span>Désassigner</span>
                        </button>
                        
                        {reservation.statut === 'arrivee' && (
                          <button
                            onClick={async () => {
                              try {
                                await updateReservationStatus(reservation.id, 'terminee');
                                const allReservations = await getAllReservations();
                                setReservations(allReservations);
                                addActivity(`Réservation de ${reservation.nom_client} terminée.`);
                                setShowTableModal(false);
                              } catch (error) {
                                console.error("Erreur:", error);
                                alert("Erreur lors de la finalisation.");
                              }
                            }}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            Terminer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle réservation */}
      {showNewReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle réservation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={newReservation.name}
                  onChange={(e) => setNewReservation({...newReservation, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom du client"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newReservation.email}
                  onChange={(e) => setNewReservation({...newReservation, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemple.com (optionnel)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={newReservation.phone}
                  onChange={(e) => setNewReservation({...newReservation, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+41 xx xxx xx xx"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                  <select
                    value={newReservation.time}
                    onChange={(e) => setNewReservation({...newReservation, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir</option>
                    {['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45'].map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personnes</label>
                  <select
                    value={newReservation.guests}
                    onChange={(e) => setNewReservation({...newReservation, guests: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newReservation.message}
                  onChange={(e) => setNewReservation({...newReservation, message: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Demandes spéciales..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewReservationModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddReservation}
                disabled={!newReservation.name || !newReservation.phone || !newReservation.time || !newReservation.guests}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white rounded-md transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalleTab;