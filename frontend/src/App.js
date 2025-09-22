import React, { useContext, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ScrollToTop from './ScrollToTop';

// 🏠 Pages
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import TheatersPage from './pages/TheatersPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookMovie from './pages/BookMovie';
import BookingHistory from './pages/BookingHistory';
import MyBookings from './pages/MyBookings';
import BookingSummary from './pages/BookingSummary';
import AdminDashboard from './pages/admin/AdminDashboard';
import AddMovie from './pages/admin/AddMovie'; 
import EditMovie from './pages/admin/EditMovie'; 
import EditProfile from './pages/EditProfile';
import ForgotPassword from './pages/ForgotPassword';

// 🔐 Protected Route wrapper
const ProtectedRoute = ({ isAuthenticated, children }) =>
  isAuthenticated ? children : <Navigate to="/login" replace />;

// 🛡️ Admin Route wrapper
const AdminRoute = ({ isAuthenticated, isAdmin, children }) =>
  isAuthenticated && isAdmin ? children : <Navigate to="/" replace />;

function App() {
  const { isAuthenticated, user } = useContext(AuthContext);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const Protected = ({ children }) => (
    <ProtectedRoute isAuthenticated={isAuthenticated}>{children}</ProtectedRoute>
  );

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Toaster position="top-right" reverseOrder={false} />
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
        <Routes>
          {/* 🌐 Public Routes */}
          <Route path="/" element={<Home user={user} />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/theaters" element={<TheatersPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* 🔐 Auth Routes */}
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
          />
          <Route
            path="/signup"
            element={!isAuthenticated ? <Signup /> : <Navigate to="/" replace />}
          />

          <Route path="/profile/edit" element={<EditProfile />} />

          {/* 🎟️ Protected Routes */}
          <Route path="/book/:id" element={<Protected><BookMovie /></Protected>} />
          <Route path="/bookings" element={<Protected><BookingHistory /></Protected>} />
          <Route path="/my-bookings" element={<Protected><MyBookings /></Protected>} />
          <Route path="/my-bookings/:id" element={<Protected><BookingSummary /></Protected>} />

          {/* 🛡️ Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/add-movie"
            element={
              <AdminRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
                <AddMovie />
              </AdminRoute>
            }
          />
          <Route path="/admin/edit-movie/:movieId" element={<EditMovie />} />

          {/* 🚫 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;