import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [reports, setReports] = useState([]);
    const [selectedReportUrl, setSelectedReportUrl] = useState(null);
    const [editingReportId, setEditingReportId] = useState(null);
    const [editedReportName, setEditedReportName] = useState('');
    const navigate = useNavigate();

    const fetchReports = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/reports', {
                credentials: 'include',
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

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/perfil', {
                    credentials: 'include',
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

        fetchUserData();
        fetchReports();
    }, []);

    const handleViewReport = (url) => {
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

            setReports((prevReports) => prevReports.filter((report) => report._id !== id));
        } catch (error) {
            console.error('Error deleting report:', error);
        }
    };

    const handleEditReportName = (id, name) => {
        setEditingReportId(id);
        setEditedReportName(name);
    };

    const handleNameChange = (e) => {
        setEditedReportName(e.target.value);
    };

    const handleSaveReportName = async () => {
        if (editedReportName.trim() === '') return;

        try {
            console.log('Intentando actualizar informe con ID:', editingReportId);
            console.log('Nuevo nombre:', editedReportName);

            const response = await fetch(`http://localhost:3000/api/reports/${editingReportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ reportName: editedReportName })
            });

            console.log('Respuesta del servidor:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el informe');
            }

            const updatedReport = await response.json();
            console.log('Informe actualizado:', updatedReport);

            setReports(prevReports =>
                prevReports.map(report =>
                    report._id === editingReportId
                        ? { ...report, reportName: updatedReport.reportName }
                        : report
                )
            );

            setEditingReportId(null);
            setEditedReportName('');

        } catch (error) {
            console.error('Error completo:', error);
            alert('Error al actualizar el nombre del informe. Por favor, intenta de nuevo.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSaveReportName();
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
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <tr key={report._id}>
                                        <td>
                                            {editingReportId === report._id ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={editedReportName}
                                                        onChange={handleNameChange}
                                                        onBlur={handleSaveReportName}
                                                        onKeyPress={handleKeyPress}
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <span
                                                    onClick={() => handleEditReportName(report._id, report.reportName)}
                                                    className="editable-name"
                                                >
                                                    {report.reportName}
                                                </span>
                                            )}
                                        </td>
                                        <td>{report.stage}</td>
                                        <td>
                                            <button className="view-report-button" onClick={() => handleViewReport(report.reportUrl)}>
                                                Ver Informe
                                            </button>
                                        </td>
                                            <td>
                                                {new Date(report.createdAt).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: true,
                                                })},{" "}
                                                {new Date(report.createdAt)
                                                    .toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                    })
                                                    .replace(/\//g, '/')}
                                            </td>
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