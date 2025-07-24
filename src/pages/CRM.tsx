import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, MapPin, Clock, Plus, X, Edit, Trash2, Phone, Mail, User, Search, Filter, Download, ChevronDown, Check, Ban, History, MessageSquare } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import DashboardTab from '../components/CRM/DashboardTab';
import ReservationsTab from '../components/CRM/ReservationsTab';
import SalleTab from '../components/CRM/SalleTab';
import ClientsTab from '../components/CRM/ClientsTab';
import HistoriqueTab from '../components/CRM/HistoriqueTab';
import { createReservation } from '../lib/supabase';

interface Table {
  number: number;
  capacity: number;
  status: 'available' | 'reserved' | 'occupied' | 'unavailable';
  reservations: Reservation[];
  section: 'main' | 'terrace';
}

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

const CRM = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('reservations');
  const [currentService, setCurrentService] = useState<'midi' | 'soir'>('midi');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [refreshReservationsTrigger, setRefreshReservationsTrigger] = useState(0);
  const [showTableModal, setShowTableModal] = useState(false);
  const [newReservationCount, setNewReservationCount] = useState(0);
  const [reservationToAssign, setReservationToAssign] = useState<any>(null);
  const refreshReservationsRef = useRef<(() => void) | null>(null);
  
  // Mock data avec exemples fictifs variés
  const [reservationsData, setReservationsData] = useState<any[]>([
    {
      id: '1',
      name: 'Sophie Martin',
      email: 'sophie.martin@email.com',
      phone: '+41 79 123 45 67',
      date: '2025-01-05',
      time: '12:30',
      guests: 2,
      service: 'midi',
      status: 'pending',
      message: 'Table près de la fenêtre si possible',
      createdAt: '2025-01-05T10:15:00'
    },
    {
      id: '2',
      name: 'Jean Dupont',
      email: 'j.dupont@company.ch',
      phone: '+41 22 456 78 90',
      date: '2025-01-05',
      time: '13:00',
      guests: 4,
      service: 'midi',
      status: 'assigned',
      tableNumbers: [3, 4],
      message: 'Repas d\'affaires important',
      createdAt: '2025-01-05T09:30:00'
    },
    {
      id: '3',
      name: 'Maria Rossi',
      email: 'maria.rossi@gmail.com',
      phone: '+41 76 987 65 43',
      date: '2025-01-05',
      time: '12:00',
      guests: 2,
      service: 'midi',
      status: 'arrived',
      tableNumber: 1,
      createdAt: '2025-01-05T08:45:00'
    },
    {
      id: '4',
      name: 'Pierre Dubois',
      email: 'p.dubois@vip.ch',
      phone: '+41 79 555 12 34',
      date: '2025-01-05',
      time: '20:00',
      guests: 2,
      service: 'soir',
      status: 'assigned',
      tableNumber: 8,
      message: 'Client VIP - service personnalisé',
      createdAt: '2025-01-05T11:20:00'
    },
    {
      id: '5',
      name: 'Famille Müller',
      email: 'mueller.family@swiss.ch',
      phone: '+41 31 789 01 23',
      date: '2025-01-05',
      time: '19:30',
      guests: 6,
      service: 'soir',
      status: 'pending',
      message: 'Anniversaire enfant 8 ans',
      createdAt: '2025-01-05T12:10:00'
    },
    {
      id: '6',
      name: 'Antoine Bernard',
      email: 'a.bernard@email.fr',
      phone: '+41 78 234 56 78',
      date: '2025-01-05',
      time: '19:00',
      guests: 2,
      service: 'soir',
      status: 'arrived',
      tableNumber: 12,
      createdAt: '2025-01-05T13:45:00'
    },
    {
      id: '7',
      name: 'Groupe Entreprise ABC',
      email: 'events@abc-corp.ch',
      phone: '+41 22 345 67 89',
      date: '2025-01-05',
      time: '21:00',
      guests: 8,
      service: 'soir',
      status: 'assigned',
      tableNumbers: [20, 21, 22, 23],
      message: 'Événement corporate - facture entreprise',
      createdAt: '2025-01-05T14:00:00'
    }
  ]);

  const [tables, setTables] = useState<Table[]>([
    // Tables principales (1-13)
    ...Array.from({ length: 13 }, (_, i) => ({
      number: i + 1,
      capacity: 2,
      status: 'available' as const,
      reservations: [],
      section: 'main' as const
    })),
    // Tables terrasse (20-31)
    ...Array.from({ length: 12 }, (_, i) => ({
      number: i + 20,
      capacity: 2,
      status: 'available' as const,
      reservations: [],
      section: 'terrace' as const
    }))
  ]);

  // Fonction pour déterminer le service basé sur l'heure
  const getServiceFromTime = (heure: string) => {
    const [hour, minute] = heure.split(':').map(Number);
    const totalMinutes = hour * 60 + minute;
    // 00:01 à 16:00 = midi, 16:01 à 00:00 = soir
    return totalMinutes <= 16 * 60 ? 'midi' : 'soir';
  };

  // Dérivation de l'état des tables basé sur les réservations
  useEffect(() => {
    const updatedTables = tables.map(table => {
      // Réinitialiser la table
      const resetTable = {
        ...table,
        status: 'available' as const,
        reservations: []
      };


      return resetTable;
    });

    setTables(updatedTables);
  }, [selectedDate, currentService]);

  // États pour le tableau de bord
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      action: 'Réservation ajoutée pour M. Rossi (4 pers.) – Assignée table 7',
      timestamp: '2025-01-05T13:02:00'
    },
    {
      id: '2',
      action: 'Client Dubois marqué comme arrivé – Table 8',
      timestamp: '2025-01-05T12:45:00'
    },
    {
      id: '3',
      action: 'Table 3 libérée – Famille Müller',
      timestamp: '2025-01-05T12:30:00'
    },
    {
      id: '4',
      action: 'Nouvelle réservation Sophie Martin (2 pers.) – En attente',
      timestamp: '2025-01-05T11:15:00'
    },
    {
      id: '5',
      action: 'Réservation Groupe ABC assignée aux tables 20-23',
      timestamp: '2025-01-05T10:30:00'
    }
  ]);

  // États pour les notes
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      content: 'Attention: Groupe de 8 personnes ce soir, prévoir tables 5-6 ensemble',
      author: 'Marie',
      createdAt: '2025-01-05T14:30:00'
    },
    {
      id: '2',
      content: 'Client VIP M. Dubois réservé à 20h - service personnalisé',
      author: 'Pierre',
      createdAt: '2025-01-05T16:45:00'
    }
  ]);

  const [newNote, setNewNote] = useState({
    author: '',
    content: ''
  });

  const [newReservation, setNewReservation] = useState({
    name: '',
    date: '',
    time: '',
    guests: '',
    message: ''
  });

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const authStatus = localStorage.getItem('crm-authenticated');
    const savedService = localStorage.getItem('crm-current-service') as 'midi' | 'soir';
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    if (savedService) {
      setCurrentService(savedService);
    }
  }, []);

  const addActivity = (action: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      action,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 4)]); // Garder seulement les 5 dernières
  };

  const handleNewReservation = () => {
    setNewReservationCount(prev => prev + 1);
  };

  const resetNewReservationCount = () => {
    setNewReservationCount(0);
  };
  const handleLogin = (e: React.FormEvent) => {
    // Initialiser Supabase pour l'authentification
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    e.preventDefault();
    if (password === 'Finestra2025!') {
      setIsAuthenticated(true);
      localStorage.setItem('crm-authenticated', 'true');
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('crm-authenticated');
    setPassword('');
  };

  const handleServiceChange = (service: 'midi' | 'soir') => {
    setCurrentService(service);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleAddNote = () => {
    if (newNote.author.trim() && newNote.content.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote.content,
        author: newNote.author,
        createdAt: new Date().toISOString()
      };
      setNotes([...notes, note]);
      setNewNote({ author: '', content: '' });
      setShowNewNoteModal(false);
      addActivity(`Note ajoutée par ${newNote.author}`);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    setNotes(notes.filter(note => note.id !== noteId));
    if (note) {
      addActivity(`Note supprimée de ${note.author}`);
    }
  };

  const handleAddReservation = async () => {
    if (newReservation.name && newReservation.date && newReservation.time && newReservation.guests) {
      // Déterminer le service basé sur l'heure
      const hour = parseInt(newReservation.time.split(':')[0]);
      const minute = parseInt(newReservation.time.split(':')[1]);
      const totalMinutes = hour * 60 + minute;
      
      // 00:01 à 16:00 = midi, 16:01 à 00:00 = soir
      const service = totalMinutes <= 16 * 60 ? 'midi' : 'soir';
      
      try {
        // Préparer les données pour Supabase
        const reservationData = {
          nom_client: newReservation.name,
          email_client: 'crm@lafinestra.ch', // Email par défaut pour les réservations CRM
          telephone_client: 'N/A', // Téléphone par défaut
          date_reservation: newReservation.date,
          heure_reservation: newReservation.time,
          nombre_personnes: parseInt(newReservation.guests),
          commentaire: newReservation.message || null,
          statut: 'en_attente' // Directement en attente d'assignation
        };

        // Créer la réservation dans Supabase
        await createReservation(reservationData);
        
        // Réinitialiser le formulaire
        setNewReservation({
          name: '',
          date: '',
          time: '',
          guests: '',
          message: ''
        });
        setShowNewReservationModal(false);
        
        // Rafraîchir les réservations si la fonction est disponible
        if (refreshReservationsRef.current) {
          refreshReservationsRef.current();
        }
        
        addActivity(`Réservation ajoutée pour ${newReservation.name} (${newReservation.guests} pers.) – En attente d'assignation`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réservation:', error);
        alert('Erreur lors de l\'ajout de la réservation. Veuillez réessayer.');
      }
    }
  };

  const handleAssignTable = (reservationId: string, tableNumbers: number[], fromSalleTab: boolean = false) => {
    // Chercher d'abord dans les réservations Supabase, puis dans les données locales
    let reservation = null;
    
    // Si c'est une réservation Supabase (format avec nom_client, etc.)
    if (typeof reservationId === 'object') {
      reservation = reservationId;
      reservationId = reservation.id;
    } else {
      // Sinon chercher par ID
      reservation = reservationsData.find(r => r.id === reservationId);
    }
    
    if (!fromSalleTab) {
      // Stocker la réservation pour l'assignation
      setReservationToAssign(reservation);
      setSelectedReservation(reservation);
      // Changer vers l'onglet salle
      setActiveTab('salle');
      return;
    }
    
    // Assignation effective de la table
    if (reservation) {
      const reservationDate = reservation.date_reservation || reservation.date;
      const reservationTime = reservation.heure_reservation || reservation.time;
      const reservationService = getServiceFromTime(reservationTime);
      
      // Si la réservation n'est pas pour la date/service actuel, changer l'onglet
      if (reservationDate !== selectedDate || reservationService !== currentService) {
        // Mettre à jour la date et le service pour correspondre à la réservation
        setSelectedDate(reservationDate);
        setCurrentService(reservationService);
      }
      
      // Mettre à jour le statut dans Supabase avec les tables assignées
      import('../lib/supabase').then(({ updateReservationStatus }) => {
        const primaryTable = tableNumbers[0];
        updateReservationStatus(reservationId, 'assignee', primaryTable, tableNumbers)
          .then(() => {
            // Rafraîchir les réservations
            if (refreshReservationsRef.current) {
              refreshReservationsRef.current();
            }
            // Trigger a re-render of CRM to update tables state
            setRefreshReservationsTrigger(prev => prev + 1);
          })
          .catch(error => {
            console.error('Erreur lors de l\'assignation:', error);
            alert('Erreur lors de l\'assignation de la table');
          });
      });
  
      // Logique d'assignation locale pour l'affichage immédiat
      setTables(prev => prev.map(table => {
        if (tableNumbers.includes(table.number)) {
          return { ...table, status: 'reserved' as const, reservations: [reservation] };
        }
        return table;
      }));
      
      const tableText = tableNumbers.length > 1 ? `tables ${tableNumbers.join(', ')}` : `table ${tableNumbers[0]}`;
      addActivity(`${reservation.nom_client || reservation.name} assigné(e) à la ${tableText}`);
      
      // Nettoyer les variables d'assignation
      setReservationToAssign(null);
      setSelectedReservation(null);
    }
  };

  const handleMarkArrived = (reservationId: string) => {
    const reservation = reservationsData.find(r => r.id === reservationId);
    setReservationsData(prev => prev.map(res => 
      res.id === reservationId ? { ...res, status: 'arrived' } : res
    ));
    
    if (reservation) {
      const tableText = reservation.tableNumbers 
        ? `tables ${reservation.tableNumbers.join(', ')}` 
        : `table ${reservation.tableNumber}`;
      addActivity(`Client ${reservation.name} marqué comme arrivé – ${tableText}`);
    }
  };

  const handleCompleteReservation = (reservationId: string) => {
    const reservation = reservationsData.find(r => r.id === reservationId);
    setReservationsData(prev => prev.map(res => 
      res.id === reservationId ? { ...res, status: 'completed' } : res
    ));
    
    if (reservation) {
      const tableText = reservation.tableNumbers 
        ? `tables ${reservation.tableNumbers.join(', ')}` 
        : `table ${reservation.tableNumber}`;
      addActivity(`${tableText} libérée – ${reservation.name}`);
    }
  };

  const handleFreeTable = (tableNumber: number) => {
    const reservation = reservationsData.find(res => 
      (res.tableNumber === tableNumber || res.tableNumbers?.includes(tableNumber)) &&
      res.status !== 'completed'
    );
    
    setReservationsData(prev => prev.map(res => {
      if (res.tableNumber === tableNumber || res.tableNumbers?.includes(tableNumber)) {
        return { ...res, status: 'completed' };
      }
      return res;
    }));
    
    if (reservation) {
      addActivity(`Table ${tableNumber} libérée – ${reservation.name}`);
    }
  };

  const getFilteredReservations = () => {
    return reservationsData.filter(res => 
      res.service === currentService &&
      res.date === selectedDate &&
      res.status !== 'completed' &&
      (searchTerm === '' || res.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getReservationsByStatus = (status: string) => {
    return getFilteredReservations().filter(res => res.status === status);
  };

  const getStats = () => {
    const todayReservations = reservationsData.filter(res => 
      res.service === currentService &&
      res.date === selectedDate &&
      res.status !== 'completed'
    );
    
    const occupiedTables = tables.filter(table => table.status === 'occupied').length;
    const totalGuests = todayReservations
      .filter(res => res.status === 'arrived')
      .reduce((sum, res) => sum + res.guests, 0);
    
    return {
      totalReservations: todayReservations.length,
      occupiedTables,
      totalGuests,
      pendingReservations: todayReservations.filter(res => res.status === 'pending').length
    };
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAvailableAdjacentTables = (guestCount: number) => {
    if (guestCount <= 2) {
      return tables.filter(table => table.status === 'available').map(table => [table.number]);
    }
    
    const tablesNeeded = Math.ceil(guestCount / 2);
    const availableTables = tables.filter(table => table.status === 'available');
    const combinations: number[][] = [];
    
    // Logique simplifiée pour trouver des tables adjacentes
    for (let i = 0; i < availableTables.length - tablesNeeded + 1; i++) {
      const combo = [];
      for (let j = 0; j < tablesNeeded; j++) {
        combo.push(availableTables[i + j].number);
      }
      combinations.push(combo);
    }
    
    return combinations;
  };

  if (!isAuthenticated) { // This block is for the login screen
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <img
              src="/assets/lafinestra-geneve-logo-blanc.png"
              alt="La Finestra"
              className="h-16 mx-auto mb-4 filter brightness-0"
            />
            <h2 className="text-2xl font-bold text-gray-800">Accès CRM</h2>
            <p className="text-gray-600">Espace réservé au personnel</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez le mot de passe"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md transition-colors"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return ( // This is the main CRM content
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <img
                src="/assets/lafinestra-geneve-logo-blanc.png"
                alt="La Finestra"
                className="h-12 w-auto"
              />
              
              {/* Sélecteur de service */}
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex">
                <button
                  onClick={() => handleServiceChange('midi')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentService === 'midi'
                      ? 'bg-white text-primary shadow-md'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  Midi
                </button>
                <button
                  onClick={() => handleServiceChange('soir')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentService === 'soir'
                      ? 'bg-white text-primary shadow-md'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  Soir
                </button>
              </div>
              
              {/* Navigation CRM */}
              <nav className="hidden md:flex space-x-6">
                {[
                  { id: 'dashboard', label: 'Tableau de bord' },
                  { id: 'reservations', label: 'Réservations' },
                  { id: 'salle', label: 'Plan de salle' },
                  { id: 'clients', label: 'Clients' },
                  { id: 'historique', label: 'Historique' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'reservations') {
                        resetNewReservationCount();
                      }
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                    {tab.id === 'reservations' && newReservationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {newReservationCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="text-white hover:text-gray-300 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab
            currentService={currentService}
            selectedDate={selectedDate}
            handleDateChange={handleDateChange}
            formatSelectedDate={formatSelectedDate}
            formatDateTime={formatDateTime}
            formatTime={formatTime}
            addActivity={addActivity}
            activities={activities}
            notes={notes}
            setNotes={setNotes}
            showNewNoteModal={showNewNoteModal}
            setShowNewNoteModal={setShowNewNoteModal}
            newNote={newNote}
            setNewNote={setNewNote}
            handleAddNote={handleAddNote}
            handleDeleteNote={handleDeleteNote}
            getStats={getStats}
            getReservationsByStatus={getReservationsByStatus}
          />
        )}

        {activeTab === 'reservations' && (
          <ReservationsTab
            currentService={currentService}
            selectedDate={selectedDate}
            addActivity={addActivity}
            showNewReservationModal={showNewReservationModal}
            setShowNewReservationModal={setShowNewReservationModal}
            selectedReservation={selectedReservation}
            setSelectedReservation={setSelectedReservation}
            handleAssignTable={(id, tables, fromSalleTab) => handleAssignTable(id, tables, fromSalleTab || false)}
            handleMarkArrived={handleMarkArrived}
            handleCompleteReservation={handleCompleteReservation}
            getFilteredReservations={getFilteredReservations}
            getReservationsByStatusLocal={getReservationsByStatus}
            onNewReservation={handleNewReservation}
            onRefreshNeeded={(refreshFn) => { refreshReservationsRef.current = refreshFn; }}
          />
        )}

        {activeTab === 'salle' && (
          <SalleTab
            currentService={currentService}
            setCurrentService={setCurrentService}
            handleDateChange={handleDateChange}
            selectedReservation={reservationToAssign || selectedReservation}
            setSelectedReservation={setSelectedReservation}
            handleAssignTable={(id, tables, fromSalleTab) => handleAssignTable(id, tables, fromSalleTab || true)}
            addActivity={addActivity}
            tables={tables}
            setTables={setTables}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            showTableModal={showTableModal}
            setShowTableModal={setShowTableModal}
            handleFreeTable={handleFreeTable}
            getAvailableAdjacentTables={getAvailableAdjacentTables}
            reservationsData={reservationsData}
            formatSelectedDate={formatSelectedDate}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsTab reservationsData={reservationsData} />
        )}

        {activeTab === 'historique' && (
          <HistoriqueTab />
        )}
      </div>

      {/* Modal nouvelle note */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une note</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom (obligatoire)
                </label>
                <input
                  type="text"
                  value={newNote.author}
                  onChange={(e) => setNewNote({...newNote, author: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre nom"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu de la note (obligatoire)
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contenu de la note..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewNoteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.author.trim() || !newNote.content.trim()}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle réservation */}
      {showNewReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newReservation.date}
                    onChange={(e) => setNewReservation({...newReservation, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
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
                onClick={() => setShowNewReservationModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddReservation}
                disabled={!newReservation.name || !newReservation.date || !newReservation.time || !newReservation.guests}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white rounded-md transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail table */}
    </div>
  );
};

export default CRM;