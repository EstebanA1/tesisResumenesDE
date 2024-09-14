import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import 'jspdf-autotable';

export const generarInformeEtapa2 = async (files, etapaSeleccionada, onProgress) => {
    let diccionario = {};
    let dcfContent = '';
    onProgress(5);

    // Leer archivo .xlsx para el diccionario
    const diccionarioFile = files.find(file => file.name.endsWith('.xlsm') || file.name.endsWith('.xlsx'));
    if (diccionarioFile) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await diccionarioFile.arrayBuffer());
        const worksheet = workbook.getWorksheet(1);
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const [id, description] = row.values.slice(1);
                if (id !== undefined && description !== undefined) {
                    diccionario[id.toString()] = description.trim();
                }
            }
        });
        console.log('Diccionario completo:', diccionario);
    }
    onProgress(20);

    // Leer archivo .dcf
    const dcfFile = files.find(file => file.name.endsWith('.dcf'));
    if (!dcfFile) {
        throw new Error("No se encontró un archivo .dcf");
    }
    dcfContent = await dcfFile.text();
    console.log('Contenido del archivo .dcf:', dcfContent);
    onProgress(40);

    // Procesar el contenido del archivo .dcf
    const lines = dcfContent.split('\n').filter(line => line.trim() !== '');
    const tablas = procesarLineas(lines, diccionario);
    onProgress(60);

    // Generar PDF
    const doc = new jsPDF();
    
    // Añadir título general
    doc.setFontSize(16);
    doc.text(`Informe de Pesos de Evidencia - ${etapaSeleccionada.name}`, doc.internal.pageSize.width / 2, 15, { align: 'center' });

    tablas.forEach((tabla, index) => {
        if (index > 0) {
            doc.addPage();
        }

        let yPos = 30; // Empezamos más abajo para dejar espacio al título general

        // Añadir título de la tabla
        doc.setFontSize(14);
        doc.text(tabla.titulo, 14, yPos);
        yPos += 10;

        // Añadir subtítulo (datos a tratar)
        doc.setFontSize(12);
        doc.text(tabla.datosATratar, 14, yPos);
        yPos += 10;

        // Generar tabla
        doc.autoTable({
            head: [['Rangos', 'Pesos']],
            body: tabla.datos,
            startY: yPos,
            margin: { bottom: 50 },
            styles: { cellPadding: 1.5, fontSize: 8 },
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Añadir gráfico al PDF
        generarGrafico(doc, tabla.datos, yPos);

        // Añadir resumen de rangos y valores
        yPos += 110; // Aumentar espacio después del gráfico

        const resumen = generarResumen(tabla.datos);
        resumen.forEach(line => {
            doc.setFontSize(9);
            doc.text(line, 14, yPos);
            yPos += 5;
        });
    });

    onProgress(100);
    const pdfUrl = doc.output('bloburl');
    return pdfUrl;
};

const generarGrafico = (doc, datos, yPos) => {
    const width = 180;
    const height = 100;
    const margin = { left: 40, right: 10, top: 10, bottom: 20 }; // Aumentar margen izquierdo y inferior

    const xValues = datos.map(d => parseFloat(d[0].split(':')[1]));
    const yValues = datos.map(d => parseFloat(d[1]));
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const logScale = (value) => Math.log10(Math.max(value, 0.1));
    const toX = (value) => margin.left + ((logScale(value) - logScale(xMin)) / (logScale(xMax) - logScale(xMin))) * (width - margin.left - margin.right);
    const toY = (value) => yPos + margin.top + (height - margin.top - margin.bottom) - ((value - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);

    doc.setFontSize(8);
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);

    // Dibujar ejes Y y etiquetas
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const value = yMin + (i / yTicks) * (yMax - yMin);
        const y = toY(value);
        doc.line(margin.left, y, width - margin.right, y);
        doc.text(value.toFixed(1), margin.left - 5, y, { align: 'right' });
    }

    // Dibujar ejes X y etiquetas
    const xTickValues = [xMin, 1000, 10000, xMax];
    xTickValues.forEach(value => {
        const x = toX(value);
        if (x >= margin.left && x <= width - margin.right) {
            doc.line(x, yPos + height - margin.bottom, x, yPos + height - margin.bottom + 5);
            doc.text(value.toString(), x, yPos + height - margin.bottom + 10, { align: 'center' });
        }
    });

    // Dibujar líneas y puntos
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.setFillColor(0, 0, 255);

    for (let i = 0; i < datos.length - 1; i++) {
        const x1 = toX(parseFloat(datos[i][0].split(':')[1]));
        const y1 = toY(parseFloat(datos[i][1]));
        const x2 = toX(parseFloat(datos[i + 1][0].split(':')[1]));
        const y2 = toY(parseFloat(datos[i + 1][1]));

        if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
            doc.line(x1, y1, x2, y1);
            doc.setLineDash([2, 2], 0);
            doc.line(x2, y1, x2, y2);
            doc.setLineDash();
        }
    }

    datos.forEach(d => {
        const x = toX(parseFloat(d[0].split(':')[1]));
        const y = toY(parseFloat(d[1]));
        if (!isNaN(x) && !isNaN(y)) {
            doc.circle(x, y, 1, 'F');
        }
    });

    // Etiquetas de ejes
    doc.setFontSize(9);
    doc.text('Rangos', width / 2 + 15, yPos + height - 5, { align: 'center' });
    doc.text('Pesos', 20, yPos + height / 2 , { angle: 90, align: 'center' });
};

const procesarLineas = (lines, diccionario) => {
    const tablas = [];
    let lineaRangos = null;

    for (let i = 0; i < lines.length; i++) {
        const linea = lines[i].trim();
        if (linea.startsWith(':')) {
            lineaRangos = linea;
        } else if (lineaRangos) {
            const partesRangos = lineaRangos.split(/\s+/);
            const rangos = partesRangos.slice(1);
            const parametro = partesRangos[0].split('/')[0].slice(1) + '/' + partesRangos[0].split('/')[1];

            const partesPesos = linea.split(/\s+/);
            const [descripcion, ...pesos] = partesPesos;

            const [from, to] = descripcion.split(',').map(Number);

            const descripcionFrom = diccionario[from] || `ID ${from}`;
            const descripcionTo = diccionario[to] || `ID ${to}`;

            const titulo = `Transición de ${descripcionFrom} a ${descripcionTo} (${from} -> ${to})`;

            const datos = rangos.map((rango, index) => {
                if (pesos[index] && !isNaN(parseFloat(pesos[index]))) {
                    return [rango, pesos[index]];
                }
                return null;
            }).filter(item => item !== null);

            tablas.push({
                titulo,
                datosATratar: parametro,
                datos,
            });

            lineaRangos = null;
        }
    }
    return tablas;
};

const generarResumen = (datos) => {
    const resumen = [];
    let rangoInicio = datos[0][0].split(':')[0];
    let efectoActual = getEfecto(parseFloat(datos[0][1]));

    for (let i = 1; i < datos.length; i++) {
        const efecto = getEfecto(parseFloat(datos[i][1]));
        if (efecto !== efectoActual) {
            resumen.push(`El rango ${rangoInicio}:${datos[i - 1][0].split(':')[1]} ${efectoActual}.`);
            rangoInicio = datos[i][0].split(':')[0];
            efectoActual = efecto;
        }
    }
    resumen.push(`Del rango ${rangoInicio}:${datos[datos.length - 1][0].split(':')[1]} ${efectoActual}.`);
    return resumen;
};

const getEfecto = (pesoNum) => {
    if (pesoNum >= 1) {
        return "favorece el cambio";
    } else if (pesoNum > -1 && pesoNum < 1) {
        return "no afecta el cambio";
    } else {
        return "repele el cambio";
    }
};