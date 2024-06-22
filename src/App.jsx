import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import AssignmentIcon from '@mui/icons-material/Assignment';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import "./App.css";

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
    { id: 7, name: "Etapa 7", title: 'Validar simulacion utilizando funcion dacay constante de                                                                          ventanas multiples' },
    { id: 8, name: "Etapa 8", title: 'Ejecutar simulacion con formacion de parches' },
    { id: 9, name: "Etapa 9", title: 'Ejecutar simulacion con formacion de parches y expansión' },
    { id: 10, name: "Etapa 10", title: 'Proyeccion del proyecto LUCC' },
  ]);

  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [totalFiles, setTotalFiles] = useState(0);
  const [successfulUploads, setSuccessfulUploads] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => file.type === 'image/jpeg' || file.type === 'image/png');
    setTotalFiles(prevTotal => prevTotal + validFiles.length);
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
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.png, .jpeg, .jpg'
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
    setTotalFiles(0);
    setSuccessfulUploads(0);
  }, [currentStage]);

  const handleStageClick = (etapaId) => {
    const etapaSeleccionada = etapas.find(etapa => etapa.id === etapaId);
    if (etapaSeleccionada) {
      setCurrentStage(etapaId);
      setTitle(etapaSeleccionada.title);
    }
  };

  const handleEtapaClick = useCallback((etapaId) => {
    setCurrentStage(etapaId);
  }, []);

  const handleRightClick = (event, filePath) => {
    event.preventDefault();
    setContextMenu({
      filePath,
      xPos: event.pageX + 'px',
      yPos: event.pageY + 'px',
    });
  };

  const handleDeleteFile = (filePath) => {
    setFiles(files.filter(file => file.path !== filePath));
    setContextMenu(null);
  };

  const handleGenerateReport = () => {
    // Lógica para generar el informe
    // Después de generar el informe, reiniciar el contador
    setFiles([]);
    setTotalFiles(0);
    setSuccessfulUploads(0);
  };

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

      <div className="main-container">
        <div className="upload-container">
          <form className="upload-form">
            <div {...getRootProps()} className="dropzone">
              <input {...getInputProps()} />
              {isDragActive ?
                <p>Suelta los archivos aquí, o haz clic para seleccionar archivos</p> :
                <p>Suelta los archivos aquí, o haz clic para seleccionar archivos</p>}
            </div>
          </form>
          <div className="button-container">
            <button className="beautiful-button" onClick={handleGenerateReport}>Generar Informe</button>
            <p className={`files-counter ${successfulUploads === totalFiles ? 'success' : 'error'}`}>
              {successfulUploads}/{totalFiles}
            </p>
          </div>
        </div>
      </div>
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.yPos,
            left: contextMenu.xPos
          }}
        >
          <button onClick={() => handleDeleteFile(contextMenu.filePath)}>Eliminar</button>
        </div>
      )}
    </div>
  );
}

export default App;
