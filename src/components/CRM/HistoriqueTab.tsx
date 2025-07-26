import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download, Calendar, Users, MapPin, Clock, Mail, Phone } from 'lucide-react';
import { getAllReservations, type Reservation } from '../../lib/supabase';

const HistoriqueTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
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
        setError('Erreur lors du chargement de l\'historique');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Fonction pour filtrer et trier les réservations
  const getFilteredAndSortedReservations = () => {
    let filtered = [...reservations];

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.nom_client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.email_client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.telephone_client.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.statut === statusFilter);
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(reservation => {
            const resDate = new Date(reservation.date_reservation);
            resDate.setHours(0, 0, 0, 0);
            return resDate.getTime() === filterDate.getTime();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(reservation => 
            new Date(reservation.date_reservation) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(reservation => 
            new Date(reservation.date_reservation) >= filterDate
          );
          break;
      }
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date_reservation).getTime() - new Date(a.date_reservation).getTime();
        case 'date_asc':
          return new Date(a.date_reservation).getTime() - new Date(b.date_reservation).getTime();
        case 'name':
          return a.nom_client.localeCompare(b.nom_client);
        case 'status':
          return a.statut.localeCompare(b.statut);
        case 'guests':
          return b.nombre_personnes - a.nombre_personnes;
        case 'created':
          return new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'nouvelle': return 'text-blue-600 bg-blue-100';
      case 'en_attente': return 'text-pink-600 bg-pink-100';
      case 'assignee': return 'text-orange-600 bg-orange-100';
      case 'arrivee': return 'text-purple-600 bg-purple-100';
      case 'terminee': return 'text-green-600 bg-green-100';
      case 'annulee': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'nouvelle': return 'Nouvelle';
      case 'en_attente': return 'En attente';
      case 'assignee': return 'Assignée';
      case 'arrivee': return 'Arrivée';
      case 'terminee': return 'Terminée';
      case 'annulee': return 'Annulée';
      default: return statut;
    }
  };

  const getServiceFromTime = (heure: string) => {
    const [hour] = heure.split(':').map(Number);
    return hour <= 16 ? 'Midi' : 'Soir';
  };

  const exportToCSV = () => {
    const filtered = getFilteredAndSortedReservations();
    const csvContent = [
      ['Date', 'Heure', 'Service', 'Client', 'Email', 'Téléphone', 'Personnes', 'Table', 'Statut', 'Commentaire', 'Créé le'].join(','),
      ...filtered.map(reservation => [
        formatDate(reservation.date_reservation),
        reservation.heure_reservation,
        getServiceFromTime(reservation.heure_reservation),
        reservation.nom_client,
        reservation.email_client,
        reservation.telephone_client,
        reservation.nombre_personnes,
        reservation.table_assignee || '',
        getStatusLabel(reservation.statut),
        reservation.commentaire || '',
        formatDateTime(reservation.date_creation)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historique_reservations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Historique des réservations</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Chargement de l'historique...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Historique des réservations</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const filteredReservations = getFilteredAndSortedReservations();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
          <History className="mr-3" size={32} />
          Historique des réservations
        </h1>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Download size={20} />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex items-center">
            <Calendar className="text-primary mr-2 sm:mr-3" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{reservations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Terminées</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {reservations.filter(r => r.statut === 'terminee').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Annulées</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">
                {reservations.filter(r => r.statut === 'annulee').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Actives</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">
                {reservations.filter(r => ['assignee', 'arrivee'].includes(r.statut)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex items-center">
            <Users className="text-primary mr-2 sm:mr-3" size={20} />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Clients uniques</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {new Set(reservations.map(r => r.email_client)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <Search className="inline mr-1" size={16} />
              Recherche
            </label>
            <input
              type="text"
              placeholder="Nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline mr-1" size={16} />
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="nouvelle">Nouvelle</option>
              <option value="en_attente">En attente</option>
              <option value="assignee">Assignée</option>
              <option value="arrivee">Arrivée</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              Période
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="date_desc">Date (récent → ancien)</option>
              <option value="date_asc">Date (ancien → récent)</option>
              <option value="name">Nom (A → Z)</option>
              <option value="status">Statut</option>
              <option value="guests">Nombre de personnes</option>
              <option value="created">Date de création</option>
            </select>
          </div>
          
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
                setSortBy('date_desc');
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Réinitialiser
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-xs sm:text-sm text-gray-600">
          {filteredReservations.length} réservation{filteredReservations.length > 1 ? 's' : ''} trouvée{filteredReservations.length > 1 ? 's' : ''} sur {reservations.length} au total
        </div>
      </div>

      {/* Liste des réservations */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Version mobile - cartes */}
        <div className="block lg:hidden">
          <div className="p-4 space-y-4">
            {filteredReservations.map((reservation) => (
              <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {reservation.nom_client.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.nom_client}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(reservation.date_reservation)} • {reservation.heure_reservation}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.statut)}`}>
                    {getStatusLabel(reservation.statut)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <Mail className="mr-1" size={12} />
                    <span className="truncate">{reservation.email_client}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-1" size={12} />
                    <span>{reservation.nombre_personnes}p</span>
                  </div>
                  {reservation.telephone_client && reservation.telephone_client !== 'N/A' && (
                    <div className="flex items-center">
                      <Phone className="mr-1" size={12} />
                      <span className="truncate">{reservation.telephone_client}</span>
                    </div>
                  )}
                  {reservation.table_assignee && (
                    <div className="flex items-center">
                      <MapPin className="mr-1" size={12} />
                      <span>Table {reservation.table_assignee}</span>
                    </div>
                  )}
                </div>
                
                {reservation.commentaire && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Note:</span> {reservation.commentaire}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Version desktop - tableau */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commentaire
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(reservation.date_reservation)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.heure_reservation} • {getServiceFromTime(reservation.heure_reservation)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {reservation.nom_client.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.nom_client}
                        </div>
                        <div className="text-sm text-gray-500">
                          Créé le {formatDateTime(reservation.date_creation)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Mail className="mr-1" size={14} />
                      {reservation.email_client}
                    </div>
                    {reservation.telephone_client && reservation.telephone_client !== 'N/A' && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="mr-1" size={14} />
                        {reservation.telephone_client}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Users className="mr-1" size={14} />
                      {reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? 's' : ''}
                    </div>
                    {reservation.table_assignee && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="mr-1" size={14} />
                        Table {reservation.table_assignee}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.statut)}`}>
                      {getStatusLabel(reservation.statut)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {reservation.commentaire || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReservations.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">Aucune réservation trouvée</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Aucune réservation ne correspond aux critères de recherche.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoriqueTab;