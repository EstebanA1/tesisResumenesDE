import React, { useState } from 'react';
import api from '../../axiosConfig'; // Configuración de Axios
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Opcional: Estilos personalizados

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Confirmar que setIsAuthenticated está llegando correctamente
  console.log('setIsAuthenticated:', typeof setIsAuthenticated);

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      console.log('Datos enviados:', { email, password });
  
      const response = await api.post('/login', { email, password });
      console.log('Respuesta del servidor:', response.data);
  
      setIsAuthenticated(true); // Si el login es exitoso, cambia el estado
      navigate('/home');
    } catch (err) {
      console.error('Error en la solicitud:', err.response?.data || err.message);
      setError(err.response?.data?.[0] || 'Error al iniciar sesión.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="icon">👤</div>
        <h2 className="login-title">Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <button type="submit" className="login-button">
            Ingresar
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
        <div className="checkbox-container">
          <a href="/tesisResumenesDE/register">¿No tienes cuenta? Regístrate</a>
        </div>
      </div>
    </div>
  );
};

export default Login;


