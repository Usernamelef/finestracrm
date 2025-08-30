import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation, Navigate } from 'react-router-dom';
import ScrollToTop from './components/scrolltotop';
import Header from './components/header';
import Footer from './components/footer';
import Home from './pages/home';
import About from './pages/about';
import Menu from './pages/menu';
import Events from './pages/events';
import Reservations from './pages/reservations';
import Contact from './pages/contact';
import CRM from './pages/crm';
import TestSMS from './pages/testsms';

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