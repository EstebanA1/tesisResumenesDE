import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const cleanVariableName = (variableName) => {
    return variableName.replace('static_var/', '').replace('distance/', '');
};

const generateCorrelationGraph = (correlationData, threshold = 0.25) => {
    const nodes = new Set();
    correlationData.forEach(item => {
        nodes.add(item.firstVariable);
        nodes.add(item.secondVariable);
    });
    const nodeArray = Array.from(nodes);

    const width = 1200;
    const height = 1200;
    const radius = height * 0.35;
    const center = { x: width / 2, y: height / 2 };
    const nodePositions = {};
    const angleStep = (2 * Math.PI) / nodeArray.length;

    nodeArray.forEach((node, index) => {
        const angle = index * angleStep;
        nodePositions[node] = {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        };
    });

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#000"/>
        </marker>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2"/>
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>`;

    svg += `<g class="connections">`;
    
    correlationData.forEach(item => {
        const start = nodePositions[item.firstVariable];
        const end = nodePositions[item.secondVariable];
        
        if (start && end) {
            const color = getEdgeColor(item.cramer);
            const width = getEdgeWidth(item.cramer);

            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const offset = dist * 0.15;
            const nx = -dy / dist; 
            const ny = dx / dist;
            
            const cpx = midX + offset * nx;
            const cpy = midY + offset * ny;

            const path = `M ${start.x},${start.y} Q ${cpx},${cpy} ${end.x},${end.y}`;
            
            svg += `<path 
                d="${path}"
                stroke="${color}"
                stroke-width="${width}"
                fill="none"
                opacity="0.6"
            />`;

            svg += `<text>
                <textPath href="#text-path-${item.firstVariable}-${item.secondVariable}" startOffset="50%" text-anchor="middle">
                    <tspan dy="-5">
                        <tspan dx="0" dy="0" fill="white" stroke="white" stroke-width="6">${item.cramer.toFixed(2)}</tspan>
                        <tspan dx="-${item.cramer.toFixed(2).length * 8}" dy="0" fill="${color}">${item.cramer.toFixed(2)}</tspan>
                    </tspan>
                </textPath>
            </text>`;

            svg += `<path 
                id="text-path-${item.firstVariable}-${item.secondVariable}"
                d="${path}"
                stroke="none"
                fill="none"
            />`;
        }
    });
    
    svg += `</g>`;

    svg += `<g class="nodes">`;
    nodeArray.forEach(node => {
        const pos = nodePositions[node];
        const circleRadius = 30; 
        svg += `
            <g class="node" transform="translate(${pos.x},${pos.y})">
                <circle r="${circleRadius + 5}" fill="white" filter="url(#shadow)"/>
                <circle r="${circleRadius}" fill="#4A90E2" stroke="#2C3E50" stroke-width="2"/>
                <text 
                    y="${circleRadius + 20}"
                    text-anchor="middle"
                    font-size="14"
                    font-weight="bold"
                    font-family="Arial, sans-serif"
                    fill="#2C3E50"
                    filter="url(#shadow)"
                >
                    ${node}
                </text>
            </g>`;
    });
    svg += `</g></svg>`;

    return svg;
};

const svgToPngBase64 = (svg) => {
    return new Promise((resolve, reject) => {
        try {
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const scale = 4; 
                    canvas.width = 2400; 
                    canvas.height = 2400; 

                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const scale_width = canvas.width / img.width;
                    const scale_height = canvas.height / img.height;
                    const scale_factor = Math.min(scale_width, scale_height);

                    const newWidth = img.width * scale_factor;
                    const newHeight = img.height * scale_factor;
                    const x = (canvas.width - newWidth) / 2;
                    const y = (canvas.height - newHeight) / 2;

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    ctx.drawImage(img, x, y, newWidth, newHeight);

                    const base64 = canvas.toDataURL('image/png', 1.0);

                    URL.revokeObjectURL(url);
                    resolve(base64);
                } catch (err) {
                    console.error('Error en el procesamiento del canvas:', err);
                    reject(err);
                }
            };

            img.onerror = (err) => {
                console.error('Error al cargar la imagen:', err);
                URL.revokeObjectURL(url);
                reject(err);
            };

            img.src = url;
        } catch (err) {
            console.error('Error en la creación del Blob:', err);
            reject(err);
        }
    });
};

const addSummarySection = async (doc, correlationCategories, startY) => {
    doc.addPage();
    let currentY = 20;
    const pageWidth = doc.internal.pageSize.width;
    const marginLeft = 14;
    const marginRight = 14;
    const textWidth = pageWidth - marginLeft - marginRight;
    const lineHeight = 5;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Análisis de Correlación',
        doc.internal.pageSize.width / 2, 20, { align: 'center' });
    currentY += 15; 

    let isFirstCategory = true;

    const categories = [
        {
            title: 'Variables sin asociación (0 - 0.25):',
            data: correlationCategories.noAsociacion,
            description: 'Estas variables pueden considerarse independientes para el análisis. No existe una relación significativa entre ellas, lo que sugiere que los cambios en una variable no afectan a la otra. Este tipo de variables son ideales para análisis independientes.'
        },
        {
            title: 'Variables con asociación mínima (0.25 - 0.5):',
            data: correlationCategories.asociacionMinima,
            description: 'Estas variables pueden considerarse independientes para el análisis. No existe una relación significativa entre ellas, lo que sugiere que los cambios en una variable no afectan a la otra. Este tipo de variables son ideales para análisis independientes.'
        },
        {
            title: 'Variables con asociación moderada (0.5 - 0.75):',
            data: correlationCategories.asociacionModerada,
            description: 'Existe una relación notable entre estas variables que no debe ignorarse. Los cambios en una variable tienen una influencia moderada en la otra, lo que requiere un análisis conjunto para una comprensión completa del comportamiento del sistema.'
        },
        {
            title: 'Variables con asociación fuerte (0.75 - 1):',
            data: correlationCategories.asociacionFuerte,
            description: 'Existe una fuerte dependencia entre estas variables. Los cambios en una variable están altamente relacionados con cambios en la otra. Esta fuerte asociación debe ser un factor clave en cualquier análisis o toma de decisiones.'
        },
        {
            title: 'Variables con asociación completa (1):',
            data: correlationCategories.asociacionCompleta,
            description: 'Estas variables están perfectamente correlacionadas, indicando una dependencia total entre ellas. Cualquier cambio en una variable se refleja directamente en la otra, sugiriendo que podrían ser redundantes en el análisis o representar el mismo fenómeno desde diferentes perspectivas.'
        }
    ];

    for (const category of categories) {
        if (category.data.length > 0) {
            if (!isFirstCategory) {
                doc.addPage();
                currentY = 20; 
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(category.title, marginLeft, currentY);
            currentY += lineHeight * 1.2; 

            doc.setFontSize(9);
            category.data.forEach(({ pair, cramer }) => {
                currentY = checkNewPage(doc, currentY, lineHeight);
                const pairText = `• ${pair}`;
                const cramerText = `Índice de Cramer: ${cramer.toFixed(4)}`;
                doc.text(pairText, marginLeft + 6, currentY);
                doc.text(cramerText, pageWidth - marginRight - 10, currentY, { align: 'right' });
                currentY += lineHeight;
            });

            currentY += lineHeight;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            currentY = addText(doc, category.description, marginLeft + 6, currentY, textWidth - 18);
            currentY += lineHeight * 2;

            if (category.data.length > 0) {
                try {
                    const graphData = category.data.map(({ pair, cramer }) => {
                        const [firstVariable, secondVariable] = pair.split(' - ');
                        return { firstVariable, secondVariable, cramer };
                    });

                    await new Promise(resolve => setTimeout(resolve, 100));

                    const svg = generateCorrelationGraph(graphData);
                    const pngBase64 = await svgToPngBase64(svg);

                    currentY = checkNewPage(doc, currentY, 280);
                    
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    const graphTitle = `Grafo de ${category.title.toLowerCase().replace(':', '')}`;
                    doc.text(graphTitle, pageWidth / 2, currentY, { align: 'center' });
                    currentY += 10;

                    const imageWidth = pageWidth - marginLeft - marginRight;
                    const imageHeight = 250;

                    doc.addImage(pngBase64, 'PNG', marginLeft, currentY, imageWidth, imageHeight,
                        undefined, 'FAST');

                    currentY += imageHeight + 10;
                } catch (err) {
                    console.error('Error al generar o convertir el gráfico:', err);
                    doc.setTextColor(255, 0, 0);
                    doc.setFontSize(8);
                    doc.text('Error al generar el gráfico para esta categoría.', marginLeft, currentY + 10);
                    doc.setTextColor(0, 0, 0);
                    currentY += 20;
                }
            }

            isFirstCategory = false;
        }
    }

    return currentY;
};

const getEdgeColor = (cramer) => {
    if (cramer >= 0.75) return '#E74C3C';    
    if (cramer >= 0.5) return '#F39C12';     
    if (cramer >= 0.25) return '#3498DB';    
    return '#c2c2c2';                        
};

const getEdgeWidth = (cramer) => {
    if (cramer >= 0.75) return 4;
    if (cramer >= 0.5) return 3;
    if (cramer >= 0.25) return 2;
    return 1;
};

const addText = (doc, text, x, y, maxWidth) => {
    const textLines = doc.splitTextToSize(text, maxWidth);
    doc.text(textLines, x, y);
    return y + (textLines.length * 5);
};

const checkNewPage = (doc, currentY, neededSpace) => {
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;

    if (currentY + neededSpace > pageHeight - marginBottom) {
        doc.addPage();
        return 20;
    }
    return currentY;
};

const generateCorrelationSummary = (reportData) => {
    const categories = {
        noAsociacion: [],
        asociacionMinima: [],
        asociacionModerada: [],
        asociacionFuerte: [],
        asociacionCompleta: []
    };

    reportData.forEach(data => {
        const firstVarCleaned = cleanVariableName(data.firstVariable);
        const secondVarCleaned = cleanVariableName(data.secondVariable);
        const pair = `${firstVarCleaned} - ${secondVarCleaned}`;
        const cramer = data.cramer;

        if (cramer === 1) {
            categories.asociacionCompleta.push({ pair, cramer });
        } else if (cramer >= 0.75) {
            categories.asociacionFuerte.push({ pair, cramer });
        } else if (cramer >= 0.5) {
            categories.asociacionModerada.push({ pair, cramer });
        } else if (cramer >= 0.25) {
            categories.asociacionMinima.push({ pair, cramer });
        } else {
            categories.noAsociacion.push({ pair, cramer });
        }
    });

    return categories;
};

export const generarInformeEtapa3 = async (files, etapaSeleccionada, onProgress) => {
    try {
        console.log('Iniciando generación de informe...');
        onProgress(5);

        if (!files || !Array.isArray(files) || files.length === 0) {
            throw new Error('No se proporcionaron archivos');
        }

        if (!etapaSeleccionada || !etapaSeleccionada.name) {
            throw new Error('No se proporcionó una etapa válida');
        }

        const csvFile = files.find(file => file.type === 'text/csv');
        if (!csvFile) {
            throw new Error('No se encontró el archivo CSV');
        }

        let reportData = [];
        let headerInfo = null;

        console.log('Procesando archivo CSV:', csvFile.name);
        const content = await csvFile.text();
        const rows = content.split('\n')
            .map(row => row.split(',').map(item => item.trim()))
            .filter(row => row.some(cell => cell !== ''));

        if (rows.length < 2) {
            throw new Error('El archivo CSV no contiene suficientes datos');
        }

        if (rows[1] && rows[1].length >= 2) {
            headerInfo = {
                from: rows[1][0] || 'Desconocido',
                to: rows[1][1] || 'Desconocido',
            };
        } else {
            headerInfo = {
                from: 'Desconocido',
                to: 'Desconocido'
            };
        }

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            if (row.length >= 9) {
                const chi2 = parseFloat(row[4]);
                const cramer = parseFloat(row[5]);
                const contingency = parseFloat(row[6]);
                const jointEntropy = parseFloat(row[7]);
                const jointUncertainty = parseFloat(row[8]);

                if (!isNaN(chi2) && !isNaN(cramer) && !isNaN(contingency) &&
                    !isNaN(jointEntropy) && !isNaN(jointUncertainty)) {

                    reportData.push({
                        firstVariable: cleanVariableName(row[2] || 'Sin nombre'),
                        secondVariable: cleanVariableName(row[3] || 'Sin nombre'),
                        chi2,
                        cramer,
                        contingency,
                        jointEntropy,
                        jointUncertainty
                    });
                }
            }
        }

        if (reportData.length === 0) {
            throw new Error('No se pudieron procesar datos válidos del CSV');
        }

        const doc = new jsPDF();
        doc.setFont('helvetica');
        doc.setFontSize(18);

        doc.text(`Informe de Correlación de Variables - ${etapaSeleccionada.name}`,
            doc.internal.pageSize.width / 2, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.text(`Transición ${headerInfo.from} -> ${headerInfo.to}`, 14, 35);

        const tableHeaders = [
            [
                { content: 'Variables', colSpan: 2, styles: { halign: 'center' } },
                {
                    content: 'Cramer', colSpan: 3, styles: {
                        halign: 'center',
                        lineWidth: { left: 0.22, right: 0.4 },
                        lineColor: [255, 255, 255],
                    },
                },
                { content: 'Entropía', colSpan: 2, styles: { halign: 'center' } }
            ],
            [
                { content: 'Primera Variable', styles: { halign: 'center' } },
                { content: 'Segunda Variable', styles: { halign: 'center' } },
                { content: 'Chi²', styles: { halign: 'center' } },
                { content: 'Cramer', styles: { halign: 'center' } },
                { content: 'Contingencia', styles: { halign: 'center' } },
                { content: 'Entropía Conjunta', styles: { halign: 'center' } },
                { content: 'Incertidumbre Conjunta', styles: { halign: 'center' } }
            ]
        ];

        const tableData = reportData.map(row => [
            row.firstVariable,
            row.secondVariable,
            row.chi2.toFixed(6),
            row.cramer.toFixed(6),
            row.contingency.toFixed(6),
            row.jointEntropy.toFixed(6),
            row.jointUncertainty.toFixed(6)
        ]);

        doc.autoTable({
            head: tableHeaders,
            body: tableData,
            startY: 40,
            styles: {
                fontSize: 7,
                cellPadding: 1.5
            },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 35 },
                2: { cellWidth: 23 },
                3: { cellWidth: 23 },
                4: { cellWidth: 23 },
                5: { cellWidth: 23 },
                6: { cellWidth: 23 }
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontSize: 7,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            margin: { left: 15, right: 10 }
        });

        const finalY = doc.previousAutoTable.finalY || 40;
        const correlationCategories = generateCorrelationSummary(reportData);
        await addSummarySection(doc, correlationCategories, finalY + 20);

        console.log('PDF generado exitosamente');
        onProgress(100);

        return doc.output('bloburl');
    } catch (error) {
        console.error('Error al generar el informe:', error);
        throw new Error(`Error al generar el informe: ${error.message}`);
    }
};