import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Menu from './pages/Menu';
import Events from './pages/Events';
import Reservations from './pages/Reservations';
import Contact from './pages/Contact';
import CRM from './pages/CRM';
import TestSMS from './pages/TestSMS';

const AppContent = () => {
  const location = useLocation();
  const isCRMPage = location.pathname === '/crm';

  return (
    <div className="min-h-screen bg-secondary">
      <ScrollToTop />
      {!isCRMPage && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/accueil" element={<Navigate to="/" replace />} />
          <Route path="/accueil/" element={<Navigate to="/" replace />} />
          <Route path="/a-propos" element={<Navigate to="/about" replace />} />
          <Route path="/a-propos/" element={<Navigate to="/about" replace />} />
          <Route path="/carte" element={<Navigate to="/menu" replace />} />
          <Route path="/carte/" element={<Navigate to="/menu" replace />} />
          <Route path="/evenements" element={<Navigate to="/events" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/events" element={<Events />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/test-sms" element={<TestSMS />} />
          {/* Redirections pour les URLs avec slash final */}
          <Route path="/about/" element={<Navigate to="/about" replace />} />
          <Route path="/menu/" element={<Navigate to="/menu" replace />} />
          <Route path="/events/" element={<Navigate to="/events" replace />} />
          <Route path="/reservations/" element={<Navigate to="/reservations" replace />} />
          <Route path="/contact/" element={<Navigate to="/contact" replace />} />
          <Route path="/crm/" element={<Navigate to="/crm" replace />} />
          {/* Catch-all route pour les 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isCRMPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;