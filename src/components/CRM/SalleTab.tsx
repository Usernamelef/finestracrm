import React, { useState, useEffect } from 'react';

interface Table {
  number: number;
  capacity: number;
  status: 'available' | 'reserved' | 'occupied' | 'unavailable';
  reservations: any[];
  section: 'main' | 'terrace';
}

interface SalleTabProps {
  currentService: 'midi' | 'soir';
  setCurrentService: (service: 'midi' | 'soir') => void;
  selectedReservation: any;
  setSelectedReservation: React.Dispatch<React.SetStateAction<any>>;
  handleAssignTable: (reservationId: string, tableNumbers: number[], fromSalleTab: boolean) => void;
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
  handleDateChange: (date: string) => void;
}

const SalleTab: React.FC<SalleTabProps> = ({
  currentService,
  setCurrentService,
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
  handleDateChange
}) => {
  const [selectedDateLocal, setSelectedDateLocal] = useState(new Date().toISOString().split('T')[0]);

  const [supabaseReservations, setSupabaseReservations] = useState<any[]>([]);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);

  // Charger les réservations depuis Supabase
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const { getAllReservations } = await import('../../lib/supabase');
        const allReservations = await getAllReservations();
        setSupabaseReservations(allReservations);
      } catch (error) {
        console.error('Erreur lors du chargement des réservations:', error);
      }
    };

    fetchReservations();
  }, []);

  // Fonction pour déterminer le service basé sur l'heure
  const getServiceFromTime = (heure: string) => {
    const [hour, minute] = heure.split(':').map(Number);
    const totalMinutes = hour * 60 + minute;
    return totalMinutes <= 16 * 60 ? 'midi' : 'soir';
  };

  // Calculer l'état des tables basé sur les réservations Supabase
  const getTableStatus = (tableNumber: number) => {
    const tableReservations = supabaseReservations.filter(reservation => {
      const reservationDate = reservation.date_reservation;
      const reservationTime = reservation.heure_reservation;
      const reservationService = getServiceFromTime(reservationTime);
      
      const isAssignedToThisTable = reservation.table_assignee === tableNumber;
      const isCorrectDateAndService = 
        reservationDate === selectedDateLocal && 
        reservationService === currentService;
      const isActiveStatus = 
        reservation.statut === 'assignee' || 
        reservation.statut === 'arrivee';
      
      return isAssignedToThisTable && isCorrectDateAndService && isActiveStatus;
    });

    if (tableReservations.length > 0) {
      const reservation = tableReservations[0];
      return {
        status: reservation.statut === 'arrivee' ? 'occupied' : 'reserved',
        reservation: {
          id: reservation.id,
          name: reservation.nom_client,
          time: reservation.heure_reservation,
          guests: reservation.nombre_personnes,
          status: reservation.statut
        }
      };
    }

    return { status: 'available', reservation: null };
  };

  // Fonction pour vérifier si une table est occupée à une heure donnée
  const isTableOccupiedAtTime = (tableNumber: number, date: string, time: string) => {
    if (!selectedReservation) return false;
  
    return reservationsData.some(reservation => {
      if (reservation.status === 'assigned' || reservation.status === 'arrived') {
        const hasTable = reservation.tableNumber === tableNumber || 
                         (reservation.tableNumbers && reservation.tableNumbers.includes(tableNumber));
        const sameDate = reservation.date === date;
        const sameTime = reservation.time === time;
        
        return hasTable && sameDate && sameTime && reservation.id !== selectedReservation.id;
      }
      return false;
    });
  };

  // Fonction pour gérer le clic sur une table
  const handleTableClick = (table: Table) => {
    // Si une réservation est en attente d'assignation
    if (selectedReservation) {
      const guestCount = selectedReservation.nombre_personnes || selectedReservation.guests;
      const tablesNeeded = Math.ceil(guestCount / 2); // 2 personnes par table
      
      // Vérifier si la table est disponible
      const tableStatus = getTableStatus(table.number);
      if (tableStatus.status !== 'available') {
        alert('Cette table n\'est pas disponible pour cette réservation.');
        return;
      }
      
      // Gestion des tables multiples
      const newSelectedTables = [...selectedTables, table.number];
      setSelectedTables(newSelectedTables);
      
      if (newSelectedTables.length === tablesNeeded) {
        // Toutes les tables nécessaires sont sélectionnées
        console.log('Assignation des tables', newSelectedTables, 'à la réservation', selectedReservation);
        handleAssignTable(selectedReservation, newSelectedTables, true);
        setSelectedReservation(null);
        setSelectedTables([]);
      } else {
        // Encore des tables à sélectionner
        const remaining = tablesNeeded - newSelectedTables.length;
        alert(`Table ${table.number} sélectionnée. Sélectionnez encore ${remaining} table(s).`);
      }
      
      // Recharger les réservations après assignation
      if (newSelectedTables.length === tablesNeeded) {
        setTimeout(async () => {
          try {
            const { getAllReservations } = await import('../../lib/supabase');
            const allReservations = await getAllReservations();
            setSupabaseReservations(allReservations);
          } catch (error) {
            console.error('Erreur lors du rechargement:', error);
          }
        }, 1000);
      }
    } else {
      // Aucune réservation en attente - afficher les détails de la table
      setSelectedTable(table);
      setShowTableModal(true);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Plan de salle – Service du {currentService === 'midi' ? 'Midi' : 'Soir'} – {formatSelectedDate(selectedDateLocal)}
        </h1>

        {/* Sélecteur de date */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Sélectionner la date et le service</h3>
            <div className="flex items-center space-x-4">
              {/* Sélecteur de service */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentService('midi')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    currentService === 'midi'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Midi
                </button>
                <button
                  onClick={() => setCurrentService('soir')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    currentService === 'soir'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Soir
                </button>
              </div>
              
              {/* Sélecteur de date */}
              <input
                type="date"
                value={selectedDateLocal}
                onChange={(e) => {
                  setSelectedDateLocal(e.target.value);
                  handleDateChange(e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {selectedReservation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              Assignation en cours pour: {selectedReservation.nom_client || selectedReservation.name}
            </h3>
            <p className="text-blue-700">
              {selectedReservation.nombre_personnes || selectedReservation.guests} personne{(selectedReservation.nombre_personnes || selectedReservation.guests) > 1 ? 's' : ''} • {selectedReservation.heure_reservation || selectedReservation.time} • {Math.ceil((selectedReservation.nombre_personnes || selectedReservation.guests) / 2)} table(s) nécessaire(s)
            </p>
            <p className="text-blue-600 text-sm">
              Date: {selectedReservation.date_reservation || selectedReservation.date}
            </p>
            {selectedTables.length > 0 && (
              <p className="text-blue-600 text-sm mt-2">
                Tables sélectionnées: {selectedTables.join(', ')} ({selectedTables.length}/{Math.ceil((selectedReservation.nombre_personnes || selectedReservation.guests) / 2)})
              </p>
            )}
          </div>
        )}

        {/* Salle principale */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Salle principale</h2>
          <div className="grid grid-cols-4 gap-8">
            {tables.filter(table => table.section === 'main').map((table) => (
              <div key={table.number} className="flex items-center space-x-4">
                {/* Table */}
                {(() => {
                  const isOccupied = selectedReservation && isTableOccupiedAtTime(
                    table.number, 
                    selectedDateLocal, 
                    selectedReservation.heure_reservation || selectedReservation.time
                  );
                  const isSelected = selectedTables.includes(table.number);
                  const tableStatus = getTableStatus(table.number);
                  
                  return (
                <div
                  onClick={() => handleTableClick(table)}
                  className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? 'bg-blue-200 border-blue-500' :
                    isOccupied ? 'bg-red-200 border-red-500' :
                    tableStatus.status === 'available' ? 'bg-green-100 border-green-300 hover:bg-green-200' :
                    tableStatus.status === 'reserved' ? 'bg-orange-100 border-orange-300 hover:bg-orange-200' :
                    tableStatus.status === 'occupied' ? 'bg-red-100 border-red-300 hover:bg-red-200' :
                    'bg-gray-100 border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{table.number}</div>
                    <div className="text-xs text-gray-600">{table.capacity}p</div>
                  </div>
                </div>
                  );
                })()}

                {/* Réservations à droite de la table */}
                <div className="flex-1 space-y-2">
                  {(() => {
                    const tableStatus = getTableStatus(table.number);
                    if (tableStatus.reservation) {
                      return (
                        <div key={tableStatus.reservation.id} className="bg-gray-50 p-2 rounded text-xs border">
                          <div className="font-medium">{tableStatus.reservation.name}</div>
                          <div className="text-gray-600">{tableStatus.reservation.time} • {tableStatus.reservation.guests}p</div>
                          <div className="text-gray-500">{tableStatus.reservation.status === 'assignee' ? 'Réservé' : 'Arrivé'}</div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terrasse */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Terrasse</h2>
          <div className="grid grid-cols-4 gap-8">
            {tables.filter(table => table.section === 'terrace').map((table) => (
              <div key={table.number} className="flex items-center space-x-4">
                {/* Table */}
                {(() => {
                  const isOccupied = selectedReservation && isTableOccupiedAtTime(
                    table.number, 
                    selectedDateLocal, 
                    selectedReservation.heure_reservation || selectedReservation.time
                  );
                  const isSelected = selectedTables.includes(table.number);
                  const tableStatus = getTableStatus(table.number);
                  
                  return (
                <div
                  onClick={() => handleTableClick(table)}
                  className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? 'bg-blue-200 border-blue-500' :
                    isOccupied ? 'bg-red-200 border-red-500' :
                    tableStatus.status === 'available' ? 'bg-green-100 border-green-300 hover:bg-green-200' :
                    tableStatus.status === 'reserved' ? 'bg-orange-100 border-orange-300 hover:bg-orange-200' :
                    tableStatus.status === 'occupied' ? 'bg-red-100 border-red-300 hover:bg-red-200' :
                    'bg-gray-100 border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{table.number}</div>
                    <div className="text-xs text-gray-600">{table.capacity}p</div>
                  </div>
                </div>
                  );
                })()}

                {/* Réservations à droite de la table */}
                <div className="flex-1 space-y-2">
                  {(() => {
                    const tableStatus = getTableStatus(table.number);
                    if (tableStatus.reservation) {
                      return (
                        <div key={tableStatus.reservation.id} className="bg-gray-50 p-2 rounded text-xs border">
                          <div className="font-medium">{tableStatus.reservation.name}</div>
                          <div className="text-gray-600">{tableStatus.reservation.time} • {tableStatus.reservation.guests}p</div>
                          <div className="text-gray-500">{tableStatus.reservation.status === 'assignee' ? 'Réservé' : 'Arrivé'}</div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Légende */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Légende</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm text-gray-700">Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 border border-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Sélectionnée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-sm text-gray-700">Réservée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-sm text-gray-700">Occupée / Indisponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-700">Hors service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal détail table */}
      {showTableModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Table {selectedTable.number} - {selectedTable.section === 'main' ? 'Salle principale' : 'Terrasse'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Capacité: {selectedTable.capacity} personnes</p>
                <p className="text-sm text-gray-600">
                  Statut: <span className={`font-medium ${
                    selectedTable.status === 'available' ? 'text-green-600' :
                    selectedTable.status === 'reserved' ? 'text-orange-600' :
                    selectedTable.status === 'occupied' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {selectedTable.status === 'available' ? 'Disponible' :
                     selectedTable.status === 'reserved' ? 'Réservée' :
                     selectedTable.status === 'occupied' ? 'Occupée' :
                     'Indisponible'}
                  </span>
                </p>
              </div>
              
              {selectedTable.reservations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Réservations:</h4>
                  {selectedTable.reservations.map((reservation) => (
                    <div key={reservation.id} className="bg-gray-50 p-2 rounded text-xs border">
                      <div className="font-medium">{reservation.name}</div>
                      <div className="text-gray-600">{reservation.time} • {reservation.guests}p</div>
                      <p className="text-sm text-gray-600">Statut: {reservation.status}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedReservation && selectedTable.status === 'available' && (
                <button
                  onClick={() => {
                    const guestCount = selectedReservation.nombre_personnes || selectedReservation.guests;
                    const tablesNeeded = Math.ceil(guestCount / 2); // 2 personnes par table
                    if (tablesNeeded === 1) {
                      handleAssignTable(selectedReservation.id, [selectedTable.number], true);
                    } else {
                      // Pour les groupes plus grands, proposer des tables adjacentes
                      const availableCombos = getAvailableAdjacentTables(guestCount);
                      const combo = availableCombos.find(combo => combo.includes(selectedTable.number));
                      if (combo) {
                        handleAssignTable(selectedReservation.id, combo, true);
                      }
                    }
                    setSelectedReservation(null);
                    setShowTableModal(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Assigner {selectedReservation.nom_client || selectedReservation.name} à cette table
                </button>
              )}
              
              {selectedTable.status === 'occupied' && (
                <button
                  onClick={() => {
                    handleFreeTable(selectedTable.number);
                    setShowTableModal(false);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Libérer la table
                </button>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalleTab;