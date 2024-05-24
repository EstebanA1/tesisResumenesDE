import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

function App() {
  const [currentStage, setCurrentStage] = useState(1);
  const [title, setTitle] = useState('Matriz de Transición');
  const [contextMenu, setContextMenu] = useState(null);
  const [etapas, setEtapas] = useState([
    { id: 1, name: "Etapa 1", title: 'Matriz de transición' },
    { id: 2, name: "Etapa 2", title: 'Calcular rangos o categorizar variables de tonos grises' },
    { id: 3, name: "Etapa 3", title: 'Calcular pesos de evidencia' },
    { id: 4, name: "Etapa 4", title: 'Correlación del mapa de análisis' },
    { id: 5, name: "Etapa 5", title: 'Configurar y ejecutar un modelo de simulación LUCC' },
    { id: 6, name: "Etapa 6", title: 'Validar la simulación utilizando una función decay exponencial' },
    { id: 7, name: "Etapa 7", title: 'Validar simulación utilizando función decay constante de ventanas múltiples' },
    { id: 8, name: "Etapa 8", title: 'Ejecutar simulación con formación de parches' },
    { id: 9, name: "Etapa 9", title: 'Ejecutar simulación con formación de parches y expansión' },
    { id: 10, name: "Etapa 10", title: 'Proyección del proyecto LUCC' },
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

  const generateSummaries = () => {
    // Aquí puedes implementar la lógica para generar resúmenes basados en los archivos subidos.
    // Por ahora, mostramos un resumen de ejemplo.
    const summaries = [
      'Resumen de ejemplo para la etapa actual.',
      'Otro resumen de ejemplo.'
    ];
    return summaries;
  };

  const downloadReport = () => {
    const input = document.getElementById('report');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save('informe.pdf');
    });
  };

  const summaries = generateSummaries();

  return (
    <>
      <div className="app-container"></div>
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
            <button className="beautiful-button" style={{ marginTop: "20px" }} onClick={downloadReport}>Generar Informe</button>
          </div>
          <aside style={{ marginLeft: '15px', width: '40%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', color: 'black', maxHeight: '500px', overflowY: 'auto' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
              <h4 style={{ backgroundColor: '#f8f9fa', margin: 0, padding: '10px 0', width: '100%', textAlign: 'center', fontSize: '24px' }}>Archivos</h4>
            </div>

            <div onClick={handleCloseContextMenu}>
              <ul style={{ marginTop: '20px' }}>
                {files.map(file => (
                  <li key={file.path} style={{ listStyleType: 'none', margin: '10px 0', display: 'flex', alignItems: 'center', width: '100%' }}
                    onContextMenu={(e) => handleRightClick(e, file.path)}>
                    <img src={file.preview} style={{ width: '50px', height: '50px', marginRight: '10px', objectFit: 'cover' }} alt="preview" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'calc(100% - 70px)' }}>{file.path}</span>
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
      </div>
      <div id="report" style={{ display: 'none' }}>
        <h2>Informe de Resúmenes</h2>
        {summaries.map((summary, index) => (
          <div key={index}>
            <h3>Etapa {index + 1}</h3>
            <p>{summary}</p>
            <Bar
              data={{
                labels: ['Categoría 1', 'Categoría 2', 'Categoría 3'],
                datasets: [
                  {
                    label: 'Datos de ejemplo',
                    data: [12, 19, 3],
                    backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(75, 192, 192, 0.2)'],
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default App;