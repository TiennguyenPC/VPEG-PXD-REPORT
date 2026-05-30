import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './index.css'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import { lazyWithRetry } from './utils/lazyWithRetry.js'
import { registerSW } from 'virtual:pwa-register'
import PwaInstallPrompt from './components/PwaInstallPrompt.jsx'
import { Capacitor } from '@capacitor/core'

function registerServiceWorkerDeferred() {
  const run = () => registerSW({ immediate: true });
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 1500);
  }
}
registerServiceWorkerDeferred()

function applyViewportInsets() {
  const root = document.documentElement
  if (Capacitor.isNativePlatform()) {
    root.classList.add('capacitor-native')
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    root.classList.add('pwa-standalone')
  }
}
applyViewportInsets()

const App = lazyWithRetry(() => import('./App.jsx'))
const ProjectDetailPage = lazyWithRetry(() => import('./pages/ProjectDetailPage.jsx'))
const TaskList = lazyWithRetry(() => import('./pages/TaskList.jsx'))
const Overview = lazyWithRetry(() => import('./pages/Overview.jsx'))
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage.jsx'))
const AccountPage = lazyWithRetry(() => import('./pages/AccountPage.jsx'))
const UserSettingsPage = lazyWithRetry(() => import('./pages/UserSettingsPage.jsx'))
const AuditLogPage = lazyWithRetry(() => import('./pages/AuditLogPage.jsx'))
const ShareProjectPage = lazyWithRetry(() => import('./pages/ShareProjectPage.jsx'))
const AIAssistant = lazyWithRetry(() => import('./components/AIAssistant.jsx'))

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
  return (
    <Suspense fallback={null}>
      <AIAssistant />
    </Suspense>
  );
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
        <PwaInstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
