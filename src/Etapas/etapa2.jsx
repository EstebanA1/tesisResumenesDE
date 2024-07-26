import { jsPDF } from 'jspdf';

export const generarInformeEtapa2 = async (files, etapaSeleccionada, onProgress) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Informe para ${etapaSeleccionada.name}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Este informe para ${etapaSeleccionada.title} está en desarrollo.`, 20, 40);
    
    onProgress(100);
    return doc.output('bloburl');
};