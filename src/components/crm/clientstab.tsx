import React, { useState, useEffect } from 'react';
import { Mail, Phone, User, Calendar, MapPin, Clock, Search, Edit, Save, X } from 'lucide-react';
import { getAllReservations, type Reservation } from '../../lib/supabase';

interface ClientsTabProps {
  reservationsData?: any[];
}

interface Client {
  email: string;
  nom: string;
  telephone: string;
  reservations: Reservation[];
}

const ClientsTab: React.FC<ClientsTabProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({
    nom: '',
    email: '',
    telephone: ''
  });
  const [saving, setSaving] = useState(false);

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
        setError('Erreur lors du chargement des données clients');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Grouper les réservations par client (email unique)
  const getUniqueClients = (): Client[] => {
    const clientsMap = new Map();
    
    reservations.forEach(reservation => {
      const email = reservation.email_client;
      if (!clientsMap.has(email)) {
        clientsMap.set(email, {
          email: email,
          nom: reservation.nom_client,
          telephone: reservation.telephone_client,
          reservations: []
        });
      }
      clientsMap.get(email).reservations.push(reservation);
    });

    return Array.from(clientsMap.values());
  };

  // Filtrer les clients selon le terme de recherche
  const getFilteredClients = () => {
    const clients = getUniqueClients();
    
    if (!searchTerm) return clients;
    
    return clients.filter(client => 
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Ouvrir le modal d'édition
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      nom: client.nom,
      email: client.email,
      telephone: client.telephone
    });
    setShowEditModal(true);
  };

  // Sauvegarder les modifications du client
  const handleSaveClient = async () => {
    if (!editingClient || !editForm.nom.trim() || !editForm.email.trim()) {
      alert('Le nom et l\'email sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuration Supabase manquante');
      }

      // Mettre à jour toutes les réservations de ce client
      const reservationsToUpdate = editingClient.reservations.map(reservation => reservation.id);
      
      for (const reservationId of reservationsToUpdate) {
        const response = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            nom_client: editForm.nom.trim(),
            email_client: editForm.email.trim(),
            telephone_client: editForm.telephone.trim()
          })
        });

        if (!response.ok) {
          throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
        }
      }

      // Recharger les données
      const allReservations = await getAllReservations();
      setReservations(allReservations);

      // Fermer le modal
      setShowEditModal(false);
      setEditingClient(null);
      
      alert('Informations client mises à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Base de données clients</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Chargement des données clients...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Base de données clients</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const filteredClients = getFilteredClients();

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Base de données clients</h1>
          <div className="text-xs sm:text-sm text-gray-600">
            {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} • {reservations.length} réservation{reservations.length > 1 ? 's' : ''} au total
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un client par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center">
              <User className="text-primary mr-2 sm:mr-3" size={20} />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total clients</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{getUniqueClients().length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center">
              <Calendar className="text-primary mr-2 sm:mr-3" size={20} />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Réservations actives</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {reservations.filter(r => ['assignee', 'arrivee'].includes(r.statut)).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center">
              <Clock className="text-primary mr-2 sm:mr-3" size={20} />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">En attente</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {reservations.filter(r => r.statut === 'en_attente').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center">
              <MapPin className="text-primary mr-2 sm:mr-3" size={20} />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Terminées</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {reservations.filter(r => r.statut === 'terminee').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredClients.map((client) => {
            const latestReservation = client.reservations.sort((a, b) => 
              new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()
            )[0];
            
            return (
              <div key={client.email} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-white" size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">{client.nom}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {client.reservations.length} réservation{client.reservations.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(latestReservation.statut)}`}>
                      {getStatusLabel(latestReservation.statut)}
                    </span>
                    <button
                      onClick={() => handleEditClient(client)}
                      className="p-1 text-gray-400 hover:text-primary transition-colors"
                      title="Modifier les informations"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="text-gray-400" size={16} />
                    <span className="text-gray-700 break-all">{client.email}</span>
                  </div>
                  {client.telephone && client.telephone !== 'N/A' && (
                    <div className="flex items-center space-x-2">
                      <Phone className="text-gray-400" size={16} />
                      <span className="text-gray-700">{client.telephone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-gray-400" size={16} />
                    <span className="text-gray-700">
                      Dernière réservation: {formatDate(latestReservation.date_reservation)}
                    </span>
                  </div>
                </div>
                
                {/* Historique des réservations */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Historique récent</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {client.reservations
                      .sort((a, b) => new Date(b.date_reservation).getTime() - new Date(a.date_reservation).getTime())
                      .slice(0, 5)
                      .map((reservation) => (
                      <div key={reservation.id} className="text-xs text-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-1 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <span>{formatDate(reservation.date_reservation)}</span>
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <span>{reservation.heure_reservation}</span>
                          {reservation.table_assignee && (
                            <>
                              <span className="text-gray-400 hidden sm:inline">•</span>
                              <span>Table {reservation.table_assignee}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <span>{reservation.nombre_personnes}p</span>
                          <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(reservation.statut)}`}>
                            {getStatusLabel(reservation.statut)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {client.reservations.length > 5 && (
                      <div className="text-xs text-gray-500 italic">
                        +{client.reservations.length - 5} autre{client.reservations.length - 5 > 1 ? 's' : ''}...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notes client */}
                {latestReservation.commentaire && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Dernière note</h4>
                    <p className="text-xs text-gray-600 italic break-words">"{latestReservation.commentaire}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun client trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Aucun client ne correspond à votre recherche.' : 'Aucun client dans la base de données.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal d'édition client */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary">Modifier les informations client</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={editForm.nom}
                  onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nom du client"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={editForm.telephone}
                  onChange={(e) => setEditForm({...editForm, telephone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+41 xx xxx xx xx"
                />
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Note :</strong> Ces modifications seront appliquées à toutes les réservations de ce client ({editingClient.reservations.length} réservation{editingClient.reservations.length > 1 ? 's' : ''}).
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveClient}
                disabled={saving || !editForm.nom.trim() || !editForm.email.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Sauvegarder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientsTab;