import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";

function App() {
  const [currentStage, setCurrentStage] = useState(1);
  const [title, setTitle] = useState('Matriz de transición');
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
  const [report, setReport] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => file.type === 'image/jpeg' || file.type === 'image/png');
    setFiles(prevFiles => [...prevFiles, ...validFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))]);
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

  return (
    <><div className="app-container"></div>
      <h1 className="title-container">{title}</h1>

      <div className="big-container">
        <nav>
          <div className="etapas-container">
            {etapas.map((etapa) => (
              <button
                key={etapa.id}
                className={`etapa ${currentStage === etapa.id ? 'active' : ''}`}
                onClick={() => handleStageClick(etapa.id)}
              >
                {etapa.name}
              </button>
            ))}
          </div>
        </nav>

        <div className="dropzone-and-buttom">
          <form>
            <div className="dropzone" {...getRootProps()}>
              <input {...getInputProps()} />
              {isDragActive ?
                <p>Suelta los archivos aquí, o haz clic para seleccionar archivos</p> :
                <p>Suelta los archivos aquí, o haz clic para seleccionar archivos</p>}
            </div>
          </form>
          <button className="beautiful-button">Generar Informe</button>
        </div>

        <aside>
          <div className="preview-container">
            <h4>Archivos</h4>
          </div>

          <div onClick={handleCloseContextMenu}>
            <ul className="file-list">
              {files.map(file => (
                <li key={file.path}
                  onContextMenu={(e) => handleRightClick(e, file.path)}>
                  <img src={file.preview} className="file-preview" alt="preview" />
                  <span className="file-path">{file.path}</span>
                </li>
              ))}
            </ul>

            {contextMenu && (
              <ul
                className="context-menu"
                style={{
                  position: 'absolute',
                  top: contextMenu.yPos,
                  left: contextMenu.xPos,
                }}
                onClick={() => handleDeleteFile(contextMenu.filePath)}
              >
                <li>Eliminar</li>
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

export default App;
