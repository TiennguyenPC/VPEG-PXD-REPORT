import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './index.css'
import AIAssistant from './components/AIAssistant.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import { lazyWithRetry } from './utils/lazyWithRetry.js'

const App = lazyWithRetry(() => import('./App.jsx'))
const ProjectDetailPage = lazyWithRetry(() => import('./pages/ProjectDetailPage.jsx'))
const TaskList = lazyWithRetry(() => import('./pages/TaskList.jsx'))
const Overview = lazyWithRetry(() => import('./pages/Overview.jsx'))
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage.jsx'))
const AccountPage = lazyWithRetry(() => import('./pages/AccountPage.jsx'))
const UserSettingsPage = lazyWithRetry(() => import('./pages/UserSettingsPage.jsx'))
const AuditLogPage = lazyWithRetry(() => import('./pages/AuditLogPage.jsx'))
const ShareProjectPage = lazyWithRetry(() => import('./pages/ShareProjectPage.jsx'))

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  if (!sessionStorage.getItem('epc-chunk-reload')) {
    sessionStorage.setItem('epc-chunk-reload', '1')
    window.location.reload()
  }
})

function AuthenticatedAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || location.pathname.startsWith('/share/')) return null;
  return <AIAssistant />;
}

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin"></div>
      <span className="text-white font-medium text-sm">Đang tải giao diện...</span>
    </div>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/share/:token" element={<ShareProjectPage />} />
              <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><App /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              <Route path="/settings/users" element={<ProtectedRoute><AdminRoute><UserSettingsPage /></AdminRoute></ProtectedRoute>} />
              <Route path="/settings/audit" element={<ProtectedRoute><AdminRoute><AuditLogPage /></AdminRoute></ProtectedRoute>} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <AuthenticatedAssistant />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
