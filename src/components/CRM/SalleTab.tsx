import React, { useState, useEffect } from 'react';
import { Users, MapPin, Clock, Plus, X, Edit, Trash2, Phone, Mail, User, ChevronDown, Check, Ban, Calendar, Save } from 'lucide-react';
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
  selectedDate: string;
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
  selectedDate,
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
  const [selectedDateLocal, setSelectedDateLocal] = useState(selectedDate);

  const [supabaseReservations, setSupabaseReservations] = useState<any[]>([]);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [isSelectingTables, setIsSelectingTables] = useState(false);
  const [draggedReservation, setDraggedReservation] = useState<DraggedReservation | null>(null);
  const [dragOverTable, setDragOverTable] = useState<number | null>(null);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [selectedTableForReservation, setSelectedTableForReservation] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    heure_reservation: '',
    nombre_personnes: '',
    table_assignee: ''
  });
  const [newReservation, setNewReservation] = useState({
    name: '',
    email: '',
    phone: '',
    time: '',
    guests: '',
    message: ''
  });

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
        // Table vide - proposer de créer une réservation ou voir les détails
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
      // Mise à jour optimiste de l'interface AVANT l'appel API
      // Supprimer immédiatement la réservation de l'ancienne table
      setSupabaseReservations(prev => prev.map(reservation => {
        if (reservation.id === draggedReservation.id) {
          return {
            ...reservation,
            table_assignee: targetTableNumber,
            // Nettoyer le commentaire des anciennes tables multiples
            commentaire: reservation.commentaire 
              ? reservation.commentaire.replace(/\[Tables: [^\]]+\]/g, '').trim()
              : null
          };
        }
        return reservation;
      }));
      
      // Trouver la réservation complète dans supabaseReservations
      const fullReservation = supabaseReservations.find(r => r.id === draggedReservation.id);
      if (fullReservation) {
        // Mettre à jour la table assignée
        const { updateReservationStatus } = await import('../../lib/supabase');
        await updateReservationStatus(fullReservation.id, fullReservation.statut, targetTableNumber);
        
        // Rafraîchir les données depuis la base pour confirmer
        const { getAllReservations } = await import('../../lib/supabase');
        const allReservations = await getAllReservations();
        setSupabaseReservations(allReservations);
        
        addActivity(`${draggedReservation.name} déplacé(e) de la table ${draggedReservation.sourceTable} vers la table ${targetTableNumber}`);
      }
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      // En cas d'erreur, recharger les données pour annuler la mise à jour optimiste
      try {
        const { getAllReservations } = await import('../../lib/supabase');
        const allReservations = await getAllReservations();
        setSupabaseReservations(allReservations);
      } catch (reloadError) {
        console.error('Erreur lors du rechargement:', reloadError);
      }
      alert('Erreur lors du déplacement de la réservation');
    }
    
    setDraggedReservation(null);
  };

  const handleEditReservation = (reservation: any) => {
    setEditingReservation(reservation);
    setEditForm({
      heure_reservation: reservation.heure_reservation,
      nombre_personnes: reservation.nombre_personnes.toString(),
      table_assignee: reservation.table_assignee?.toString() || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReservation) return;

    try {
      // Mettre à jour la réservation dans Supabase
      const updateData: any = {
        heure_reservation: editForm.heure_reservation,
        nombre_personnes: parseInt(editForm.nombre_personnes),
      };

      if (editForm.table_assignee) {
        updateData.table_assignee = parseInt(editForm.table_assignee);
      }

      const { updateReservationStatus } = await import('../../lib/supabase');
      await updateReservationStatus(
        editingReservation.id, 
        editingReservation.statut, 
        updateData.table_assignee,
        updateData.table_assignee ? [updateData.table_assignee] : undefined
      );

      // Rafraîchir les données
      const { getAllReservations } = await import('../../lib/supabase');
      const allReservations = await getAllReservations();
      setSupabaseReservations(allReservations);
      
      // Fermer le modal
      setShowEditModal(false);
      setEditingReservation(null);
      
      addActivity(`Réservation de ${editingReservation.nom_client} modifiée`);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification de la réservation');
    }
  };

  // Fonction pour créer une nouvelle réservation
  const handleCreateReservation = async () => {
    if (newReservation.name && newReservation.email && newReservation.phone && newReservation.time && newReservation.guests) {
      try {
        const { createReservation, sendEmail, sendSMS, getConfirmationEmailTemplate, getConfirmationSMSTemplate, formatPhoneNumber } = await import('../../lib/supabase');
        
        // Préparer les données pour Supabase
        const reservationData = {
          nom_client: newReservation.name,
          email_client: newReservation.email,
          telephone_client: newReservation.phone,
          date_reservation: selectedDateLocal,
          heure_reservation: newReservation.time,
          nombre_personnes: parseInt(newReservation.guests),
          commentaire: newReservation.message || null,
          statut: 'assignee' // Directement assignée à la table sélectionnée
        };

        // Créer la réservation dans Supabase
        const createdReservation = await createReservation(reservationData);
        
        // Assigner immédiatement la table
        if (selectedTableForReservation && createdReservation) {
          const { updateReservationStatus } = await import('../../lib/supabase');
          await updateReservationStatus(createdReservation.id, 'assignee', selectedTableForReservation);
        }
        
        // Envoyer l'email de confirmation au client
        try {
          const emailHtml = getConfirmationEmailTemplate(
            newReservation.name,
            new Date(selectedDateLocal).toLocaleDateString('fr-FR'),
            newReservation.time,
            parseInt(newReservation.guests)
          );
          await sendEmail(newReservation.email, 'Confirmation de votre réservation à La Finestra', emailHtml);
          console.log('Email de confirmation envoyé au client');
        } catch (emailError) {
          console.warn('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        }
        
        // Envoyer le SMS de confirmation si possible
        try {
          const smsMessage = getConfirmationSMSTemplate(
            newReservation.name,
            new Date(selectedDateLocal).toLocaleDateString('fr-FR'),
            newReservation.time,
            parseInt(newReservation.guests)
          );
          const formattedPhone = formatPhoneNumber(newReservation.phone);
          await sendSMS(formattedPhone, smsMessage);
          console.log('SMS de confirmation envoyé au client');
        } catch (smsError) {
          console.warn('Erreur lors de l\'envoi du SMS de confirmation:', smsError);
        }
        
        // Réinitialiser le formulaire
        setNewReservation({
          name: '',
          email: '',
          phone: '',
          time: '',
          guests: '',
          message: ''
        });
        setShowNewReservationModal(false);
        setSelectedTableForReservation(null);
        
        // Rafraîchir les réservations
        const { getAllReservations } = await import('../../lib/supabase');
        const allReservations = await getAllReservations();
        setSupabaseReservations(allReservations);
        
        addActivity(`Nouvelle réservation créée pour ${newReservation.name} - Table ${selectedTableForReservation}`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réservation:', error);
        alert('Erreur lors de l\'ajout de la réservation. Veuillez réessayer.');
      }
    }
  };

  // Filtrer les réservations du jour et du service
  const getTodayReservations = () => {
    return supabaseReservations.filter(reservation => {
      const reservationDate = reservation.date_reservation;
      const reservationService = getServiceFromTime(reservation.heure_reservation);
      const isActiveStatus = ['nouvelle', 'en_attente', 'assignee', 'arrivee'].includes(reservation.statut);
      
      return reservationDate === selectedDateLocal && 
             reservationService === currentService && 
             isActiveStatus;
    }).sort((a, b) => {
      // Trier par heure
      const [hourA, minA] = a.heure_reservation.split(':').map(Number);
      const [hourB, minB] = b.heure_reservation.split(':').map(Number);
      return (hourA * 60 + minA) - (hourB * 60 + minB);
    });
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'nouvelle': return 'text-blue-600 bg-blue-100';
      case 'en_attente': return 'text-pink-600 bg-pink-100';
      case 'assignee': return 'text-orange-600 bg-orange-100';
      case 'arrivee': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'nouvelle': return 'Nouvelle';
      case 'en_attente': return 'En attente';
      case 'assignee': return 'Assignée';
      case 'arrivee': return 'Arrivée';
      default: return statut;
    }
  };

  // Obtenir les horaires disponibles selon le service
  const getAvailableTimeSlots = () => {
    const baseTimeSlots = [
      ...(currentService === 'midi' ? 
        ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45'] :
        ['18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45']
      )
    ];
    return baseTimeSlots;
  };

  // Obtenir les tables disponibles
  const getAvailableTables = () => {
    const allTableNumbers = Array.from({length: 31}, (_, i) => i + 1);
    return allTableNumbers.filter(tableNum => {
      const tableStatus = getTableStatus(tableNum);
      return tableStatus.status === 'available';
    });
  };

  const handleDragEnd = () => {
    setDraggedReservation(null);
    setDragOverTable(null);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
        {/* Plan de salle - Colonne principale */}
        <div className="flex-1 space-y-4 sm:space-y-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          Plan de salle – Service du {currentService === 'midi' ? 'Midi' : 'Soir'} – {formatSelectedDate(selectedDateLocal)}
        </h1>

        {/* Sélecteur de date */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sélectionner la date et le service</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* Sélecteur de service */}
              <div className="bg-gray-100 rounded-full p-1 flex min-w-[140px]">
                <button
                  onClick={() => setCurrentService('midi')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex-1 text-center ${
                    currentService === 'midi'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Midi
                </button>
                <button
                  onClick={() => setCurrentService('soir')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex-1 text-center ${
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
      
        {/* Sidebar - Liste des réservations */}
        <div className="lg:w-80 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="mr-2" size={20} />
              Réservations du jour
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getTodayReservations().map((reservation) => (
                <div 
                  key={reservation.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleEditReservation(reservation)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.nom_client}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.statut)}`}>
                      {getStatusLabel(reservation.statut)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Clock className="mr-1" size={12} />
                      {reservation.heure_reservation}
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-1" size={12} />
                      {reservation.nombre_personnes} pers.
                    </div>
                    {reservation.table_assignee && (
                      <div className="flex items-center">
                        <MapPin className="mr-1" size={12} />
                        Table {reservation.table_assignee}
                        {reservation.commentaire && reservation.commentaire.includes('[Tables:') && (
                          (() => {
                            const match = reservation.commentaire.match(/\[Tables: ([^\]]+)\]/);
                            return match ? ` (${match[1]})` : '';
                          })()
                        )}
                      </div>
                    )}
                    {reservation.telephone_client && (
                      <div className="flex items-center">
                        <Phone className="mr-1" size={12} />
                        <span className="truncate">{reservation.telephone_client}</span>
                      </div>
                    )}
                  </div>
                  
                  {reservation.commentaire && !reservation.commentaire.includes('[Tables:') && (
                    <div className="mt-2 text-xs text-gray-500 italic">
                      "{reservation.commentaire}"
                    </div>
                  )}
                  
                  {/* Actions rapides */}
                  <div className="mt-2 flex space-x-2">
                    {reservation.statut === 'en_attente' && (
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation);
                        }}
                        className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-2 py-1 rounded"
                      >
                        Assigner
                      </button>
                    )}
                    {reservation.statut === 'assignee' && (
                      <button
                        onClick={async () => {
                          try {
                            const { updateReservationStatus } = await import('../../lib/supabase');
                            await updateReservationStatus(reservation.id, 'arrivee');
                            const { getAllReservations } = await import('../../lib/supabase');
                            const allReservations = await getAllReservations();
                            setSupabaseReservations(allReservations);
                            addActivity(`Client ${reservation.nom_client} marqué comme arrivé`);
                          } catch (error) {
                            console.error('Erreur:', error);
                          }
                        }}
                        className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded"
                      >
                        Arrivé
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {getTodayReservations().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto mb-2" size={32} />
                  <p className="text-sm">Aucune réservation pour ce service</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Statistiques rapides */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Statistiques</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total réservations:</span>
                <span className="font-medium">{getTodayReservations().length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tables occupées:</span>
                <span className="font-medium">
                  {supabaseReservations.filter(r => 
                    r.date_reservation === selectedDateLocal && 
                    getServiceFromTime(r.heure_reservation) === currentService &&
                    ['assignee', 'arrivee'].includes(r.statut)
                  ).length} / 25
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Clients présents:</span>
                <span className="font-medium">
                  {supabaseReservations.filter(r => 
                    r.date_reservation === selectedDateLocal && 
                    getServiceFromTime(r.heure_reservation) === currentService &&
                    r.statut === 'arrivee'
                  ).reduce((sum, r) => sum + r.nombre_personnes, 0)}
                </span>
              </div>
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
                
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setSelectedTableForReservation(selectedTable.number);
                      setShowTableModal(false);
                      setShowNewReservationModal(true);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm"
                  >
                    Créer une nouvelle réservation
                  </button>
                  
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm"
                  >
                    Assigner {selectedReservation.nom_client || selectedReservation.name} à cette table
                  </button>
                )}
                </div>
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

      {/* Modal nouvelle réservation */}
      {showNewReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nouvelle réservation - Table {selectedTableForReservation}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-gray-500 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="email"
                    value={newReservation.email}
                    onChange={(e) => setNewReservation({...newReservation, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                  <select
                    value={newReservation.time}
                    onChange={(e) => setNewReservation({...newReservation, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir</option>
                    {currentService === 'midi' ? 
                      !newReservation.name.trim() || 
                      !newReservation.phone.trim() || 
                      !newReservation.date || 
                      !newReservation.time || 
                      !newReservation.guests
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de personnes</label>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Messages ou demandes spéciales</label>
                <textarea
                  value={newReservation.message}
                  onChange={(e) => setNewReservation({...newReservation, message: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Allergies, demandes spéciales, occasion particulière..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNewReservationModal(false);
                  setSelectedTableForReservation(null);
                  setNewReservation({
                    name: '',
                    email: '',
                    phone: '',
                    time: '',
                    guests: '',
                    message: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateReservation}
                disabled={!newReservation.name || !newReservation.email || !newReservation.phone || !newReservation.time || !newReservation.guests}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white rounded-md transition-colors"
              >
                Créer la réservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification de réservation */}
      {showEditModal && editingReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary">
                Modifier la réservation
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Informations client (lecture seule) */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Client</h4>
                <p className="text-sm text-gray-700">{editingReservation.nom_client}</p>
                <p className="text-sm text-gray-600">{editingReservation.email_client}</p>
                <p className="text-sm text-gray-600">{editingReservation.telephone_client}</p>
                <p className="text-sm text-gray-600">
                  {new Date(editingReservation.date_reservation).toLocaleDateString('fr-FR')}
                </p>
              </div>

              {/* Heure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de réservation
                </label>
                <select
                  value={editForm.heure_reservation}
                  onChange={(e) => setEditForm({...editForm, heure_reservation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {getAvailableTimeSlots().map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Nombre de personnes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de personnes
                </label>
                <select
                  value={editForm.nombre_personnes}
                  onChange={(e) => setEditForm({...editForm, nombre_personnes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} personne{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Table assignée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table assignée
                </label>
                <select
                  value={editForm.table_assignee}
                  onChange={(e) => setEditForm({...editForm, table_assignee: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Aucune table assignée</option>
                  {getAvailableTables().map(tableNum => (
                    <option key={tableNum} value={tableNum}>Table {tableNum}</option>
                  ))}
                  {/* Inclure la table actuelle même si elle n'est pas disponible */}
                  {editingReservation.table_assignee && 
                   !getAvailableTables().includes(editingReservation.table_assignee) && (
                    <option value={editingReservation.table_assignee}>
                      Table {editingReservation.table_assignee} (actuelle)
                    </option>
                  )}
                </select>
              </div>

              {/* Statut actuel */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Statut actuel :</strong> {
                    editingReservation.statut === 'assignee' ? 'Assignée' :
                    editingReservation.statut === 'arrivee' ? 'Arrivée' :
                    editingReservation.statut === 'en_attente' ? 'En attente' :
                    editingReservation.statut
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Save size={16} />
                <span>Sauvegarder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalleTab;