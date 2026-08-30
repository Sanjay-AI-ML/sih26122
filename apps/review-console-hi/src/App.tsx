import { KeycloakLoginScreen } from './components/KeycloakLoginScreen';
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ReviewQueueProvider, useReviewQueue } from './context/ReviewQueueContext';
import { TopAppBar } from './components/TopAppBar';
import { SideNav } from './components/SideNav';
import { ReviewQueueScreen } from './components/ReviewQueueScreen';
import { PrimaveraP6Screen } from './components/PrimaveraP6Screen';
import { DelayRiskDashboard } from './components/DelayRiskDashboard';
import { RecordDetailScreen } from './components/RecordDetailScreen';
import { ScheduleMatchModal } from './components/ScheduleMatchModal';
import { CreateActivityModal } from './components/CreateActivityModal';
import { NewReportModal } from './components/NewReportModal';
import { ExportReportModal } from './components/ExportReportModal';
import { Toast } from './components/Toast';

const RouteHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsCreateActivityModalOpen, setIsExportModalOpen } = useReviewQueue();

  useEffect(() => {
    if (location.pathname === '/create') {
      setIsCreateActivityModalOpen(true);
    } else if (location.pathname === '/export') {
      setIsExportModalOpen(true);
    }
  }, [location.pathname, setIsCreateActivityModalOpen, setIsExportModalOpen]);

  return (
    <Routes>
      <Route path="/" element={<ReviewQueueScreen />} />
      <Route path="/primavera" element={<PrimaveraP6Screen />} />
      <Route path="/analytics" element={<DelayRiskDashboard isOpen={true} onClose={() => navigate("/")} />} />
      <Route path="/record/:id" element={<RecordDetailScreen />} />
      <Route path="/create" element={<ReviewQueueScreen />} />
      <Route path="/export" element={<ReviewQueueScreen />} />
      <Route path="*" element={<ReviewQueueScreen />} />
    </Routes>
  );
};

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  if (!isLoggedIn) {
    return <KeycloakLoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col antialiased selection:bg-primary-fixed selection:text-primary">
      <TopAppBar onLogout={() => setIsLoggedIn(false)} />
      <div className="flex flex-1">
        <SideNav />
        <RouteHandler />
      </div>

      {/* Global Modals & Overlays */}
      <ScheduleMatchModal />
      <CreateActivityModal />
      <NewReportModal />
      <ExportReportModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ReviewQueueProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ReviewQueueProvider>
  );
}
