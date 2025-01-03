import React, { useState, useEffect } from 'react';
import AppRoutes from './routes';
import axios from './../axiosConfig';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/perfil');
        if (response.data) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('No autenticado', err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AppRoutes
      isAuthenticated={isAuthenticated}
      setIsAuthenticated={setIsAuthenticated}
    />
  );
};

export default App;



