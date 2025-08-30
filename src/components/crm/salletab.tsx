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
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [selectedTableForReservation, setSelectedTableForReservation] = useState<number | null>(null);
  const [newReservation, setNewReservation] = useState({
    name: '',
    email: '',
    phone: '',
    time: '',
    guests: '',
    message: ''
  });

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
    } else if (table.status === 'available') {
      // Vérifier si le restaurant est ouvert pour ce service/date
      const selectedDate = new Date(selectedDate);
      const dayOfWeek = selectedDate.getDay();
      
      // Bloquer samedi midi
      if (dayOfWeek === 6 && currentService === 'midi') {
        alert('❌ Restaurant fermé samedi midi\n\nLe restaurant est ouvert :\n• Lundi-Vendredi : 12h-14h30 et 19h-22h30\n• Samedi : 19h-22h30 seulement\n• Dimanche : Fermé');
        return;
      }
      
      // Bloquer dimanche
      if (dayOfWeek === 0) {
        alert('❌ Restaurant fermé le dimanche\n\nLe restaurant est ouvert :\n• Lundi-Vendredi : 12h-14h30 et 19h-22h30\n• Samedi : 19h-22h30 seulement');
        return;
      }
      
      // Table vide - créer une réservation directement
      setSelectedTableForReservation(table.number);
      setNewReservation({
        name: '',
        email: '',
        phone: '',
        time: currentService === 'midi' ? '12:00' : '19:00',
        guests: '2',
        message: ''
      });
      setShowNewReservationModal(true);
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

  const handleCreateReservation = async () => {
    if (!newReservation.name || !newReservation.phone || !newReservation.time || !newReservation.guests) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { createReservation } = await import('../../lib/supabase');
      
      // Créer la réservation dans Supabase
      const reservationData = {
        nom_client: newReservation.name,
        email_client: newReservation.email || 'N/A',
        telephone_client: newReservation.phone,
        date_reservation: selectedDate,
        heure_reservation: newReservation.time,
        nombre_personnes: parseInt(newReservation.guests),
        commentaire: newReservation.message || null,
        statut: 'assignee', // Directement assignée à la table sélectionnée
        table_assignee: selectedTableForReservation
      };

      const createdReservation = await createReservation(reservationData);
      
      // Assigner immédiatement la table
      if (selectedTableForReservation) {
        const { updateReservationStatus } = await import('../../lib/supabase');
        await updateReservationStatus(createdReservation.id, 'assignee', selectedTableForReservation);
      }
      
      // Envoyer les confirmations
      if (newReservation.email && newReservation.email.trim()) {
        try {
          const { sendEmail, getConfirmationEmailTemplate } = await import('../../lib/supabase');
          const emailHtml = getConfirmationEmailTemplate(
            newReservation.name,
            new Date(selectedDate).toLocaleDateString('fr-FR'),
            newReservation.time,
            parseInt(newReservation.guests)
          );
          await sendEmail(newReservation.email, 'Confirmation de votre réservation à La Finestra', emailHtml);
        } catch (emailError) {
          console.warn('Erreur email:', emailError);
        }
      }
      
      try {
        const { sendSMS, getConfirmationSMSTemplate, formatPhoneNumber } = await import('../../lib/supabase');
        const smsMessage = getConfirmationSMSTemplate(
          newReservation.name,
          new Date(selectedDate).toLocaleDateString('fr-FR'),
          newReservation.time,
          parseInt(newReservation.guests)
        );
        const formattedPhone = formatPhoneNumber(newReservation.phone);
        await sendSMS(formattedPhone, smsMessage);
      } catch (smsError) {
        console.warn('Erreur SMS:', smsError);
      }
      
      // Rafraîchir les données
      await fetchReservations();
      
      // Fermer le modal
      setShowNewReservationModal(false);
      setSelectedTableForReservation(null);
      
      addActivity(`Réservation créée pour ${newReservation.name} et assignée à la table ${selectedTableForReservation}`);
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la réservation');
    }
  };

  const renderTable = (tableNumber: number, position: { top: string; left: string }) => {
    const table = tables.find(t => t.number === tableNumber);
    if (!table) return null;

    // Trouver la réservation pour cette table
    const reservation = table.reservations[0];

    return (
      <div
        key={tableNumber}
        className={`absolute w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all cursor-pointer ${getTableColor(table)}`}
        style={{ top: position.top, left: position.left }}
        onClick={() => handleTableClick(table)}
      >
        {reservation ? (
          <>
            <div className="text-[10px] font-bold mb-0.5">{tableNumber}</div>
            <div className="text-[9px] text-center leading-tight px-1 font-semibold truncate w-full max-w-full">
              {reservation.nom_client}
            </div>
            <div className="text-[9px] text-center mt-0.5">
              {reservation.heure_reservation}
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] font-bold">{tableNumber}</div>
            <div className="text-[9px] text-gray-500">2p</div>
          </>
        )}
      </div>
    );
  };

  const tablePositions = {
    // REPRODUCTION EXACTE DE L'IMAGE
    // Ligne 1 - Tout en haut
    28: { top: '5%', left: '5%' },
    29: { top: '5%', left: '15%' },
    31: { top: '5%', left: '75%' },
    30: { top: '5%', left: '85%' },
    
    // Ligne 2 - Deuxième rangée
    26: { top: '20%', left: '5%' },
    27: { top: '20%', left: '15%' },
    7: { top: '20%', left: '35%' },
    8: { top: '20%', left: '50%' },
    10: { top: '20%', left: '70%' },
    12: { top: '20%', left: '85%' },
    
    // Ligne 3 - Troisième rangée
    6: { top: '35%', left: '25%' },
    9: { top: '35%', left: '45%' },
    11: { top: '35%', left: '70%' },
    13: { top: '35%', left: '85%' },
    
    // Table isolée à gauche
    25: { top: '50%', left: '5%' },
    
    // Colonne gauche verticale
    24: { top: '65%', left: '5%' },
    23: { top: '75%', left: '5%' },
    22: { top: '85%', left: '5%' },
    
    // Ligne du bas - Tables centrales
    5: { top: '85%', left: '35%' },
    4: { top: '85%', left: '50%' },
    3: { top: '85%', left: '60%' },
    2: { top: '85%', left: '70%' },
    1: { top: '85%', left: '85%' },
    
    // Ligne tout en bas
    21: { top: '95%', left: '5%' },
    20: { top: '95%', left: '15%' }
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
            <div className="relative bg-gray-50 rounded-lg border-2 border-gray-200 h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden">
              {/* Rendu de toutes les tables selon les positions définies */}
              {Object.entries(tablePositions).map(([tableNumber, position]) => 
                renderTable(parseInt(tableNumber), position)
              )}
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

      {/* Modal création réservation directe */}
      {showNewReservationModal && selectedTableForReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-primary">
                Créer une réservation - Table {selectedTableForReservation}
              </h3>
              <button
                onClick={() => {
                  setShowNewReservationModal(false);
                  setSelectedTableForReservation(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📅 <strong>Date :</strong> {new Date(selectedDate).toLocaleDateString('fr-FR')} <br/>
                🕐 <strong>Service :</strong> {currentService === 'midi' ? 'Midi (12h00-14h30)' : 'Soir (19h00-22h30)'} <br/>
                🪑 <strong>Table :</strong> {selectedTableForReservation} (2 personnes)
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  👤 Nom du client *
                </label>
                <input
                  type="text"
                  value={newReservation.name}
                  onChange={(e) => setNewReservation({...newReservation, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nom complet"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📧 Email
                </label>
                <input
                  type="email"
                  value={newReservation.email}
                  onChange={(e) => setNewReservation({...newReservation, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="email@exemple.com (optionnel)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📞 Téléphone *
                </label>
                <input
                  type="tel"
                  value={newReservation.phone}
                  onChange={(e) => setNewReservation({...newReservation, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+41 xx xxx xx xx"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🕐 Heure *
                  </label>
                  <select
                    value={newReservation.time}
                    onChange={(e) => setNewReservation({...newReservation, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {currentService === 'midi' ? (
                      <>
                        <option value="12:00">12:00</option>
                        <option value="12:15">12:15</option>
                        <option value="12:30">12:30</option>
                        <option value="12:45">12:45</option>
                        <option value="13:00">13:00</option>
                        <option value="13:15">13:15</option>
                        <option value="13:30">13:30</option>
                        <option value="13:45">13:45</option>
                      </>
                    ) : (
                      <>
                        <option value="19:00">19:00</option>
                        <option value="19:15">19:15</option>
                        <option value="19:30">19:30</option>
                        <option value="19:45">19:45</option>
                        <option value="20:00">20:00</option>
                        <option value="20:15">20:15</option>
                        <option value="20:30">20:30</option>
                        <option value="20:45">20:45</option>
                        <option value="21:00">21:00</option>
                        <option value="21:15">21:15</option>
                        <option value="21:30">21:30</option>
                        <option value="21:45">21:45</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    👥 Personnes *
                  </label>
                  <select
                    value={newReservation.guests}
                    onChange={(e) => setNewReservation({...newReservation, guests: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💬 Demandes spéciales
                </label>
                <textarea
                  value={newReservation.message}
                  onChange={(e) => setNewReservation({...newReservation, message: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Demandes spéciales, allergies..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNewReservationModal(false);
                  setSelectedTableForReservation(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateReservation}
                disabled={!newReservation.name || !newReservation.phone || !newReservation.time || !newReservation.guests}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md transition-colors font-semibold"
              >
                ✅ Créer et assigner à la table {selectedTableForReservation}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalleTab;