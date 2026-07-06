import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import './App.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Route Guards
import { ProtectedRoute } from './components/Routes/ProtectedRoute';
import { PublicRoute } from './components/Routes/PublicRoute';

// Pages - Lazy Loaded for Performance
const Landing = lazy(() => import('./pages/Landing/Landing'));
const Login = lazy(() => import('./pages/Auth/Login'));
const SignUp = lazy(() => import('./pages/Auth/SignUp'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Profile = lazy(() => import('./pages/Dashboard/Profile'));
const Settings = lazy(() => import('./pages/Dashboard/Settings'));
const Help = lazy(() => import('./pages/Dashboard/Help'));
const ChatAssistant = lazy(() => import('./pages/Dashboard/ChatAssistant'));
const DocumentAnalyzer = lazy(() => import('./pages/Dashboard/DocumentAnalyzer'));
const AutomationHub = lazy(() => import('./pages/Dashboard/AutomationHub'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
    <Loader2 size={40} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const AppContent = () => {
  // Removed theme tracking effect

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Login - Full bleed without MainLayout */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Public Routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Landing />} />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
          </Route>
          
          {/* Full Bleed 404 Page (No Layout) */}
          <Route path="*" element={<NotFound />} />

          {/* Protected Routes with DashboardLayout */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/chat" element={<ChatAssistant />} />
            <Route path="/dashboard/documents" element={<DocumentAnalyzer />} />
            <Route path="/dashboard/automation" element={<AutomationHub />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
