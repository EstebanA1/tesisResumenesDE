import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";


function App() {
  const [currentStage, setCurrentStage] = useState(1);
  const [title, setTitle] = useState('Matriz de Transición'); // Estado inicial para el título
  const [contextMenu, setContextMenu] = useState(null);
  const [etapas, setEtapas] = useState([
    { id: 1, name: "Etapa 1", title: 'Matriz de transición' },
    { id: 2, name: "Etapa 2", title: 'Calcular rangos o categorizar variables de tonos grices' },
    { id: 3, name: "Etapa 3", title: 'Calcular pesos de evidencia' },
    { id: 4, name: "Etapa 4", title: 'Correlacion del mapa de analisi' },
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
  }, []); // Añade aquí las dependencias si handleCloseContextMenu las tiene

  // Efecto para manejar clics fuera del menú contextual
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

  // Efecto para vaciar los archivos cuando cambia la etapa
  useEffect(() => {
    // Esta función se ejecutará cada vez que `currentStage` cambie.
    setFiles([]); // Establece `files` a un arreglo vacío, eliminando los archivos existentes.
  }, [currentStage]); // Dependencias del efecto: el efecto se ejecuta cada vez que `currentStage` cambia.


  const handleStageClick = (etapaId) => {
    const etapaSeleccionada = etapas.find(etapa => etapa.id === etapaId);
    if (etapaSeleccionada) {
      setCurrentStage(etapaId);
      setTitle(etapaSeleccionada.title); // Actualiza el título basado en la etapa seleccionada
    }
  };

  const handleEtapaClick = useCallback((etapaId) => {
    setCurrentStage(etapaId);
    // Aquí puedes redirigir al usuario a la página de esa etapa específica y mostrar los archivos subidos en esa etapa
  }, []);



  const handleRightClick = (event, filePath) => {
    event.preventDefault(); // Prevenir el menú contextual predeterminado del navegador
    setContextMenu({
      filePath, // Almacenar el path del archivo en lugar de fileId
      xPos: event.pageX + 'px',
      yPos: event.pageY + 'px',
    });
  };

  const handleDeleteFile = (filePath) => {
    setFiles(files.filter(file => file.path !== filePath)); // Usar file.path para identificar el archivo a eliminar
    setContextMenu(null); // Cerrar el menú contextual después de eliminar
  };

  return (
    <><div className="app-container"></div>
      <h1 className="title-container">{title}</h1>
      <div className="container" style={{ display: "flex", justifyContent: "space-between" }}>
        <nav style={{ width: "30%", marginRight: "50px" }}>
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
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "center", gap: "20px", width: "100%" }}>
          <div style={{ width: "40%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <form style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div {...getRootProps()} className="dropzone" style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cccccc' }}>
                <input {...getInputProps()} />
                {isDragActive ?
                  <p>Suelta los archivos aquí o</p> :
                  <p>Suelta los archivos aquí, o haz clic para seleccionar archivos</p>}
              </div>
            </form>
            <button className="beautiful-button" style={{ marginTop: "20px" }}>Generar Informe</button>
          </div>
          <aside style={{ marginLeft: '15px', width: '40%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', color: 'black', maxHeight: '500px', overflowY: 'auto' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
              <h4 style={{ backgroundColor: '#f8f9fa', margin: 0, padding: '10px 0', width: '100%', textAlign: 'center', fontSize: '24px' }}>Archivos</h4>
            </div>

            <div onclick={handleCloseContextMenu}>
              <ul style={{ marginTop: '20px' }}>
                {files.map(file => (
                  <li key={file.path} style={{ listStyleType: 'none', margin: '10px 0', display: 'flex', alignItems: 'center', width: '100%' }}
                    onContextMenu={(e) => handleRightClick(e, file.path)}> {/* Pasar file.path aquí */}
                    <img src={file.preview} style={{ width: '50px', height: '50px', marginRight: '10px', objectFit: 'cover' }} alt="preview" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'calc(100% - 70px)' }}>{file.path}</span>
                  </li>
                ))}
              </ul>

              {contextMenu && (
                <ul
                  className="context-menu" // Asegúrate de que este className sea único y se use solo para el menú contextual
                  style={{
                    position: 'absolute',
                    top: contextMenu.yPos,
                    left: contextMenu.xPos,
                    listStyleType: 'none',
                    padding: '10px',
                    backgroundColor: 'white',
                    border: '1px solid black',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleDeleteFile(contextMenu.filePath)}
                >
                  <li>Eliminar</li>
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div></>
  );
}

export default App;
