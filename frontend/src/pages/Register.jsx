import React, { useState } from 'react';
import api from '../../axiosConfig';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setError('');
    setSuccessMessage(''); 
    setIsLoading(true); 

    try {
      await api.post('/register', {
        username,
        email,
        password,
      });

      setSuccessMessage('Registro exitoso. Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        window.location.href = '/tesisResumenesDE/'; 
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.[0] || 'Error al registrarse. Intenta nuevamente.');
    } finally {
      setIsLoading(false);  
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="icon">👤</div>
        <h2 className="register-title">Regístrate</h2>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Nombre completo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="register-input"
            required
          />
          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        {error && <p className="register-error">{error}</p>}
        {successMessage && <p className="register-success">{successMessage}</p>}
        <p>
          ¿Ya tienes cuenta? <a href="/tesisResumenesDE/login">Iniciar Sesión</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
