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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <SessionProvider>
            <LandingPage/>
          </SessionProvider>
        } />
        <Route path="/ar" element={<ARViewer />} />
        {/* Wrap restaurant routes with SessionProvider */}
        <Route path="/restaurant/:restaurantId/*" element={
          <SessionProvider>
            <Routes>
              <Route path="menu" element={<MenuPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="order-summary" element={<OrderSummaryPage />} />
            </Routes>
          </SessionProvider>
        } />

        {/*Admin Portal */}
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

        {/* Customer Login */}
        <Route path="/customer/login" element={
          <SessionProvider>
            <CustomerLogin/>
          </SessionProvider>
        } />
        <Route path="/customer/profile" element={
          <SessionProvider>
            <CustomerProfile/>
          </SessionProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
