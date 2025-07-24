import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
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
          <Route path="/about" element={<About />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/events" element={<Events />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/crm" element={<CRM />} />
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