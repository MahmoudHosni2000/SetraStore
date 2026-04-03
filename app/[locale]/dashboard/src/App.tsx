import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { DashboardLayout } from './components/DashboardLayout';
import { Overview } from './pages/Overview';
import { Analytics } from './pages/Analytics';
import { Activities } from './pages/Activities';
import { Profile } from './pages/Profile';
import './App.css';

function DashboardContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview />;
      case 'analytics':
        return <Analytics />;
      case 'activities':
        return <Activities />;
      case 'profile':
        return <Profile />;
      default:
        return <Overview />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
