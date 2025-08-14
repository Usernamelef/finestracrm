import React, { useState, useEffect } from 'react';

interface Table {
  number: number;
  capacity: number;
  status: 'available' | 'reserved' | 'occupied' | 'unavailable';
  reservations: any[];
  section: 'main' | 'terrace';
}

interface DraggedReservation {
  id: string;
  name: string;
  time: string;
  guests: number;
  status: string;
  sourceTable: number;
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
  const [isSelectingTables, setIsSelectingTables] = useState(false);
  const [draggedReservation, setDraggedReservation] = useState<DraggedReservation | null>(null);
  const [dragOverTable, setDragOverTable] = useState<number | null>(null);

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
    // 12:00 à 13:45 = midi, 18:00 à 21:45 = soir
    if (totalMinutes >= 12 * 60 && totalMinutes <= 13 * 60 + 45) {
      return 'midi';
    } else if (totalMinutes >= 18 * 60 && totalMinutes <= 21 * 60 + 45) {
      return 'soir';
    }
    // Par défaut, déterminer selon l'heure (avant 16h = midi, après = soir)
    return totalMinutes < 16 * 60 ? 'midi' : 'soir';
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
      // Vérifier si la table est disponible
      const tableStatus = getTableStatus(table.number);
      if (tableStatus.status !== 'available') {
        alert('Cette table n\'est pas disponible pour cette réservation.');
        return;
      }
      
      // Gestion manuelle de la sélection des tables
      if (selectedTables.includes(table.number)) {
        // Désélectionner la table si elle est déjà sélectionnée
        setSelectedTables(prev => prev.filter(t => t !== table.number));
      } else {
        // Ajouter la table à la sélection
        setSelectedTables(prev => [...prev, table.number]);
      }
      
      setIsSelectingTables(true);
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

  // Fonction pour confirmer l'assignation des tables sélectionnées
  const confirmTableAssignment = async () => {
    if (selectedReservation && selectedTables.length > 0) {
      console.log('Assignation des tables', selectedTables, 'à la réservation', selectedReservation);
      handleAssignTable(selectedReservation, selectedTables, true);
      setSelectedReservation(null);
      setSelectedTables([]);
      setIsSelectingTables(false);
      
      // Recharger les réservations après assignation
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
  };

  // Fonction pour annuler la sélection
  const cancelTableSelection = () => {
    setSelectedReservation(null);
    setSelectedTables([]);
    setIsSelectingTables(false);
  };
  return (
  // Fonctions de glisser-déposer
  const handleDragStart = (e: React.DragEvent, reservation: any, tableNumber: number) => {
    const dragData: DraggedReservation = {
      id: reservation.id,
      name: reservation.name,
      time: reservation.time,
      guests: reservation.guests,
      status: reservation.status,
      sourceTable: tableNumber
    };
    setDraggedReservation(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Nécessaire pour certains navigateurs
  };

  const handleDragOver = (e: React.DragEvent, tableNumber: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTable(tableNumber);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Vérifier si on quitte vraiment la zone (pas juste un enfant)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverTable(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetTableNumber: number) => {
    e.preventDefault();
    setDragOverTable(null);
    
    if (!draggedReservation) return;
    
    // Vérifier que la table cible est disponible
    const targetTableStatus = getTableStatus(targetTableNumber);
    if (targetTableStatus.status !== 'available') {
      alert('Cette table n\'est pas disponible.');
      setDraggedReservation(null);
      return;
    }
    
    // Vérifier qu'on ne dépose pas sur la même table
    if (draggedReservation.sourceTable === targetTableNumber) {
      setDraggedReservation(null);
      return;
    }
    
    try {
      // Trouver la réservation complète dans supabaseReservations
      const fullReservation = supabaseReservations.find(r => r.id === draggedReservation.id);
      if (fullReservation) {
        // Mettre à jour la table assignée
        const { updateReservationStatus } = await import('../../lib/supabase');
        await updateReservationStatus(fullReservation.id, fullReservation.statut, targetTableNumber);
        
        // Rafraîchir les données
        const { getAllReservations } = await import('../../lib/supabase');
        const allReservations = await getAllReservations();
        setSupabaseReservations(allReservations);
        
        addActivity(`${draggedReservation.name} déplacé(e) de la table ${draggedReservation.sourceTable} vers la table ${targetTableNumber}`);
      }
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      alert('Erreur lors du déplacement de la réservation');
    }
    
    setDraggedReservation(null);
  };

  const handleDragEnd = () => {
    setDraggedReservation(null);
    setDragOverTable(null);
  };

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
              {selectedReservation.statut === 'assignee' || selectedReservation.statut === 'arrivee' ? 'Modification d\'assignation' : 'Sélection des tables'} pour: {selectedReservation.nom_client || selectedReservation.name}
            </h3>
            <p className="text-xs sm:text-sm text-blue-700">
              {selectedReservation.nombre_personnes || selectedReservation.guests} personne{(selectedReservation.nombre_personnes || selectedReservation.guests) > 1 ? 's' : ''} • {selectedReservation.heure_reservation || selectedReservation.time}
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
                Tables sélectionnées: {selectedTables.join(', ')} ({selectedTables.length} table{selectedTables.length > 1 ? 's' : ''})
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              {selectedTables.length > 0 && (
                <button
                  onClick={confirmTableAssignment}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs sm:text-sm font-medium"
                >
                  Confirmer l'assignation ({selectedTables.length} table{selectedTables.length > 1 ? 's' : ''})
                </button>
              )}
              <button
                onClick={cancelTableSelection}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs sm:text-sm"
              >
                Annuler
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              💡 <strong>Instructions:</strong> Cliquez sur les tables disponibles (vertes) pour les sélectionner. 
              Vous pouvez sélectionner autant de tables que nécessaire. 
              Cliquez à nouveau sur une table sélectionnée pour la désélectionner.
            </p>
          </div>
        )}

        {/* Salle principale */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Salle principale</h2>
          
          {/* Plan de salle selon l'image */}
          <div className="relative min-h-[700px] bg-gray-50 rounded-lg p-6 overflow-hidden">
            
            {/* Fonction pour rendre une table */}
            {(() => {
              const renderTable = (tableNumber: number, className: string) => {
                const table = tables.find(t => t.number === tableNumber);
                if (!table) return null;
                
                const isOccupied = selectedReservation && isTableOccupiedAtTime(
                  table.number, 
                  selectedDateLocal, 
                  selectedReservation.heure_reservation || selectedReservation.time
                );
                const isSelected = selectedTables.includes(table.number);
                const tableStatus = getTableStatus(table.number);
                const isDragOver = dragOverTable === table.number;
                const canDropHere = draggedReservation && tableStatus.status === 'available';
                
                return (
                  <div key={table.number} className={className}>
                    <div
                      onClick={() => handleTableClick(table)}
                      onDragOver={(e) => canDropHere ? handleDragOver(e, table.number) : e.preventDefault()}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => canDropHere ? handleDrop(e, table.number) : e.preventDefault()}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                        isSelected ? 'bg-blue-500 border-blue-700 text-white shadow-lg' :
                        isDragOver && canDropHere ? 'bg-green-300 border-green-500 shadow-lg scale-110' :
                        isOccupied ? 'bg-red-200 border-red-500' :
                        tableStatus.status === 'available' ? 'bg-green-100 border-green-300 hover:bg-green-200' :
                        tableStatus.status === 'reserved' ? 'bg-orange-100 border-orange-300 hover:bg-orange-200' :
                        tableStatus.status === 'occupied' ? 'bg-red-100 border-red-300 hover:bg-red-200' :
                        'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <div className={`text-sm sm:text-base font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{table.number}</div>
                      <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>{table.capacity}p</div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      {isDragOver && canDropHere && (
                        <div className="absolute inset-0 bg-green-400 bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Déposer ici</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Réservation sous la table */}
                    {(() => {
                      const tableStatus = getTableStatus(table.number);
                      if (tableStatus.reservation) {
                        return (
                          <div 
                            className="mt-1 w-16 sm:w-20 bg-white p-1 rounded text-xs border text-center shadow-sm cursor-move hover:shadow-md transition-shadow"
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, tableStatus.reservation, table.number)}
                            onDragEnd={handleDragEnd}
                            title="Glissez pour déplacer vers une autre table"
                          >
                            <div className="font-medium truncate text-xs">{tableStatus.reservation.name}</div>
                            <div className="text-gray-600 text-xs">{tableStatus.reservation.time}</div>
                            <div className="text-gray-400 text-xs">↔️</div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              };
              
              return (
                <div className="w-full h-full grid grid-cols-12 grid-rows-8 gap-2 sm:gap-4">
                  {/* Rangée 1 - Tables 28, 29 à gauche et 31, 30 à droite */}
                  <div className="col-start-1 row-start-1">
                    {renderTable(28, '')}
                  </div>
                  <div className="col-start-2 row-start-1">
                    {renderTable(29, '')}
                  </div>
                  <div className="col-start-11 row-start-1">
                    {renderTable(31, '')}
                  </div>
                  <div className="col-start-12 row-start-1">
                    {renderTable(30, '')}
                  </div>
                  
                  {/* Rangée 2 - Tables 26, 27, 7, 8, 10, 12 */}
                  <div className="col-start-1 row-start-2">
                    {renderTable(26, '')}
                  </div>
                  <div className="col-start-2 row-start-2">
                    {renderTable(27, '')}
                  </div>
                  <div className="col-start-5 row-start-2">
                    {renderTable(7, '')}
                  </div>
                  <div className="col-start-7 row-start-2">
                    {renderTable(8, '')}
                  </div>
                  <div className="col-start-10 row-start-2">
                    {renderTable(10, '')}
                  </div>
                  <div className="col-start-12 row-start-2">
                    {renderTable(12, '')}
                  </div>
                  
                  {/* Rangée 3 - Tables 6, 9, 11, 13 */}
                  <div className="col-start-4 row-start-3">
                    {renderTable(6, '')}
                  </div>
                  <div className="col-start-7 row-start-3">
                    {renderTable(9, '')}
                  </div>
                  <div className="col-start-10 row-start-3">
                    {renderTable(11, '')}
                  </div>
                  <div className="col-start-12 row-start-3">
                    {renderTable(13, '')}
                  </div>
                  
                  {/* Colonne gauche - Tables 25, 24, 23, 22, 21, 20 */}
                  <div className="col-start-1 row-start-4">
                    {renderTable(25, '')}
                  </div>
                  <div className="col-start-1 row-start-5">
                    {renderTable(24, '')}
                  </div>
                  <div className="col-start-1 row-start-6">
                    {renderTable(23, '')}
                  </div>
                  <div className="col-start-1 row-start-7">
                    {renderTable(22, '')}
                  </div>
                  <div className="col-start-1 row-start-8">
                    {renderTable(21, '')}
                  </div>
                  <div className="col-start-2 row-start-8">
                    {renderTable(20, '')}
                  </div>
                  
                  {/* Rangée du bas - Tables 5, 4, 3, 2, 1 */}
                  <div className="col-start-5 row-start-7">
                    {renderTable(5, '')}
                  </div>
                  <div className="col-start-7 row-start-7">
                    {renderTable(4, '')}
                  </div>
                  <div className="col-start-8 row-start-7">
                    {renderTable(3, '')}
                  </div>
                  <div className="col-start-10 row-start-7">
                    {renderTable(2, '')}
                  </div>
                  <div className="col-start-12 row-start-7">
                    {renderTable(1, '')}
                  </div>
                </div>
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
              <div className="w-4 h-4 bg-blue-500 border border-blue-700 rounded"></div>
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
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-300 border border-green-500 rounded"></div>
              <span className="text-xs sm:text-sm text-gray-700">Zone de dépôt</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Glisser-Déposer</h4>
            <p className="text-xs text-blue-700">
              <strong>Déplacer une réservation :</strong> Cliquez et glissez la carte de réservation (sous la table) vers une table disponible (verte). 
              La table de destination s'illuminera en vert clair quand vous pourrez y déposer la réservation.
            </p>
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
                            const { sendSMS, getCancellationSMSTemplate, formatPhoneNumber } = await import('../../lib/supabase');
                            
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
                              
                              // Envoyer SMS d'annulation si le téléphone est valide
                              if (fullReservation.telephone_client && fullReservation.telephone_client !== 'N/A') {
                                try {
                                  const smsMessage = getCancellationSMSTemplate(
                                    fullReservation.nom_client,
                                    new Date(fullReservation.date_reservation).toLocaleDateString('fr-FR'),
                                    fullReservation.heure_reservation
                                  );
                                  const formattedPhone = formatPhoneNumber(fullReservation.telephone_client);
                                  await sendSMS(formattedPhone, smsMessage);
                                } catch (smsError) {
                                  console.error('Erreur SMS:', smsError);
                                }
                              }
                              
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