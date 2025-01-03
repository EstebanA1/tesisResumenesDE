import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../Home';
import Profile from '../pages/Profile'; 

const AppRoutes = ({ setIsAuthenticated, isAuthenticated }) => {
  return (
    <Router basename="/tesisResumenesDE">
      <Routes>
        <Route
          path="/login"
          element={<Login setIsAuthenticated={setIsAuthenticated} />}
        />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/perfil" element={<Profile />} /> 
        <Route path="/" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;

