import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation, Navigate } from 'react-router-dom';
import ScrollToTop from './components/scrolltotop';
import Header from './components/header';
import Footer from './components/footer';
import Home from './pages/home';

// Lazy loading des pages non critiques
const About = lazy(() => import('./pages/about'));
const Menu = lazy(() => import('./pages/menu'));
const Events = lazy(() => import('./pages/events'));
const Reservations = lazy(() => import('./pages/reservations'));
const Contact = lazy(() => import('./pages/contact'));
const CRM = lazy(() => import('./pages/crm'));
const TestSMS = lazy(() => import('./pages/testsms'));

// Composant de chargement
const LoadingSpinner = () => (
  <div className="min-h-screen bg-secondary flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-primary font-medium">Chargement...</p>
    </div>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isCRMPage = location.pathname === '/crm';

  return (
    <div className="min-h-screen bg-secondary">
      <ScrollToTop />
      {!isCRMPage && <Header />}
      <main>
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
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