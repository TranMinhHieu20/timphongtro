import React, { useState, useEffect } from 'react'
import AppErrorBoundary from './components/AppErrorBoundary'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import RoomDetail from './pages/RoomDetail'
import AdminImport from './pages/AdminImport'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminLeads from './pages/AdminLeads'
import AdminRooms from './pages/AdminRooms'
import AdminChat from './pages/AdminChat'
import FavoritesPage from './pages/FavoritesPage'
import LiveSheetPage from './pages/LiveSheetPage'
import MyBookingsPage from './pages/MyBookingsPage'
import { AuthProvider, useAuth } from './context/AuthContext'

import AdminRoute from './components/AdminRoute'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/PageTransition'
import AdminSidebar from './components/AdminSidebar'
import SettingsModal from './components/SettingsModal'
import ChatBox from './components/ChatBox'
import AnnouncementBar from './components/AnnouncementBar'
import GlobalLiveNotification from './components/GlobalLiveNotification'
import ChatToast from './components/ChatToast'
import Footer from './components/Footer'

function RouteScroll() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function AppContent() {
  const { user, isAdmin, isAuthenticated } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <Router>
      <RouteScroll />
      <div
        className={`min-h-screen bg-slate-950 font-sans antialiased text-slate-100 transition-all duration-500 ${isAdmin ? 'lg:pl-80' : ''}`}
      >
        <AnnouncementBar />
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {isAdmin && (
          <AdminSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
          <AnimatePresence mode="wait">
            <Routes>
              <Route
                path="/"
                element={
                  <PageTransition>
                    <HomePage />
                  </PageTransition>
                }
              />
              <Route
                path="/room/:id"
                element={
                  <PageTransition>
                    <RoomDetail />
                  </PageTransition>
                }
              />
              <Route
                path="/login"
                element={
                  <PageTransition>
                    <LoginPage />
                  </PageTransition>
                }
              />
              <Route
                path="/register"
                element={
                  <PageTransition>
                    <RegisterPage />
                  </PageTransition>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PageTransition>
                    <ForgotPassword />
                  </PageTransition>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PageTransition>
                    <ResetPassword />
                  </PageTransition>
                }
              />
              <Route
                path="/favorites"
                element={
                  <PageTransition>
                    <FavoritesPage />
                  </PageTransition>
                }
              />
              <Route
                path="/live"
                element={
                  <PageTransition>
                    <LiveSheetPage />
                  </PageTransition>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <PageTransition>
                    <MyBookingsPage />
                  </PageTransition>
                }
              />


              {/* Protected Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route
                  path="/admin/import"
                  element={
                    <PageTransition>
                      <AdminImport />
                    </PageTransition>
                  }
                />
                <Route
                  path="/admin/leads"
                  element={
                    <PageTransition>
                      <AdminLeads />
                    </PageTransition>
                  }
                />
                <Route
                  path="/admin/rooms"
                  element={
                    <PageTransition>
                      <AdminRooms />
                    </PageTransition>
                  }
                />
                <Route
                  path="/admin/chat"
                  element={
                    <PageTransition>
                      <AdminChat />
                    </PageTransition>
                  }
                />
              </Route>
            </Routes>
          </AnimatePresence>
        </div>
        <Footer />

        <ChatBox currentUser={user} />
        <GlobalLiveNotification />
        <ChatToast />
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppErrorBoundary><AppContent /></AppErrorBoundary>
    </AuthProvider>
  )
}

export default App
