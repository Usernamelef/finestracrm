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
      
      // Vérifier si cette table est assignée (table principale ou dans le commentaire)
      const isMainTable = reservation.table_assignee === tableNumber;
      const isInMultipleTables = reservation.commentaire && 
        reservation.commentaire.includes(`[Tables:`) && 
        reservation.commentaire.includes(`${tableNumber}`);
      
      const isAssignedToThisTable = isMainTable || isInMultipleTables;
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
      // Aucune réservation en attente - vérifier s'il y a une réservation sur cette table
      const tableStatus = getTableStatus(table.number);
      if (tableStatus.reservation) {
        // Il y a une réservation sur cette table - afficher le modal de gestion
        setSelectedTable({...table, currentReservation: tableStatus.reservation});
        setShowTableModal(true);
      } else {
        // Table vide - afficher les détails de la table
        setSelectedTable(table);
        setShowTableModal(true);
      }
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          Plan de salle – Service du {currentService === 'midi' ? 'Midi' : 'Soir'} – {formatSelectedDate(selectedDateLocal)}
        </h1>

        {/* Sélecteur de date */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sélectionner la date et le service</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* Sélecteur de service */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentService('midi')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    currentService === 'midi'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Midi
                </button>
                <button
                  onClick={() => setCurrentService('soir')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
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
                className="px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

        {selectedReservation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-blue-800 mb-2">
              {selectedReservation.statut === 'assignee' || selectedReservation.statut === 'arrivee' ? 'Modification d\'assignation' : 'Assignation en cours'} pour: {selectedReservation.nom_client || selectedReservation.name}
            </h3>
            <p className="text-xs sm:text-sm text-blue-700">
              {selectedReservation.nombre_personnes || selectedReservation.guests} personne{(selectedReservation.nombre_personnes || selectedReservation.guests) > 1 ? 's' : ''} • {selectedReservation.heure_reservation || selectedReservation.time} • {Math.ceil((selectedReservation.nombre_personnes || selectedReservation.guests) / 2)} table(s) nécessaire(s)
            </p>
            <p className="text-xs sm:text-sm text-blue-600">
              Date: {selectedReservation.date_reservation || selectedReservation.date}
            </p>
            {(selectedReservation.statut === 'assignee' || selectedReservation.statut === 'arrivee') && selectedReservation.table_assignee && (
              <p className="text-xs sm:text-sm text-blue-600">
                Table actuelle: {selectedReservation.table_assignee}
                {selectedReservation.commentaire && selectedReservation.commentaire.includes('[Tables:') && (
                  (() => {
                    const match = selectedReservation.commentaire.match(/\[Tables: ([^\]]+)\]/);
                    return match ? ` (Tables multiples: ${match[1]})` : '';
                  })()
                )}
              </p>
            )}
            {selectedTables.length > 0 && (
              <p className="text-xs sm:text-sm text-blue-600 mt-2">
                Tables sélectionnées: {selectedTables.join(', ')} ({selectedTables.length}/{Math.ceil((selectedReservation.nombre_personnes || selectedReservation.guests) / 2)})
              </p>
            )}
            <button
              onClick={() => {
                setSelectedReservation(null);
                setSelectedTables([]);
              }}
              className="mt-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs sm:text-sm"
            >
              Annuler
            </button>
          </div>
        )}

        {/* Salle principale */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Salle principale</h2>
          
          {/* Plan de salle selon l'image */}
          <div className="relative min-h-[600px] bg-gray-50 rounded-lg p-4">
            
            {/* Fonction pour rendre une table */}
            {(() => {
              const renderTable = (tableNumber: number, style: React.CSSProperties) => {
                const table = tables.find(t => t.number === tableNumber);
                if (!table) return null;
                
                const isOccupied = selectedReservation && isTableOccupiedAtTime(
                  table.number, 
                  selectedDateLocal, 
                  selectedReservation.heure_reservation || selectedReservation.time
                );
                const isSelected = selectedTables.includes(table.number);
                const tableStatus = getTableStatus(table.number);
                
                return (
                  <div key={table.number} className="absolute" style={style}>
                    <div
                      onClick={() => handleTableClick(table)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                        isSelected ? 'bg-blue-200 border-blue-500' :
                        isOccupied ? 'bg-red-200 border-red-500' :
                        tableStatus.status === 'available' ? 'bg-green-100 border-green-300 hover:bg-green-200' :
                        tableStatus.status === 'reserved' ? 'bg-orange-100 border-orange-300 hover:bg-orange-200' :
                        tableStatus.status === 'occupied' ? 'bg-red-100 border-red-300 hover:bg-red-200' :
                        'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-sm sm:text-base font-bold text-gray-800">{table.number}</div>
                        <div className="text-xs text-gray-600">{table.capacity}p</div>
                      </div>
                    </div>
                    
                    {/* Réservation sous la table */}
                    {(() => {
                      const tableStatus = getTableStatus(table.number);
                      if (tableStatus.reservation) {
                        return (
                          <div className="absolute top-20 left-0 w-16 sm:w-20 bg-gray-50 p-1 rounded text-xs border text-center">
                            <div className="font-medium truncate text-xs">{tableStatus.reservation.name}</div>
                            <div className="text-gray-600 text-xs">{tableStatus.reservation.time}</div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              };
              
              return (
                <>
                  {/* Rangée du haut */}
                  {renderTable(28, { top: '20px', left: '50px' })}
                  {renderTable(29, { top: '20px', left: '150px' })}
                  {renderTable(31, { top: '20px', right: '150px' })}
                  {renderTable(30, { top: '20px', right: '50px' })}
                  
                  {/* Deuxième rangée */}
                  {renderTable(26, { top: '120px', left: '50px' })}
                  {renderTable(27, { top: '120px', left: '150px' })}
                  {renderTable(7, { top: '120px', left: '300px' })}
                  {renderTable(8, { top: '120px', left: '450px' })}
                  {renderTable(10, { top: '120px', right: '150px' })}
                  {renderTable(12, { top: '120px', right: '50px' })}
                  
                  {/* Troisième rangée */}
                  {renderTable(6, { top: '220px', left: '200px' })}
                  {renderTable(9, { top: '220px', left: '450px' })}
                  {renderTable(11, { top: '220px', right: '150px' })}
                  {renderTable(13, { top: '220px', right: '50px' })}
                  
                  {/* Colonne de gauche (tables 20-25) */}
                  {renderTable(25, { top: '320px', left: '50px' })}
                  {renderTable(24, { top: '400px', left: '50px' })}
                  {renderTable(23, { top: '480px', left: '50px' })}
                  {renderTable(22, { top: '560px', left: '50px' })}
                  {renderTable(21, { top: '640px', left: '50px' })}
                  {renderTable(20, { top: '720px', left: '50px' })}
                  
                  {/* Rangée du bas (tables 1-5) */}
                  {renderTable(5, { bottom: '20px', left: '300px' })}
                  {renderTable(4, { bottom: '20px', left: '400px' })}
                  {renderTable(3, { bottom: '20px', left: '500px' })}
                  {renderTable(2, { bottom: '20px', left: '600px' })}
                  {renderTable(1, { bottom: '20px', left: '700px' })}
                </>
              );
            })()}
          </div>
        </div>

        {/* Légende */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Légende</h3>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-700">Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 border border-blue-500 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-700">Sélectionnée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-700">Réservée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-700">Occupée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-700">Hors service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal détail table */}
      {showTableModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {selectedTable.currentReservation ? (
              // Modal pour table avec réservation
              <>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Gestion de la réservation - Table {selectedTable.number}
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{selectedTable.currentReservation.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {selectedTable.currentReservation.time} • {selectedTable.currentReservation.guests} personne{selectedTable.currentReservation.guests > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Statut: <span className={`font-medium ${
                        selectedTable.currentReservation.status === 'assignee' ? 'text-orange-600' : 'text-purple-600'
                      }`}>
                        {selectedTable.currentReservation.status === 'assignee' ? 'Assignée' : 'Arrivée'}
                      </span>
                    </p>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <button
                      onClick={async () => {
                        // Trouver la réservation complète dans supabaseReservations
                        const fullReservation = supabaseReservations.find(r => r.id === selectedTable.currentReservation.id);
                        if (fullReservation) {
                          setSelectedReservation(fullReservation);
                          setShowTableModal(false);
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm"
                    >
                      Déplacer vers une autre table
                    </button>
                    
                    {selectedTable.currentReservation.status === 'assignee' && (
                      <button
                        onClick={async () => {
                          try {
                            const { updateReservationStatus } = await import('../../lib/supabase');
                            await updateReservationStatus(selectedTable.currentReservation.id, 'arrivee');
                            
                            // Rafraîchir les données
                            const { getAllReservations } = await import('../../lib/supabase');
                            const allReservations = await getAllReservations();
                            setSupabaseReservations(allReservations);
                            
                            setShowTableModal(false);
                            addActivity(`Client ${selectedTable.currentReservation.name} marqué comme arrivé - Table ${selectedTable.number}`);
                          } catch (error) {
                            console.error('Erreur:', error);
                            alert('Erreur lors du marquage comme arrivé');
                          }
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm"
                      >
                        Marquer comme arrivé
                      </button>
                    )}
                    
                    {selectedTable.currentReservation.status === 'arrivee' && (
                      <button
                        onClick={async () => {
                          try {
                            const { updateReservationStatus } = await import('../../lib/supabase');
                            await updateReservationStatus(selectedTable.currentReservation.id, 'terminee');
                            
                            // Rafraîchir les données
                            const { getAllReservations } = await import('../../lib/supabase');
                            const allReservations = await getAllReservations();
                            setSupabaseReservations(allReservations);
                            
                            setShowTableModal(false);
                            addActivity(`Table ${selectedTable.number} libérée - ${selectedTable.currentReservation.name}`);
                          } catch (error) {
                            console.error('Erreur:', error);
                            alert('Erreur lors de la finalisation');
                          }
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm"
                      >
                        Terminer et libérer la table
                      </button>
                    )}
                    
                    <button
                      onClick={async () => {
                        if (confirm(`Êtes-vous sûr de vouloir annuler la réservation de ${selectedTable.currentReservation.name} ?`)) {
                          try {
                            const { updateReservationStatus, sendEmail, getCancellationEmailTemplate } = await import('../../lib/supabase');
                            
                            // Trouver la réservation complète
                            const fullReservation = supabaseReservations.find(r => r.id === selectedTable.currentReservation.id);
                            if (fullReservation) {
                              await updateReservationStatus(fullReservation.id, 'annulee');
                              
                              // Envoyer email d'annulation
                              const emailHtml = getCancellationEmailTemplate(
                                fullReservation.nom_client,
                                new Date(fullReservation.date_reservation).toLocaleDateString('fr-FR'),
                                fullReservation.heure_reservation
                              );
                              await sendEmail(fullReservation.email_client, 'Annulation de votre réservation à La Finestra', emailHtml);
                              
                              // Rafraîchir les données
                              const { getAllReservations } = await import('../../lib/supabase');
                              const allReservations = await getAllReservations();
                              setSupabaseReservations(allReservations);
                              
                              setShowTableModal(false);
                              addActivity(`Réservation de ${selectedTable.currentReservation.name} annulée - Table ${selectedTable.number} libérée`);
                            }
                          } catch (error) {
                            console.error('Erreur:', error);
                            alert('Erreur lors de l\'annulation');
                          }
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm"
                    >
                      Annuler la réservation
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Modal pour table vide
              <>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Table {selectedTable.number} - {selectedTable.section === 'main' ? 'Salle principale' : 'Terrasse'}
                </h3>
                
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Capacité: {selectedTable.capacity} personnes</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Statut: <span className="font-medium text-green-600">Disponible</span>
                  </p>
                </div>
                
                {selectedReservation && (
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm mt-4"
                  >
                    Assigner {selectedReservation.nom_client || selectedReservation.name} à cette table
                  </button>
                )}
              </>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-3 sm:px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
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