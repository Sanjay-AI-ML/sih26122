import React from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface TopAppBarProps {
  onLogout?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ onLogout }) => {
  const {
    isDarkMode,
    toggleHighContrast,
    isHighContrast,
    toggleTextEnlarged,
    showToast,
    t,
    toggleMobileSidebar,
    isMobileSidebarOpen
  } = useReviewQueue();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 h-11 sm:h-12 flex justify-between items-center w-full bg-surface border-b border-border-standard z-50 transition-colors px-3 sm:px-4">
      {/* Search Placeholder / Nav Structure Area */}
      <div className="flex items-center space-x-2 sm:space-x-4 h-full">
        {/* Mobile menu trigger */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isMobileSidebarOpen ? 'close' : 'menu'}
          </span>
        </button>

        <nav className="flex h-full items-center">
          <button 
            onClick={() => navigate('/')} 
            className={`font-h3 text-h3 font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 ${isDarkMode ? "text-sky-400" : "text-primary"}`}
          >
            Kadam
            {location.pathname !== '/' && (
              <span className="text-[11px] font-normal text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-border-standard hidden sm:inline-block">
                {t('reviewConsole')}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-3">
        {/* Navigation Links */}
        <button 
          onClick={() => showToast('Accessibility guidelines compliant (GIGW 2.0)', undefined, 'info')}
          className="hidden md:inline-block font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-container-high transition-colors px-2 py-1 rounded cursor-pointer"
        >
          {t('accessibilityHelp')}
        </button>
        <button 
          onClick={() => showToast('Sitemap: / (Queue), /record/:id (Review), /create (New Activity), /export (Export)', undefined, 'info')}
          className="hidden sm:inline-block font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-container-high transition-colors px-2 py-1 rounded cursor-pointer"
        >
          {t('sitemap')}
        </button>

        {/* Trailing Icons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 border-l border-border-standard pl-2 sm:pl-3 h-full">
          <button 
            onClick={toggleTextEnlarged}
            aria-label="Increase Text Size" 
            title="Toggle Text Size (A+)"
            className={`h-8 w-8 rounded transition-colors active:opacity-80 flex items-center justify-center font-bold cursor-pointer ${isDarkMode ? "text-slate-200 hover:bg-slate-800" : "text-primary hover:bg-surface-container-high"}`}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px] flex items-center justify-center" data-icon="text_increase">text_increase</span>
          </button>
          <button
            onClick={toggleHighContrast}
            aria-label="High Contrast Mode"
            title="Toggle High Contrast Mode"
            className={`h-8 w-8 rounded transition-colors active:opacity-80 flex items-center justify-center cursor-pointer ${isHighContrast ? "bg-primary text-on-primary" : (isDarkMode ? "text-slate-200 hover:bg-slate-800" : "text-primary hover:bg-surface-container-high")}`}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px] flex items-center justify-center" data-icon="contrast">contrast</span>
          </button>

          {onLogout && (
            <button 
              onClick={onLogout}
              title="Sign Out Keycloak SSO"
              className="h-7 px-2.5 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-indigo-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ml-1"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
