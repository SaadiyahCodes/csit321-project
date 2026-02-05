//frontend/src/App.jsx
import { useState } from 'react'
import './App.css'
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Login from './routes/Login';
import AdminDashboard from './routes/AdminDashboard';
import AdminRoute from './routes/AdminRoute';
import LandingPage from './routes/customer/LandingPage';
import MenuPage from './routes/customer/MenuPage';
import DishPreviewPage from './routes/customer/DishPreviewPage';
import DishCustomizationPage from './routes/customer/DishCustomizationPage';
import CartPage from './routes/customer/CartPage';
import OrderSummaryPage from './routes/customer/OrderSummaryPage';
import CustomerLogin from './routes/customer/CustomerLogin';
import CustomerProfile from './routes/customer/CustomerProfile';
import { SessionProvider } from './context/SessionContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        
        {/* Wrap restaurant routes with SessionProvider */}
        <Route path="/restaurant/:restaurantId/*" element={
          <SessionProvider>
            <Routes>
              <Route path="menu" element={<MenuPage />} />
              <Route path="dish/:dishId" element={<DishPreviewPage />} />
              <Route path="customize/:dishId" element={<DishCustomizationPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="order-summary" element={<OrderSummaryPage />} />
            </Routes>
          </SessionProvider>
        } />

        {/*Admin Portal */}
        <Route path="/login" element={<Login/>} />

        {/* Customer Login */}
        <Route path="/customer/login" element={<CustomerLogin/>} />
        <Route path="/customer/profile" element={<CustomerProfile/>} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
