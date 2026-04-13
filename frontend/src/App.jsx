//frontend/src/App.jsx
import { useState } from 'react'
import './App.css'
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Login from './routes/Login';
import AdminDashboard from './routes/AdminDashboard';
import AdminRoute from './routes/AdminRoute';
import AdminAnalytics from './routes/AdminAnalytics';
import LandingPage from './routes/customer/LandingPage';
import MenuPage from './routes/customer/MenuPage';
import CartPage from './routes/customer/CartPage';
import OrderSummaryPage from './routes/customer/OrderSummaryPage';
import CustomerLogin from './routes/customer/CustomerLogin';
import CustomerProfile from './routes/customer/CustomerProfile';
import { SessionProvider } from './context/SessionContext';
import ARViewer from './ar/ARViewer';
import { AuthProvider } from './context/AuthContext';
import AdminOrders from './routes/Admin Orders';
import { LanguageProvider } from './context/LanguageContext.jsx'; // ← Add this import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer routes wrapped with LanguageProvider */}
        <Route path="/" element={
          <LanguageProvider>
            <SessionProvider>
              <LandingPage/>
            </SessionProvider>
          </LanguageProvider>
        } />
        
        <Route path="/ar" element={
          <LanguageProvider>
            <ARViewer />
          </LanguageProvider>
        } />
        
        <Route path="/restaurant/:restaurantId/*" element={
          <LanguageProvider>
            <SessionProvider>
              <Routes>
                <Route path="menu" element={<MenuPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="order-summary" element={<OrderSummaryPage />} />
              </Routes>
            </SessionProvider>
          </LanguageProvider>
        } />

        <Route path="/customer/login" element={
          <LanguageProvider>
            <SessionProvider>
              <CustomerLogin/>
            </SessionProvider>
          </LanguageProvider>
        } />
        
        <Route path="/customer/profile" element={
          <LanguageProvider>
            <SessionProvider>
              <CustomerProfile/>
            </SessionProvider>
          </LanguageProvider>
        } />

        {/* Admin routes WITHOUT LanguageProvider */}
        <Route path="/login" element={
          <AuthProvider>
            <Login />
          </AuthProvider>
        } />
        
        <Route path="/admin" element={
          <AuthProvider>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </AuthProvider>
        } />
        
        <Route path="/admin/analytics" element={
          <AuthProvider>
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          </AuthProvider>
        } />

        <Route path="/admin/orders" element={
          <AuthProvider>
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          </AuthProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
