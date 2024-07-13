import "./App.css";
import { useDropzone } from "react-dropzone";
import { generarInforme } from './informe.jsx';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import React, { useState, useEffect, useCallback } from "react";
import HelpIcon from '@mui/icons-material/Help';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function App() {
    const [currentStage, setCurrentStage] = useState(1);
    const [title, setTitle] = useState('Matriz de Transición');
    const [contextMenu, setContextMenu] = useState(null);
    const [etapas, setEtapas] = useState([
        { id: 1, name: "Etapa 1", title: 'Matriz de transición' },
        { id: 2, name: "Etapa 2", title: 'Calcular rangos o categorizar variables de tonos grices' },
        { id: 3, name: "Etapa 3", title: 'Calcular pesos de evidencia' },
        { id: 4, name: "Etapa 4", title: 'Correlacion del mapa de analisis' },
        { id: 5, name: "Etapa 5", title: 'Configurar y ejecutar un modelo de simulacion LUCC' },
        { id: 6, name: "Etapa 6", title: 'Validar la simulacion utilizando una funcion dacay exponencial' },
        { id: 7, name: "Etapa 7", title: 'Validar simulacion utilizando funcion dacay constante de ventanas multiples' },
        { id: 8, name: "Etapa 8", title: 'Ejecutar simulacion con formacion de parches' },
        { id: 9, name: "Etapa 9", title: 'Ejecutar simulacion con formacion de parches y expansión' },
        { id: 10, name: "Etapa 10", title: 'Proyeccion del proyecto LUCC' },
    ]);

    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [totalFiles, setTotalFiles] = useState(2);
    const [successfulUploads, setSuccessfulUploads] = useState(0);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    const onDrop = useCallback((acceptedFiles) => {
        const validFiles = acceptedFiles.filter(file => file.type === 'text/csv' || file.name.endsWith('.xlsm') || file.name.endsWith('.xlsx'));
        const newFilesCount = files.length + validFiles.length;

        if (newFilesCount > 2) {
            alert("No puedes subir más de 2 archivos.");
            return;
        }

        let successCount = 0;

        validFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadstart = () => {
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: 0
                }));
            };
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded * 100) / event.total);
                    setUploadProgress(prev => ({
                        ...prev,
                        [file.name]: progress
                    }));
                }
            };
            reader.onloadend = () => {
                successCount++;
                setFiles(prevFiles => [...prevFiles, Object.assign(file, {
                    preview: URL.createObjectURL(file)
                })]);
                setSuccessfulUploads(prevSuccessful => prevSuccessful + 1);
            };
            if (file.name.endsWith('.xlsm') || file.name.endsWith('.xlsx')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }, [files]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: 'text/csv, .xlsm, .xlsx',
        maxFiles: 2 - files.length
    });

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (contextMenu && !event.target.closest('.context-menu')) {
                handleCloseContextMenu();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [contextMenu, handleCloseContextMenu]);

    useEffect(() => {
        setFiles([]);
        setTotalFiles(2);
        setSuccessfulUploads(0);
    }, [currentStage]);

    const handleStageClick = (etapaId) => {
        const etapaSeleccionada = etapas.find(etapa => etapa.id === etapaId);
        if (etapaSeleccionada) {
            setCurrentStage(etapaId);
            setTitle(etapaSeleccionada.title);
        }
    };

    const handleDeleteFile = (filePath) => {
        setFiles(files.filter(file => file.path !== filePath));
        setContextMenu(null);
        setSuccessfulUploads(prevSuccessful => prevSuccessful - 1);
    };

    const handleGenerateReport = async (e) => {
        e.preventDefault();
        if (files.length < 2) {
            alert("Se necesitan 2 archivos, un diccionario y el archivo intermedio de DINAMICA EGO");
            return;
        }
        setIsLoading(true);
        setProgress(0);
        try {
            const etapaSeleccionada = etapas.find(etapa => etapa.id === currentStage);
            const url = await generarInforme(files, etapaSeleccionada, (progress) => {
                setProgress(progress);
            });
            setPdfPreviewUrl(url);
        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setIsLoading(false);
        }
    };
    const closePdfPreview = () => {
        setPdfPreviewUrl(null);
    };

    function CircularProgressWithLabel(props) {
        return (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" {...props} />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="caption" component="div" color="text.secondary">
                        {`${Math.round(props.value)}%`}
                    </Typography>
                </Box>
            </Box>
        );
    }

    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    return (
        <div className="app-container">
            <nav className="nav-container">
                <div className="etapas-container">
                    {etapas.map((etapa) => (
                        <button
                            variant="contained"
                            color="primary"
                            key={etapa.id}
                            className={`etapa ${currentStage === etapa.id ? 'active' : ''}`}
                            onClick={() => handleStageClick(etapa.id)}
                        >
                            {<AssignmentIcon />} {etapa.name}
                        </button>
                    ))}
                </div>
            </nav>
            <h1 className="title-container">{title}</h1>

            <button
                variant="contained"
                color="secondary"
                className="load-files-button" onClick={() => document.querySelector('.dropzone input').click()}>
                {<FileUploadIcon />} Cargar archivos
            </button>

            {/* <button><HelpIcon/></button> */}

            <div className="main-container">
                <div className="upload-container">
                    <form className="upload-form" onSubmit={handleGenerateReport}>
                        <div {...getRootProps()} className="dropzone">
                            <input {...getInputProps({ accept: 'text/csv, .xlsm, .xlsx' })} />
                            {isDragActive ? (
                                <p>Suelta los archivos aquí...</p>
                            ) : (
                                <p>Arrastra y suelta archivos aquí, o haz clic para seleccionar archivos</p>
                            )}
                        </div>
                        <br />
                        <button className="beautiful-button" type="submit" disabled={files.length < 2 || isLoading}>
                            {isLoading ? 'Generando...' : 'Generar Informe'}
                        </button>
                        {isLoading && (
                            <div className="loader-container">
                                <CircularProgressWithLabel value={progress} />
                            </div>
                        )}
                    </form>
                </div>
                {contextMenu && (
                    <div
                        className="context-menu"
                        style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
                    >
                        <button className="context-menu-item" onClick={() => handleDeleteFile(contextMenu.filePath)}>Eliminar archivo</button>
                    </div>
                )}

                {pdfPreviewUrl && (
                    <div className="pdf-preview-overlay">
                        <div className="pdf-preview">
                            <button className="close-button" onClick={closePdfPreview}>
                                <CloseIcon />
                            </button>
                            <iframe src={pdfPreviewUrl} width="100%" height="100%" title="Vista previa del informe"></iframe>
                        </div>
                    </div>
                )}
            </div>

            <div className="file-counter">
                {successfulUploads}/{totalFiles}
            </div>
        </div>
    );
}

export default App;
