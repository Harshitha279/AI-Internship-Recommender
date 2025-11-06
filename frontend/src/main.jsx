import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import UnifiedAuth from './UnifiedAuth'
import App from './App' // Your existing 936-line student app
import AdminDashboard from './AdminDashboard'
import CompanyDashboard from './CompanyDashboard'
import './index.css'

// Protected Route for Students
const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  
  return user ? children : <Navigate to="/" />;
};

// Admin Route
const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem("userType") === "admin" && localStorage.getItem("adminToken") === "admin-access-granted";
  return isAdmin ? children : <Navigate to="/" />;
};

// Company Route  
const CompanyRoute = ({ children }) => {
  const isCompany = localStorage.getItem("userType") === "company" && localStorage.getItem("companyToken") === "company-access-granted";
  return isCompany ? children : <Navigate to="/" />;
};

function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UnifiedAuth />} />
          <Route path="/student" element={<StudentRoute><App /></StudentRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/company" element={<CompanyRoute><CompanyDashboard /></CompanyRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)