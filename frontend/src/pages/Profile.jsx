import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Asegúrate de usar React Router
import './Profile.css';


const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [reports, setReports] = useState([]);
    const [selectedReportUrl, setSelectedReportUrl] = useState(null); // Para manejar el visor de informes
    const navigate = useNavigate(); // Hook para la navegación


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/perfil', {
                    credentials: 'include', // Esto asegura que las cookies se envíen
                });

                if (!response.ok) {
                    throw new Error('Error al obtener los datos del usuario');
                }

                const user = await response.json();
                setUserData(user);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const fetchReports = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/reports', { // Cambia a 5000
                    credentials: 'include', // Enviar cookies
                });

                if (!response.ok) {
                    throw new Error('Error al obtener los informes');
                }

                const reportsData = await response.json();
                setReports(reportsData);
            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        };

        fetchUserData();
        fetchReports();
    }, []);

    const handleViewReport = (url) => {
        console.log("URL del informe:", url);
        setSelectedReportUrl(url);
    };

    const handleDeleteReport = async (id) => {
        try {
            const response = await fetch(`http://localhost:3000/api/reports/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el informe');
            }

            // Actualiza la lista de informes después de eliminar
            setReports((prevReports) => prevReports.filter((report) => report._id !== id));
        } catch (error) {
            console.error('Error deleting report:', error);
        }
    };


    if (!userData) {
        return <div className="profile-loading">Cargando datos del usuario...</div>;
    }

    return (
        <div className="profile-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                Volver
            </button>
            <h1 className="profile-header">Perfil de Usuario</h1>
            <div className="profile-section">
                <h2>Información del Usuario</h2>
                <div className="profile-info">
                    <p><strong>Nombre de usuario:</strong> {userData.username}</p>
                    <p><strong>Email:</strong> {userData.email}</p>
                </div>
            </div>
            <div className="profile-section">
                <h2>Informes Generados</h2>
                {reports.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre del Informe</th>
                                    <th>Etapa</th>
                                    <th>URL</th>
                                    <th>Fecha de Creación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr key={report._id}>
                                        <td>{report.reportName}</td>
                                        <td>{report.stage}</td>
                                        <td>
                                            <button className="view-report-button" onClick={() => handleViewReport(report.reportUrl)}>
                                                Ver Informe
                                            </button>
                                        </td>
                                        <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="delete-report-button" onClick={() => handleDeleteReport(report._id)}>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="no-reports">No hay informes generados</p>
                )}
            </div>
            {selectedReportUrl && (
                <div className="pdf-viewer-overlay">
                    <div className="pdf-viewer">
                        <iframe
                            src={selectedReportUrl}
                            title="PDF Viewer"
                            frameBorder="0"
                        />
                    </div>
                    <button
                        className="close-button"
                        onClick={() => setSelectedReportUrl(null)}
                    >
                        Cerrar
                    </button>
                </div>
            )}

        </div>
    );
};

export default Profile;
