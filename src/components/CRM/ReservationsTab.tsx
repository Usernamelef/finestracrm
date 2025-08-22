import React, { useState, useEffect } from 'react';
import { Plus, Check, Ban } from 'lucide-react';
import { 
  getReservationsByStatus, 
  updateReservationStatus, 
  sendEmail, 
  sendSMS,
  getConfirmationEmailTemplate, 
  getCancellationEmailTemplate,
  getConfirmationSMSTemplate,
  getCancellationSMSTemplate,
  formatPhoneNumber,
  type Reservation 
} from '../../lib/supabase';

interface ReservationsTabProps {
  currentService: 'midi' | 'soir';
  selectedDate: string;
  addActivity: (action: string) => void;
  showNewReservationModal: boolean;
  setShowNewReservationModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedReservation: any;
  setSelectedReservation: React.Dispatch<React.SetStateAction<any>>;
  handleAssignTable: (reservation: Reservation, tableNumbers: number[]) => void;
  handleMarkArrived: (reservationId: string) => void;
  handleCompleteReservation: (reservationId: string) => void;
  getFilteredReservations: () => any[];
  getReservationsByStatusLocal: (status: string) => any[];
  onNewReservation?: () => void;
  onRefreshNeeded: (refreshFn: () => void) => void;
}

const ReservationsTab: React.FC<ReservationsTabProps> = ({
  currentService,
  selectedDate,
  addActivity,
  showNewReservationModal,
  setShowNewReservationModal,
  selectedReservation,
  setSelectedReservation,
  handleAssignTable,
  handleMarkArrived,
  handleCompleteReservation,
  getFilteredReservations,
  getReservationsByStatusLocal,
  onNewReservation,
  onRefreshNeeded
}) => {
  const [reservations, setReservations] = useState<{
    nouvelles: Reservation[];
    en_attente: Reservation[];
    assignee: Reservation[];
    arrivee: Reservation[];
    loading: boolean;
    error: string | null;
  }>({
    nouvelles: [],
    en_attente: [],
    assignee: [],
    arrivee: [],
    loading: true,
    error: null,
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);

  // Charger les réservations depuis Supabase
  const fetchAllReservations = async () => {
    setReservations(prev => ({ ...prev, loading: true, error: null }));
    try {
      const nouvelles = await getReservationsByStatus('nouvelle');
      const en_attente = await getReservationsByStatus('en_attente');
      const assignee = await getReservationsByStatus('assignee');
      const arrivee = await getReservationsByStatus('arrivee');
      
      setReservations({
        nouvelles,
        en_attente,
        assignee,
        arrivee,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Erreur lors du chargement des réservations:", err);
      setReservations(prev => ({ ...prev, loading: false, error: "Erreur lors du chargement des réservations." }));
    }
  };

  useEffect(() => {
    fetchAllReservations();
    
    // Passer la fonction de rafraîchissement au parent
    onRefreshNeeded(fetchAllReservations);
    
    // Polling pour vérifier les nouvelles réservations toutes les 30 secondes
    const interval = setInterval(async () => {
      try {
        const nouvelles = await getReservationsByStatus('nouvelle');
        const currentCount = reservations.nouvelles.length;
        
        if (nouvelles.length > currentCount) {
          // Il y a de nouvelles réservations
          if (onNewReservation) {
            onNewReservation();
          }
          fetchAllReservations();
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des nouvelles réservations:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [reservations.nouvelles.length, onNewReservation, onRefreshNeeded]);

  // Fonction pour rafraîchir manuellement
  const refreshReservations = () => {
    fetchAllReservations();
  };

  // Ancienne fonction fetchAllReservations supprimée et remplacée par la nouvelle ci-dessus
  /*
  useEffect(() => {
    const fetchAllReservations = async () => {
      setReservations(prev => ({ ...prev, loading: true, error: null }));
      try {
        const nouvelles = await getReservationsByStatus('nouvelle');
        const en_attente = await getReservationsByStatus('en_attente');
        const assignee = await getReservationsByStatus('assignee');
        const arrivee = await getReservationsByStatus('arrivee');
        
        setReservations({
          nouvelles,
          en_attente,
          assignee,
          arrivee,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Erreur lors du chargement des réservations:", err);
        setReservations(prev => ({ ...prev, loading: false, error: "Erreur lors du chargement des réservations." }));
      }
    };

    fetchAllReservations();
  }, []);
  */

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

  // Fonction pour filtrer les réservations assignées et arrivées par date et service
  const filterReservationsByDateAndService = (reservationsList: Reservation[]) => {
    return reservationsList.filter(reservation => {
      const reservationDate = reservation.date_reservation;
      const reservationService = getServiceFromTime(reservation.heure_reservation);
      
      return reservationDate === selectedDate && reservationService === currentService;
    });
  };

  // Fonction pour filtrer les réservations assignées et arrivées par date et service
  const getFilteredAssignedReservations = () => {
    return filterReservationsByDateAndService(reservations.assignee);
  };

  const getFilteredArrivedReservations = () => {
    return filterReservationsByDateAndService(reservations.arrivee);
  };

  const confirmReservation = async (reservation: Reservation) => {
    try {
      await updateReservationStatus(reservation.id, 'en_attente');
      
      // Envoyer l'email de confirmation
      const emailHtml = getConfirmationEmailTemplate(
        reservation.nom_client,
        new Date(reservation.date_reservation).toLocaleDateString('fr-FR'),
        reservation.heure_reservation,
        reservation.nombre_personnes
      );
      await sendEmail(reservation.email_client, 'Confirmation de votre réservation à La Finestra', emailHtml);

      // Envoyer le SMS de confirmation si le téléphone est valide
      if (reservation.telephone_client && reservation.telephone_client !== 'N/A') {
        try {
          const smsMessage = getConfirmationSMSTemplate(
            reservation.nom_client,
            new Date(reservation.date_reservation).toLocaleDateString('fr-FR'),
            reservation.heure_reservation,
            reservation.nombre_personnes
          );
          const formattedPhone = formatPhoneNumber(reservation.telephone_client);
          await sendSMS(formattedPhone, smsMessage);
          console.log('SMS de confirmation envoyé avec succès');
        } catch (smsError) {
          console.error('Erreur lors de l\'envoi du SMS:', smsError);
          // SMS désactivé temporairement - ne pas faire échouer la confirmation
        }
      }

      // Rafraîchir toutes les réservations
      await fetchAllReservations();

      addActivity(`Réservation de ${reservation.nom_client} confirmée.`);
    } catch (error) {
      console.error("Erreur lors de la confirmation de réservation:", error);
      alert("Erreur lors de la confirmation de réservation. Veuillez réessayer.");
    }
  };

  const cancelReservation = async (reservation: Reservation) => {
    try {
      await updateReservationStatus(reservation.id, 'annulee');
      
      // Envoyer l'email d'annulation
      const emailHtml = getCancellationEmailTemplate(
        reservation.nom_client,
        new Date(reservation.date_reservation).toLocaleDateString('fr-FR'),
        reservation.heure_reservation
      );
      await sendEmail(reservation.email_client, 'Annulation de votre réservation à La Finestra', emailHtml);

      // Envoyer le SMS d'annulation si le téléphone est valide
      if (reservation.telephone_client && reservation.telephone_client !== 'N/A') {
        try {
          const smsMessage = getCancellationSMSTemplate(
            reservation.nom_client,
            new Date(reservation.date_reservation).toLocaleDateString('fr-FR'),
            reservation.heure_reservation
          );
          const formattedPhone = formatPhoneNumber(reservation.telephone_client);
          await sendSMS(formattedPhone, smsMessage);
          console.log('SMS d\'annulation envoyé avec succès');
        } catch (smsError) {
          console.warn('Erreur lors de l\'envoi du SMS:', smsError);
          // SMS désactivé temporairement - ne pas faire échouer l'annulation
        }
      }

      // Rafraîchir toutes les réservations
      await fetchAllReservations();

      addActivity(`Réservation de ${reservation.nom_client} annulée.`);
      setShowCancelModal(false);
      setReservationToCancel(null);
    } catch (error) {
      console.error("Erreur lors de l'annulation de réservation:", error);
      alert("Erreur lors de l'annulation de réservation. Veuillez réessayer.");
    }
  };

  // Fonction pour assigner une table à une réservation en attente
  const assignTableToReservation = async (reservation: Reservation) => {
    try {
      await updateReservationStatus(reservation.id, 'assignee');
      await fetchAllReservations();
      addActivity(`Table assignée à ${reservation.nom_client}.`);
    } catch (error) {
      console.error("Erreur lors de l'assignation de table:", error);
      alert("Erreur lors de l'assignation de table. Veuillez réessayer.");
    }
  };
  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Réservations - Service du {currentService}
          </h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={refreshReservations}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Actualiser
            </button>
            <button
              onClick={() => setShowNewReservationModal(true)}
              className="bg-primary hover:bg-primary/90 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
            >
              <Plus size={20} />
              <span>Ajouter une réservation</span>
            </button>
          </div>
        </div>

        {/* Section Nouvelles réservations */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-primary mb-4 flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            Nouvelles réservations ({reservations.nouvelles.length})
          </h3>
          {reservations.loading ? (
            <p className="text-gray-500 text-center py-4">Chargement des nouvelles réservations...</p>
          ) : reservations.error ? (
            <p className="text-red-500 text-center py-4">{reservations.error}</p>
          ) : (
            <div className="space-y-4">
              {reservations.nouvelles.map((reservation) => (
                <div key={reservation.id} className="border border-blue-200 rounded-lg p-3 sm:p-4 bg-blue-50">
                  <div className="flex flex-col lg:flex-row justify-between items-start space-y-3 lg:space-y-0">
                    <div className="flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-blue-900">{reservation.nom_client}</h4>
                      <p className="text-xs sm:text-sm text-blue-800">
                        {new Date(reservation.date_reservation).toLocaleDateString('fr-FR')} à {reservation.heure_reservation} • {reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs sm:text-sm text-blue-700 break-all">{reservation.email_client} • {reservation.telephone_client}</p>
                      {reservation.commentaire && (
                        <p className="text-xs sm:text-sm text-blue-600 mt-1 italic">"{reservation.commentaire}"</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
                      <button
                        onClick={() => confirmReservation(reservation)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs sm:text-sm flex items-center justify-center space-x-1"
                      >
                        <Check size={14} />
                        <span>Confirmer</span>
                      </button>
                      <button
                        onClick={() => {
                          setReservationToCancel(reservation);
                          setShowCancelModal(true);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm flex items-center justify-center space-x-1"
                      >
                        <Ban size={14} />
                        <span>Annuler</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {reservations.nouvelles.length === 0 && (
                <p className="text-gray-500 text-center py-4">Aucune nouvelle réservation</p>
              )}
            </div>
          )}
        </div>

        {/* Section Réservations en attente */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-primary mb-4 flex items-center">
            <div className="w-3 h-3 bg-pink-500 rounded-full mr-3"></div>
            En attente d'assignation ({reservations.en_attente.length})
          </h3>
          <div className="space-y-4">
            {reservations.en_attente
              .sort((a, b) => {
                // Tri par date puis par heure
                const dateA = new Date(a.date_reservation);
                const dateB = new Date(b.date_reservation);
                if (dateA.getTime() !== dateB.getTime()) {
                  return dateA.getTime() - dateB.getTime();
                }
                // Si même date, trier par heure
                const [hourA, minA] = a.heure_reservation.split(':').map(Number);
                const [hourB, minB] = b.heure_reservation.split(':').map(Number);
                return (hourA * 60 + minA) - (hourB * 60 + minB);
              })
              .map((reservation) => (
                <div key={reservation.id} className="border border-pink-200 rounded-lg p-3 sm:p-4 bg-pink-50">
                  <div className="flex flex-col lg:flex-row justify-between items-start space-y-3 lg:space-y-0">
                    <div className="flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-pink-900">{reservation.nom_client}</h4>
                      <p className="text-xs sm:text-sm text-pink-800">
                        {new Date(reservation.date_reservation).toLocaleDateString('fr-FR')} à {reservation.heure_reservation} • {reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? 's' : ''}
                      </p>
                      <div className="text-xs sm:text-sm text-pink-700 break-all">
                        {reservation.email_client && (
                          <span>{reservation.email_client} • </span>
                        )}
                        <span>{reservation.telephone_client}</span>
                      </div>
                      {reservation.commentaire && (
                        <p className="text-xs sm:text-sm text-pink-600 mt-1 italic">"{reservation.commentaire}"</p>
                      )}
                    </div>
                    <div className="w-full lg:w-auto">
                      <button
                        onClick={() => handleAssignTable(reservation, [], false)}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded text-xs sm:text-sm"
                      >
                        Assigner une table
                      </button>
                      <button
                        onClick={() => {
                          setReservationToCancel(reservation);
                          setShowCancelModal(true);
                        }}
                        className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm flex items-center justify-center space-x-1"
                      >
                        <Ban size={14} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            {reservations.en_attente.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune réservation en attente</p>
            )}
          </div>
        </div>
        {/* Interface en 3 colonnes avec opacités graduées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Colonne Assignée */}
          <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
            <h2 className="text-base sm:text-lg font-semibold text-red-800 mb-4 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Assignée ({filterReservationsByDateAndService(reservations.assignee).length})
            </h2>
            
            <div className="space-y-3">
              {filterReservationsByDateAndService(reservations.assignee)
                .sort((a, b) => {
                  // Tri par date puis par heure
                  const dateA = new Date(a.date_reservation);
                  const dateB = new Date(b.date_reservation);
                  if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                  }
                  // Si même date, trier par heure
                  const [hourA, minA] = a.heure_reservation.split(':').map(Number);
                  const [hourB, minB] = b.heure_reservation.split(':').map(Number);
                  return (hourA * 60 + minA) - (hourB * 60 + minB);
                })
                .map((reservation) => (
                <div key={reservation.id} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2 space-y-1 sm:space-y-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">{reservation.nom_client}</h3>
                    <span className="text-xs sm:text-sm text-gray-600">{reservation.heure_reservation}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    {new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    {reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? 's' : ''}
                  </p>
                  {reservation.email_client && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 break-all">{reservation.email_client}</p>
                  )}
                  {reservation.table_assignee && (
                    <p className="text-xs sm:text-sm font-medium text-red-700 mb-3">
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
                    </p>
                  )}
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        try {
                          await updateReservationStatus(reservation.id, 'arrivee');
                          await fetchAllReservations();
                          addActivity(`Client ${reservation.nom_client} marqué comme arrivé.`);
                        } catch (error) {
                          console.error("Erreur:", error);
                          alert("Erreur lors du marquage comme arrivé.");
                        }
                      }}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm transition-colors"
                    >
                      Marquer comme arrivé
                    </button>
                    <button
                      onClick={() => handleAssignTable(reservation, [], false)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs sm:text-sm transition-colors"
                    >
                      Modifier l'assignation
                    </button>
                  </div>
                </div>
              ))}
              {filterReservationsByDateAndService(reservations.assignee).length === 0 && (
                <p className="text-gray-500 text-center py-4">Aucune réservation assignée pour ce service</p>
              )}
            </div>
          </div>

          {/* Colonne Arrivé */}
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
            <h2 className="text-base sm:text-lg font-semibold text-purple-800 mb-4 flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              Arrivé ({filterReservationsByDateAndService(reservations.arrivee).length})
            </h2>
            
            <div className="space-y-3">
              {filterReservationsByDateAndService(reservations.arrivee)
                .sort((a, b) => {
                  // Tri par date puis par heure
                  const dateA = new Date(a.date_reservation);
                  const dateB = new Date(b.date_reservation);
                  if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                  }
                  // Si même date, trier par heure
                  const [hourA, minA] = a.heure_reservation.split(':').map(Number);
                  const [hourB, minB] = b.heure_reservation.split(':').map(Number);
                  return (hourA * 60 + minA) - (hourB * 60 + minB);
                })
                .map((reservation) => (
                <div key={reservation.id} className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2 space-y-1 sm:space-y-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">{reservation.nom_client}</h3>
                    <span className="text-xs sm:text-sm text-gray-600">{reservation.heure_reservation}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    {new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    {reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? 's' : ''}
                  </p>
                  {reservation.email_client && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 break-all">{reservation.email_client}</p>
                  )}
                  {reservation.table_assignee && (
                    <p className="text-xs sm:text-sm font-medium text-purple-700 mb-3">
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
                    </p>
                  )}
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        try {
                          await updateReservationStatus(reservation.id, 'terminee');
                          await fetchAllReservations();
                          addActivity(`Réservation de ${reservation.nom_client} terminée.`);
                        } catch (error) {
                          console.error("Erreur:", error);
                          alert("Erreur lors de la finalisation.");
                        }
                      }}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs sm:text-sm transition-colors"
                    >
                      Terminer
                    </button>
                    <button
                      onClick={() => handleAssignTable(reservation, [], false)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs sm:text-sm transition-colors"
                    >
                      Modifier l'assignation
                    </button>
                  </div>
                </div>
              ))}
              {filterReservationsByDateAndService(reservations.arrivee).length === 0 && (
                <p className="text-gray-500 text-center py-4">Aucune réservation arrivée pour ce service</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal de confirmation d'annulation */}
      {showCancelModal && reservationToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-primary mb-4">Confirmer l'annulation</h3>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir annuler la réservation de <strong>{reservationToCancel.nom_client}</strong> 
              du {new Date(reservationToCancel.date_reservation).toLocaleDateString('fr-FR')} à {reservationToCancel.heure_reservation} ?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Un email d'annulation sera automatiquement envoyé au client.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setReservationToCancel(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() => cancelReservation(reservationToCancel)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReservationsTab;