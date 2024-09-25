import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import 'jspdf-autotable';

export const generarInformeEtapa2 = async (files, etapaSeleccionada, onProgress) => {
    let diccionario = {};
    let dcfContent = '';
    onProgress(5);

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
    }
    onProgress(20);

    const dcfFile = files.find(file => file.name.endsWith('.dcf'));
    if (!dcfFile) {
        throw new Error("No se encontró un archivo .dcf");
    }
    dcfContent = await dcfFile.text();
    onProgress(40);

    const lines = dcfContent.split('\n').filter(line => line.trim() !== '');
    const tablas = procesarLineas(lines, diccionario);
    onProgress(60);

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Informe de Pesos de Evidencia - ${etapaSeleccionada.name}`, doc.internal.pageSize.width / 2, 15, { align: 'center' });

    tablas.forEach((tabla, index) => {
        if (index > 0) {
            doc.addPage();
        }

        let yPos = 30;

        doc.setFontSize(14);
        doc.text(tabla.titulo, 14, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.text(tabla.datosATratar, 14, yPos);
        yPos += 10;

        doc.autoTable({
            head: [['Rangos', 'Pesos']],
            body: tabla.datos,
            startY: yPos,
            margin: { bottom: 50 },
            styles: { cellPadding: 1.5, fontSize: 8 },
        });

        yPos = doc.lastAutoTable.finalY + 10;
        generarGrafico(doc, tabla.datos, yPos);
        yPos += 105;
        doc.setFontSize(9);

        const resumenLines = doc.splitTextToSize(tabla.resumen, 180);
        resumenLines.forEach(line => {
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
    const margin = { left: 40, right: 10, top: 10, bottom: 20 };

    const xValues = datos.flatMap(d => d[0].split(':').map(parseFloat));
    const yValues = datos.map(d => parseFloat(d[1]));

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(Math.min(...yValues), -1);
    const yMax = Math.max(Math.max(...yValues), 1);

    const minXThreshold = 150;

    const logScale = (value) => Math.log10(Math.max(value, minXThreshold));

    const toX = (value) => {
        if (value <= 0) return margin.left;  
        const logMin = logScale(minXThreshold);
        const logMax = logScale(xMax);
        const logValue = logScale(value);
        return margin.left + ((logValue - logMin) / (logMax - logMin)) * (width - margin.left - margin.right);
    };
    const toY = (value) => yPos + margin.top + (height - margin.top - margin.bottom) - ((value - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);

    const generarTicksX = (xMin, xMax) => {
        const range = xMax - xMin;
        if (range > 10000) {
            return [xMin, 1000, 10000, xMax]; 
        } else if (range > 1000) {
            return [xMin, 500, 1000, xMax]; 
        } else {
            return [xMin, xMax];  
        }
    };

    const xTickValues = generarTicksX(xMin, xMax);
    doc.setFontSize(8);
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const value = yMin + (i / yTicks) * (yMax - yMin);
        const y = toY(value);
        doc.line(margin.left, y, width - margin.right, y);
        doc.text(value.toFixed(1), margin.left - 5, y, { align: 'right' });
    }

    xTickValues.forEach(value => {
        const x = toX(value);
        if (x >= margin.left && x <= width - margin.right) {
            doc.line(x, yPos + height - margin.bottom, x, yPos + height - margin.bottom + 5);
            doc.text(value.toString(), x, yPos + height - margin.bottom + 10, { align: 'center' });
        }
    });

    doc.setDrawColor(150);
    doc.setLineDash([2, 2]);
    doc.line(margin.left, toY(1), width - margin.right, toY(1));
    doc.line(margin.left, toY(-1), width - margin.right, toY(-1));
    doc.setLineDash();

    doc.setLineWidth(0.5);

    const getColor = (value) => {
        if (value >= 1) return [0, 255, 0]; 
        if (value > -1 && value < 1) return [255, 165, 0]; 
        return [255, 0, 0]; 
    };

    for (let i = 0; i < datos.length; i++) {
        const [rangeStart, rangeEnd] = datos[i][0].split(':').map(parseFloat);
        const peso = parseFloat(datos[i][1]);

        const x1 = toX(Math.max(rangeStart, 0)); 
        const x2 = toX(rangeEnd);
        const y = toY(peso);

        const color = getColor(peso);
        doc.setDrawColor(...color);
        doc.setFillColor(...color);

        doc.line(x1, y, x2, y);
        doc.circle(x1, y, 1, 'F');

        if (i < datos.length - 1) {
            const nextPeso = parseFloat(datos[i + 1][1]);
            const nextY = toY(nextPeso);
            doc.setLineDash([2, 2]);
            doc.line(x2, y, x2, nextY);
            doc.setLineDash();
        }

        if (i > 0) {
            const prevColor = getColor(parseFloat(datos[i - 1][1]));
            if (color.toString() !== prevColor.toString()) {
                doc.setDrawColor(100);
                doc.setLineDash([4, 2]);
                doc.line(x1, yPos + margin.top, x1, yPos + height - margin.bottom);
                doc.setLineDash();
            }
        }
    }

    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text('Rangos', width / 2 + 15, yPos + height - 5, { align: 'center' });
    doc.text('Pesos', 20, yPos + height / 2, { angle: 90, align: 'center' });

    doc.setFontSize(8);
    const legendX = width - margin.right + 10;
    const legendStartY = yPos + margin.top + 20;
    const legendSpacing = 15;

    const drawLegendItem = (color, text, index) => {
        const itemY = legendStartY + index * legendSpacing;
        doc.setFillColor(...color);
        doc.circle(legendX, itemY, 2, 'F');
        doc.setTextColor(0);
        doc.text(text, legendX + 5, itemY + 1);
    };

    drawLegendItem([0, 255, 0], 'Favorece', 0);
    drawLegendItem([255, 165, 0], 'Neutro', 1);
    drawLegendItem([255, 0, 0], 'Repele', 2);
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

            const resumenGenerado = generarResumen(datos, titulo);

            tablas.push({
                titulo,
                datosATratar: parametro,
                datos,
                resumen: resumenGenerado
            });

            lineaRangos = null;
        }
    }
    return tablas;
};

const generarResumen = (datos, titulo) => {
    const cambios = [];
    let rangoInicio = datos[0][0].split(':')[0];
    let efectoActual = getEfecto(parseFloat(datos[0][1]));

    for (let i = 1; i < datos.length; i++) {
        const efecto = getEfecto(parseFloat(datos[i][1]));
        if (efecto !== efectoActual) {
            cambios.push({
                rango: `${rangoInicio}:${datos[i - 1][0].split(':')[1]}`,
                efecto: efectoActual
            });
            rangoInicio = datos[i][0].split(':')[0];
            efectoActual = efecto;
        }
    }
    cambios.push({
        rango: `${rangoInicio}:${datos[datos.length - 1][0].split(':')[1]}`,
        efecto: efectoActual
    });

    let descripcion = `En la ${titulo}, observamos que `;

    cambios.forEach((cambio, index) => {
        const [inicio, fin] = cambio.rango.split(':');
        let descripcionEfecto;

        switch (cambio.efecto) {
            case "favorece el cambio":
                descripcionEfecto = "el cambio es claramente favorable, lo que indica una tendencia positiva en este rango de valores";
                break;
            case "no afecta el cambio":
                descripcionEfecto = "el cambio se mantiene en una posición neutral, sugiriendo que dentro de este intervalo, los efectos son mínimos o poco significativos para promover variaciones importantes";
                break;
            case "repele el cambio":
                descripcionEfecto = "se evidencia una clara repulsión al cambio, lo que refleja una resistencia fuerte a cualquier tipo de alteración significativa en este rango";
                break;
        }

        if (index === 0) {
            descripcion += `desde el punto inicial ${inicio} hasta el ${fin}, ${descripcionEfecto}. `;
        } else if (index === cambios.length - 1) {
            descripcion += `Finalmente, a partir del punto ${inicio} hasta el ${fin}, ${descripcionEfecto}.`;
        } else {
            descripcion += `Luego, entre los puntos ${inicio} y ${fin}, ${descripcionEfecto}. `;
        }
    });

    return descripcion;
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