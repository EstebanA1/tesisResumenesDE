import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { generarInforme } from './Informe.jsx';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import imagen1 from '../src/imagenes/imagen1.webp';
import imagen2 from '../src/imagenes/imagen2.webp';

function App() {
    const [currentStage, setCurrentStage] = useState(1);
    const [title, setTitle] = useState('Matriz de Transición');
    const [etapas, setEtapas] = useState([
        { id: 1, name: "Etapa 1", title: 'Matriz de transición' }, // Cambios por área
        { id: 2, name: "Etapa 2", title: 'Pesos de evidencia' },
    ]);

    const [showCarousel, setShowCarousel] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null);
    const [dictionary, setDictionary] = useState(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [shakeElements, setShakeElements] = useState({
        dropzone: false,
        dictionary: false
    });

    useEffect(() => {
        setImages([
            imagen1,
            imagen2,
        ]);
    }, []);

    const toggleHelp = () => {
        setShowCarousel(!showCarousel);
        setCurrentImageIndex(0);
    };

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: currentStage === 1
            ? { 'text/csv': ['.csv'] }
            : { 'application/octet-stream': ['.dcf'] },
        maxFiles: 1,
        multiple: false
    });

    const handleDictionaryAction = useCallback(() => {
        if (dictionary) {
            setDictionary(null);
        } else {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xlsm';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    setDictionary(file);
                }
            };
            input.click();
        }
    }, [dictionary]);

    const handleGenerateReport = async (e) => {
        e.preventDefault();
        if (!file || !dictionary || isLoading) {
            setShakeElements({
                dropzone: !file,
                dictionary: !dictionary
            });
            setTimeout(() => setShakeElements({ dropzone: false, dictionary: false }), 820);
            return;
        }
        setIsLoading(true);
        setProgress(0);
        try {
            const etapaSeleccionada = etapas.find(etapa => etapa.id === currentStage);
            const url = await generarInforme([file, dictionary], etapaSeleccionada, (progress) => {
                setProgress(progress);
            });
            setPdfPreviewUrl(url);
        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStageClick = (etapaId) => {
        const etapaSeleccionada = etapas.find(etapa => etapa.id === etapaId);
        if (etapaSeleccionada) {
            setCurrentStage(etapaId);
            setTitle(etapaSeleccionada.title);
            setFile(null);
        }
    };

    const closePdfPreview = () => {
        setPdfPreviewUrl(null);
        setFile(null);
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

    return (
        <div className="app-container">
            <nav className="nav-container">
                <div className="etapas-container">
                    {etapas.map((etapa) => (
                        <button
                            key={etapa.id}
                            className={`etapa ${currentStage === etapa.id ? 'active' : ''}`}
                            onClick={() => handleStageClick(etapa.id)}
                        >
                            <AssignmentIcon /> {etapa.name}
                        </button>
                    ))}
                </div>
            </nav>
            <h1 className="title-container">{title}</h1>
            <button
                className={`load-files-button ${dictionary ? 'dictionary-loaded' : ''} ${shakeElements.dictionary ? 'shake' : ''}`}
                onClick={handleDictionaryAction}
                type="button"
            >
                {dictionary ? 'Eliminar Diccionario' : 'Subir Diccionario'}
                {dictionary ? <DeleteIcon /> : <FileUploadIcon />}
            </button>

            <div className="main-container">
                <div className="upload-container">
                    <form className="upload-form" onSubmit={handleGenerateReport}>
                        <div
                            {...getRootProps({
                                className: `dropzone ${shakeElements.dropzone ? 'shake' : ''}`
                            })}
                        >
                            <input {...getInputProps()} />
                            {isDragActive ? (
                                <p>Suelta el archivo aquí...</p>
                            ) : (
                                <p>
                                    {!file
                                        ? `Arrastra y suelta un archivo ${currentStage === 1 ? 'CSV' : 'DCF'} aquí, o haz clic para seleccionarlo`
                                        : `Archivo ${currentStage === 1 ? 'CSV' : 'DCF'} cargado. Puedes reemplazarlo arrastrando otro archivo aquí.`}
                                </p>
                            )}
                        </div>
                        <button
                            className="help-button"
                            onClick={toggleHelp}
                            type="button"
                        >
                            ?
                        </button>
                        <button
                            className="beautiful-button"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Generando...' : 'Generar Informe'}
                        </button>
                        {isLoading && (
                            <div className="loader-container">
                                <CircularProgressWithLabel value={progress} />
                            </div>
                        )}
                    </form>
                </div>

                {showCarousel && (
                    <div className="carousel-overlay">
                        <div className="carousel-content">
                            <button className="carousel-close-button" onClick={toggleHelp}>
                                <CloseIcon />
                            </button>
                            <img src={images[currentImageIndex]} alt={`Ayuda ${currentImageIndex + 1}`} />
                            <button className="carousel-nav-button prev" onClick={prevImage}>
                                <ArrowBackIosIcon />
                            </button>
                            <button className="carousel-nav-button next" onClick={nextImage}>
                                <ArrowForwardIosIcon />
                            </button>
                            <div className="carousel-indicators">
                                {images.map((_, index) => (
                                    <span
                                        key={index}
                                        className={`carousel-indicator ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    />
                                ))}
                            </div>
                        </div>
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
        </div>
    );
}

export default App;