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
    // Rafraîchir les données toutes les 5 secondes pour le temps réel
    const interval = setInterval(async () => {
      try {
        const allReservations = await getAllReservations();
        setReservations(allReservations);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
      }
    }, 5000);

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
    
    return () => clearInterval(interval);
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

  // Obtenir les réservations pour la date et le service sélectionnés
  const getTodayReservations = () => {
    return reservations.filter(reservation => {
      const reservationDate = reservation.date_reservation;
      const reservationService = getServiceFromTime(reservation.heure_reservation);
      return reservationDate === selectedDate && reservationService === currentService;
    });
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

  const todayReservations = getTodayReservations();

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plan de salle</h1>
            <p className="text-gray-600">
              Service du {currentService} - {formatSelectedDate(selectedDate)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="text-gray-600" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
          </div>
        </div>

        {/* Mode assignation */}
        {selectedReservation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
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
              <div className="flex space-x-2">
                <button
                  onClick={handleConfirmAssignment}
                  disabled={selectedTables.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Confirmer l'assignation
                </button>
                <button
                  onClick={handleCancelAssignment}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Plan de salle principal */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Tables du restaurant (25 tables)
              </h3>
              
              {/* Légende */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Légende</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              
              {/* Grille des tables avec noms des clients */}
              {/* Plan de salle avec disposition exacte selon l'image */}
              <div className="bg-gray-50 p-8 rounded-lg">
                {/* Layout personnalisé selon l'image */}
                <div className="relative max-w-4xl mx-auto" style={{ minHeight: '500px' }}>
                  {/* Première rangée : Tables 1, 6, 11, 16, 21 */}
                  <div className="absolute top-0 left-0 flex space-x-16">
                    {[1, 6, 11, 16, 21].map((tableNum) => {
                      const table = tables.find(t => t.number === tableNum);
                      const reservation = table?.reservations[0];
                      return (
                        <div
                          key={tableNum}
                          onClick={() => table && handleTableClick(table)}
                          className={`
                            relative border-2 rounded-lg p-3 w-20 h-20 flex flex-col items-center justify-center
                            transition-all duration-200 cursor-pointer transform hover:scale-105
                            ${table ? getTableColor(table) : 'bg-gray-100 border-gray-300'}
                            ${selectedReservation && table?.status === 'available' ? 'ring-2 ring-blue-300' : ''}
                          `}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">{tableNum}</div>
                            {reservation && (
                              <div className="mt-1">
                                <div className="text-xs font-medium truncate max-w-[60px]" title={reservation.nom_client}>
                                  {reservation.nom_client.split(' ')[0]}
                                </div>
                                <div className="text-xs opacity-75">
                                  {reservation.heure_reservation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Deuxième rangée : Tables 7, 2, 12, 17, 22 */}
                  <div className="absolute top-24 left-16 flex space-x-16">
                    {[7, 2, 12, 17, 22].map((tableNum) => {
                      const table = tables.find(t => t.number === tableNum);
                      const reservation = table?.reservations[0];
                      return (
                        <div
                          key={tableNum}
                          onClick={() => table && handleTableClick(table)}
                          className={`
                            relative border-2 rounded-lg p-3 w-20 h-20 flex flex-col items-center justify-center
                            transition-all duration-200 cursor-pointer transform hover:scale-105
                            ${table ? getTableColor(table) : 'bg-gray-100 border-gray-300'}
                            ${selectedReservation && table?.status === 'available' ? 'ring-2 ring-blue-300' : ''}
                          `}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">{tableNum}</div>
                            {reservation && (
                              <div className="mt-1">
                                <div className="text-xs font-medium truncate max-w-[60px]" title={reservation.nom_client}>
                                  {reservation.nom_client.split(' ')[0]}
                                </div>
                                <div className="text-xs opacity-75">
                                  {reservation.heure_reservation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Troisième rangée : Tables 9, 8, 13, 18, 23 */}
                  <div className="absolute top-48 left-32 flex space-x-16">
                    {[9, 8, 13, 18, 23].map((tableNum) => {
                      const table = tables.find(t => t.number === tableNum);
                      const reservation = table?.reservations[0];
                      return (
                        <div
                          key={tableNum}
                          onClick={() => table && handleTableClick(table)}
                          className={`
                            relative border-2 rounded-lg p-3 w-20 h-20 flex flex-col items-center justify-center
                            transition-all duration-200 cursor-pointer transform hover:scale-105
                            ${table ? getTableColor(table) : 'bg-gray-100 border-gray-300'}
                            ${selectedReservation && table?.status === 'available' ? 'ring-2 ring-blue-300' : ''}
                          `}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">{tableNum}</div>
                            {reservation && (
                              <div className="mt-1">
                                <div className="text-xs font-medium truncate max-w-[60px]" title={reservation.nom_client}>
                                  {reservation.nom_client.split(' ')[0]}
                                </div>
                                <div className="text-xs opacity-75">
                                  {reservation.heure_reservation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quatrième rangée : Tables 4, 3, 14, 19, 24 */}
                  <div className="absolute top-72 left-48 flex space-x-16">
                    {[4, 3, 14, 19, 24].map((tableNum) => {
                      const table = tables.find(t => t.number === tableNum);
                      const reservation = table?.reservations[0];
                      return (
                        <div
                          key={tableNum}
                          onClick={() => table && handleTableClick(table)}
                          className={`
                            relative border-2 rounded-lg p-3 w-20 h-20 flex flex-col items-center justify-center
                            transition-all duration-200 cursor-pointer transform hover:scale-105
                            ${table ? getTableColor(table) : 'bg-gray-100 border-gray-300'}
                            ${selectedReservation && table?.status === 'available' ? 'ring-2 ring-blue-300' : ''}
                          `}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">{tableNum}</div>
                            {reservation && (
                              <div className="mt-1">
                                <div className="text-xs font-medium truncate max-w-[60px]" title={reservation.nom_client}>
                                  {reservation.nom_client.split(' ')[0]}
                                </div>
                                <div className="text-xs opacity-75">
                                  {reservation.heure_reservation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cinquième rangée : Tables 5, 10, 15, 20, 25 */}
                  <div className="absolute top-96 left-64 flex space-x-16">
                    {[5, 10, 15, 20, 25].map((tableNum) => {
                      const table = tables.find(t => t.number === tableNum);
                      const reservation = table?.reservations[0];
                      return (
                        <div
                          key={tableNum}
                          onClick={() => table && handleTableClick(table)}
                          className={`
                            relative border-2 rounded-lg p-3 w-20 h-20 flex flex-col items-center justify-center
                            transition-all duration-200 cursor-pointer transform hover:scale-105
                            ${table ? getTableColor(table) : 'bg-gray-100 border-gray-300'}
                            ${selectedReservation && table?.status === 'available' ? 'ring-2 ring-blue-300' : ''}
                          `}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">{tableNum}</div>
                            {reservation && (
                              <div className="mt-1">
                                <div className="text-xs font-medium truncate max-w-[60px]" title={reservation.nom_client}>
                                  {reservation.nom_client.split(' ')[0]}
                                </div>
                                <div className="text-xs opacity-75">
                                  {reservation.heure_reservation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedReservation ? (
                    <>
                      <p>• Cliquez sur une ou plusieurs tables vertes pour les sélectionner</p>
                      <p>• Cliquez sur "Confirmer l'assignation" pour valider</p>
                      <p>• Cliquez sur "Annuler" pour quitter le mode assignation</p>
                    </>
                  ) : (
                    <>
                      <p>• Cliquez sur une table réservée (orange) ou occupée (rouge) pour voir les détails</p>
                      <p>• Les noms des clients et heures sont affichés sur les tables occupées</p>
                      <p>• Utilisez l'onglet "Réservations" pour assigner des tables aux clients en attente</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar avec liste des réservations */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Réservations du {currentService}
              </h3>
              
              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{todayReservations.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {tables.filter(t => t.status === 'available').length}
                  </div>
                  <div className="text-xs text-gray-600">Libres</div>
                </div>
              </div>
              
              {/* Liste des réservations */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayReservations
                  .sort((a, b) => {
                    // Tri par heure
                    const [hourA, minA] = a.heure_reservation.split(':').map(Number);
                    const [hourB, minB] = b.heure_reservation.split(':').map(Number);
                    return (hourA * 60 + minA) - (hourB * 60 + minB);
                  })
                  .map((reservation) => (
                  <div 
                    key={reservation.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      reservation.statut === 'nouvelle' ? 'bg-blue-50 border-blue-200' :
                      reservation.statut === 'en_attente' ? 'bg-pink-50 border-pink-200' :
                      reservation.statut === 'assignee' ? 'bg-orange-50 border-orange-200' :
                      reservation.statut === 'arrivee' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => {
                      if (reservation.statut === 'assignee' || reservation.statut === 'arrivee') {
                        // Trouver la table assignée et ouvrir le modal
                        const assignedTable = tables.find(t => 
                          t.number === reservation.table_assignee ||
                          (reservation.commentaire && reservation.commentaire.includes(`[Tables: `) && 
                           reservation.commentaire.includes(`${t.number}`))
                        );
                        if (assignedTable) {
                          setSelectedTable(assignedTable);
                          setShowTableModal(true);
                        }
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">{reservation.nom_client}</h4>
                      <span className="text-xs text-gray-600">{reservation.heure_reservation}</span>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>{reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? 's' : ''}</div>
                      {reservation.table_assignee && (
                        <div className="font-medium text-gray-800">
                          {(() => {
                            // Extraire les tables multiples du commentaire si présent
                            if (reservation.commentaire && reservation.commentaire.includes('[Tables:')) {
                              const match = reservation.commentaire.match(/\[Tables: ([^\]]+)\]/);
                              if (match) {
                                return `Tables: ${match[1]}`;
                              }
                            }
                            return `Table: ${reservation.table_assignee}`;
                          })()}
                        </div>
                      )}
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        reservation.statut === 'nouvelle' ? 'bg-blue-100 text-blue-800' :
                        reservation.statut === 'en_attente' ? 'bg-pink-100 text-pink-800' :
                        reservation.statut === 'assignee' ? 'bg-orange-100 text-orange-800' :
                        reservation.statut === 'arrivee' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reservation.statut === 'nouvelle' ? 'Nouvelle' :
                         reservation.statut === 'en_attente' ? 'En attente' :
                         reservation.statut === 'assignee' ? 'Assignée' :
                         reservation.statut === 'arrivee' ? 'Arrivée' : reservation.statut}
                      </div>
                    </div>
                    
                    {reservation.commentaire && !reservation.commentaire.includes('[Tables:') && (
                      <div className="text-xs text-gray-500 mt-2 italic truncate">
                        "{reservation.commentaire}"
                      </div>
                    )}
                  </div>
                ))}
                
                {todayReservations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto mb-2" size={32} />
                    <p>Aucune réservation pour ce service</p>
                  </div>
                )}
              </div>
              
              {/* Actions rapides */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowNewReservationModal(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Plus size={20} />
                  <span>Nouvelle réservation</span>
                </button>
              </div>
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
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm break-all">{reservation.email_client}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Téléphone:</span>
                        <span className="text-sm">{reservation.telephone_client}</span>
                      </div>
                      {reservation.commentaire && !reservation.commentaire.includes('[Tables:') && (
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
                            className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-2"
                          >
                            <Check size={16} />
                            <span>Marquer comme arrivé</span>
                          </button>
                        )}
                        
                        <button
                          onClick={async () => {
                            try {
                              await updateReservationStatus(reservation.id, 'en_attente', null);
                              const allReservations = await getAllReservations();
                              setReservations(allReservations);
                              addActivity(`Réservation de ${reservation.nom_client} désassignée - remise en attente`);
                              setShowTableModal(false);
                            } catch (error) {
                              console.error('Erreur lors de la désassignation:', error);
                              alert('Erreur lors de la désassignation de la réservation');
                            }
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
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-2"
                          >
                            <Check size={16} />
                            <span>Terminer</span>
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
                onClick={async () => {
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
                }}
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