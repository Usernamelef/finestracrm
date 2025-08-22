import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Clock, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { getAllReservations, type Reservation } from '../../lib/supabase';

interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface Activity {
  id: string;
  action: string;
  timestamp: string;
}

interface DashboardTabProps {
  currentService: 'midi' | 'soir';
  selectedDate: string;
  handleDateChange: (date: string) => void;
  formatSelectedDate: (dateString: string) => string;
  formatDateTime: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  addActivity: (action: string) => void;
  activities: Activity[];
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  showNewNoteModal: boolean;
  setShowNewNoteModal: React.Dispatch<React.SetStateAction<boolean>>;
  newNote: { author: string; content: string };
  setNewNote: React.Dispatch<React.SetStateAction<{ author: string; content: string }>>;
  handleAddNote: () => void;
  handleDeleteNote: (noteId: string) => void;
  getStats: () => {
    totalReservations: number;
    occupiedTables: number;
    totalGuests: number;
    pendingReservations: number;
  };
  getReservationsByStatus: (status: string) => any[];
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  currentService,
  selectedDate,
  handleDateChange,
  formatSelectedDate,
  formatDateTime,
  formatTime,
  addActivity,
  activities,
  notes,
  setNotes,
  showNewNoteModal,
  setShowNewNoteModal,
  newNote,
  setNewNote,
  handleAddNote,
  handleDeleteNote
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Calculer les statistiques en temps réel
  const getStats = () => {
    // Filtrer les réservations pour la date et le service sélectionnés
    const todayReservations = reservations.filter(reservation => {
      const reservationDate = reservation.date_reservation;
      const reservationService = getServiceFromTime(reservation.heure_reservation);
      return reservationDate === selectedDate && reservationService === currentService;
    });

    // Total des réservations pour ce service/date
    const totalReservations = todayReservations.length;

    // Tables occupées (réservations assignées ou arrivées)
    const occupiedTables = todayReservations.filter(reservation => 
      reservation.statut === 'assignee' || reservation.statut === 'arrivee'
    ).length;

    // Clients présents (réservations arrivées)
    const totalGuests = todayReservations
      .filter(reservation => reservation.statut === 'arrivee')
      .reduce((sum, reservation) => sum + reservation.nombre_personnes, 0);

    // Réservations en attente
    const pendingReservations = todayReservations.filter(reservation => 
      reservation.statut === 'nouvelle' || reservation.statut === 'en_attente'
    ).length;

    return {
      totalReservations,
      occupiedTables,
      totalGuests,
      pendingReservations
    };
  };

  // Obtenir les réservations par statut pour ce service/date
  const getReservationsByStatus = (status: string) => {
    const statusMap: { [key: string]: string[] } = {
      'pending': ['nouvelle', 'en_attente'],
      'assigned': ['assignee'],
      'arrived': ['arrivee']
    };

    const targetStatuses = statusMap[status] || [status];

    return reservations.filter(reservation => {
      const reservationDate = reservation.date_reservation;
      const reservationService = getServiceFromTime(reservation.heure_reservation);
      const isCorrectDateAndService = reservationDate === selectedDate && reservationService === currentService;
      const hasCorrectStatus = targetStatuses.includes(reservation.statut);
      
      return isCorrectDateAndService && hasCorrectStatus;
    });
  };

  // Statistiques globales (tous services/dates)
  const getGlobalStats = () => {
    const totalClients = new Set(reservations.map(r => r.email_client)).size;
    const totalReservationsEver = reservations.length;
    const completedReservations = reservations.filter(r => r.statut === 'terminee').length;
    const cancelledReservations = reservations.filter(r => r.statut === 'annulee').length;

    return {
      totalClients,
      totalReservationsEver,
      completedReservations,
      cancelledReservations
    };
  };

  const stats = getStats();
  const globalStats = getGlobalStats();

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Chargement des données...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Gestion des réservations – La Finestra
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Tableau de bord privé réservé au personnel</p>
        
        {/* Bannière de service avec sélecteur de date */}
        <div className="mt-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-primary via-primary to-accent">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              Service du {currentService === 'midi' ? 'Midi' : 'Soir'} - {formatSelectedDate(selectedDate)}
            </h2>
            <div className="flex items-center space-x-2">
              <Calendar className="text-white" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-2 sm:px-3 py-1 text-sm sm:text-base rounded-md text-primary font-medium focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques du service actuel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Calendar className="text-primary mr-2 sm:mr-3" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total réservations</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalReservations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <MapPin className="text-primary mr-2 sm:mr-3" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Tables occupées</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.occupiedTables} / 25</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="text-primary mr-2 sm:mr-3" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Clients présents</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalGuests}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="text-primary mr-2 sm:mr-3" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">En attente</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pendingReservations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Statistiques globales</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{globalStats.totalClients}</p>
            <p className="text-xs sm:text-sm text-gray-600">Clients uniques</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{globalStats.totalReservationsEver}</p>
            <p className="text-xs sm:text-sm text-gray-600">Total réservations</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-green-600">{globalStats.completedReservations}</p>
            <p className="text-xs sm:text-sm text-gray-600">Terminées</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-2xl font-bold text-red-600">{globalStats.cancelledReservations}</p>
            <p className="text-xs sm:text-sm text-gray-600">Annulées</p>
          </div>
        </div>
      </div>

      {/* Notes importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="text-yellow-600 mr-2" size={20} />
          Notes importantes
        </h3>
        
        {/* Affichage des notes existantes */}
        <div className="space-y-3 mb-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white p-4 rounded-md border border-yellow-200">
              <p className="text-sm sm:text-base text-gray-800 mb-2">{note.content}</p>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm text-gray-600">
                <span>Par {note.author} • {formatDateTime(note.createdAt)}</span>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-red-500 hover:text-red-700 transition-colors mt-1 sm:mt-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bouton ajouter une note */}
        <button
          onClick={() => setShowNewNoteModal(true)}
          className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm sm:text-base"
        >
          <Plus size={16} />
          <span>Ajouter une note</span>
        </button>
      </div>

      {/* Résumé des réservations du service actuel */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Résumé des réservations - Service du {currentService}
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
            <h4 className="text-sm sm:text-base font-medium text-pink-800 mb-2">En attente</h4>
            <p className="text-xl sm:text-2xl font-bold text-pink-600">
              {getReservationsByStatus('pending').length}
            </p>
            <div className="mt-2 space-y-1">
              {getReservationsByStatus('pending').slice(0, 3).map((reservation) => (
                <div key={reservation.id} className="text-xs sm:text-sm text-pink-700">
                  {reservation.nom_client} - {reservation.heure_reservation}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="text-sm sm:text-base font-medium text-red-800 mb-2">Assignées</h4>
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {getReservationsByStatus('assigned').length}
            </p>
            <div className="mt-2 space-y-1">
              {getReservationsByStatus('assigned').slice(0, 3).map((reservation) => (
                <div key={reservation.id} className="text-xs sm:text-sm text-red-700">
                  {reservation.nom_client} - Table {reservation.table_assignee}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm sm:text-base font-medium text-purple-800 mb-2">Arrivées</h4>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">
              {getReservationsByStatus('arrived').length}
            </p>
            <div className="mt-2 space-y-1">
              {getReservationsByStatus('arrived').slice(0, 3).map((reservation) => (
                <div key={reservation.id} className="text-xs sm:text-sm text-purple-700">
                  {reservation.nom_client} - Table {reservation.table_assignee}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prochaines réservations */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Prochaines réservations aujourd'hui
        </h3>
        
        <div className="space-y-3">
          {reservations
            .filter(reservation => {
              const reservationDate = reservation.date_reservation;
              const reservationService = getServiceFromTime(reservation.heure_reservation);
              return reservationDate === selectedDate && 
                     reservationService === currentService &&
                     ['nouvelle', 'en_attente', 'assignee'].includes(reservation.statut);
            })
            .sort((a, b) => {
              const [hourA, minA] = a.heure_reservation.split(':').map(Number);
              const [hourB, minB] = b.heure_reservation.split(':').map(Number);
              return (hourA * 60 + minA) - (hourB * 60 + minB);
            })
            .slice(0, 5)
            .map((reservation) => (
            <div key={reservation.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                <div className="text-sm font-medium text-gray-900 min-w-0">
                  {reservation.heure_reservation}
                </div>
                <div className="text-sm text-gray-700 min-w-0">
                  {reservation.nom_client} ({reservation.nombre_personnes}p)
                </div>
                {reservation.table_assignee && (
                  <div className="text-xs text-gray-500 min-w-0">
                    Table {reservation.table_assignee}
                  </div>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                reservation.statut === 'nouvelle' ? 'bg-blue-100 text-blue-800' :
                reservation.statut === 'en_attente' ? 'bg-pink-100 text-pink-800' :
                reservation.statut === 'assignee' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {reservation.statut === 'nouvelle' ? 'Nouvelle' :
                 reservation.statut === 'en_attente' ? 'En attente' :
                 reservation.statut === 'assignee' ? 'Assignée' : reservation.statut}
              </div>
            </div>
          ))}
          {reservations.filter(reservation => {
            const reservationDate = reservation.date_reservation;
            const reservationService = getServiceFromTime(reservation.heure_reservation);
            return reservationDate === selectedDate && 
                   reservationService === currentService &&
                   ['nouvelle', 'en_attente', 'assignee'].includes(reservation.statut);
          }).length === 0 && (
            <p className="text-gray-500 text-center py-4">Aucune réservation à venir pour ce service</p>
          )}
        </div>
      </div>

      {/* Dernières activités */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Dernières activités
        </h3>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 font-medium min-w-0">
                {formatTime(activity.timestamp)}
              </div>
              <div className="text-xs sm:text-sm text-gray-800 min-w-0">
                {activity.action}
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;