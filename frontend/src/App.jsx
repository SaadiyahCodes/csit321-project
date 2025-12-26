//frontend/src/App.jsx
import { useState } from 'react'
import './App.css'
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Login from './routes/Login';
import AdminDashboard from './routes/AdminDashboard';
import AdminRoute from './routes/AdminRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />

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
