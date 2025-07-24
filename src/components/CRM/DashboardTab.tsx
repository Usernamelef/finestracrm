import React, { useState } from 'react';
import { Calendar, Users, MapPin, Clock, MessageSquare, Plus, Trash2 } from 'lucide-react';

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
  handleDeleteNote,
  getStats,
  getReservationsByStatus
}) => {
  const stats = getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestion des réservations – La Finestra
        </h1>
        <p className="text-gray-600">Tableau de bord privé réservé au personnel</p>
        
        {/* Bannière de service avec sélecteur de date */}
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary via-primary to-accent">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              Service du {currentService === 'midi' ? 'Midi' : 'Soir'} - {formatSelectedDate(selectedDate)}
            </h2>
            <div className="flex items-center space-x-2">
              <Calendar className="text-white" size={20} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-1 rounded-md text-primary font-medium focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Calendar className="text-primary mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total réservations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReservations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <MapPin className="text-primary mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Tables occupées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.occupiedTables} / 25</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="text-primary mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Clients présents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGuests}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="text-primary mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReservations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="text-yellow-600 mr-2" size={20} />
          Notes importantes
        </h3>
        
        {/* Affichage des notes existantes */}
        <div className="space-y-3 mb-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white p-4 rounded-md border border-yellow-200">
              <p className="text-gray-800 mb-2">{note.content}</p>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Par {note.author} • {formatDateTime(note.createdAt)}</span>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
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
          className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={16} />
          <span>Ajouter une note</span>
        </button>
      </div>

      {/* Résumé des réservations du service actuel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Résumé des réservations - Service du {currentService}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
            <h4 className="font-medium text-pink-800 mb-2">En attente</h4>
            <p className="text-2xl font-bold text-pink-600">
              {getReservationsByStatus('pending').length}
            </p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-800 mb-2">Assignées</h4>
            <p className="text-2xl font-bold text-red-600">
              {getReservationsByStatus('assigned').length}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-2">Arrivées</h4>
            <p className="text-2xl font-bold text-purple-600">
              {getReservationsByStatus('arrived').length}
            </p>
          </div>
        </div>
      </div>

      {/* Dernières activités */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Dernières activités
        </h3>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">
                {formatTime(activity.timestamp)}
              </div>
              <div className="text-sm text-gray-800">
                {activity.action}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;