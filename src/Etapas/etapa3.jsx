import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const generateCorrelationSummary = (reportData) => {
    const categories = {
        noAsociacion: [],
        asociacionMinima: [],
        asociacionModerada: [],
        asociacionFuerte: [],
        asociacionCompleta: []
    };

    reportData.forEach(data => {
        const pair = `${data.firstVariable} - ${data.secondVariable}`;
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

const checkNewPage = (doc, currentY, neededSpace) => {
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;

    if (currentY + neededSpace > pageHeight - marginBottom) {
        doc.addPage();
        return 20;
    }
    return currentY;
};

const addText = (doc, text, x, y, maxWidth) => {
    doc.text(text, x, y, {
        maxWidth: maxWidth,
        lineHeightFactor: 1.5
    });

    const lines = doc.splitTextToSize(text, maxWidth).length;
    return y + (lines * 5);
};

const addSummarySection = (doc, correlationCategories, startY) => {
    doc.addPage();
    let currentY = 20;
    const pageWidth = doc.internal.pageSize.width;
    const marginLeft = 14;
    const marginRight = 14;
    const textWidth = pageWidth - marginLeft - marginRight;
    const lineHeight = 5;

    doc.setFontSize(16);
    doc.setFont('helvetica');
    doc.text('Análisis de Correlación',
        doc.internal.pageSize.width / 2, 20, { align: 'center' });

    currentY += 10;

    let isFirstCategory = true;

    const addCategorySection = (title, pairs, description) => {
        if (pairs.length > 0) {
            if (!isFirstCategory) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(title, marginLeft, currentY);
            currentY += lineHeight * 1.5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            pairs.forEach(({ pair, cramer }) => {
                currentY = checkNewPage(doc, currentY, lineHeight);

                const pairText = `• ${pair}`;
                const cramerText = `Índice de Cramer: ${cramer.toFixed(4)}`;

                doc.text(pairText, marginLeft + 6, currentY);

                const cramerX = pageWidth - marginRight - 10;

                doc.text(cramerText, cramerX, currentY, { align: 'right' });

                currentY += lineHeight;
            });

            currentY = checkNewPage(doc, currentY, lineHeight * 1.5);
            doc.setFontSize(10);
            currentY = addText(doc, description, marginLeft, currentY + lineHeight, textWidth);
            currentY += lineHeight;

            isFirstCategory = false;
        }
        return currentY;
    };

    const categoryDescriptions = {
        noAsociacion: 'Estas variables pueden considerarse independientes para el análisis. No existe una relación significativa entre ellas, lo que sugiere que los cambios en una variable no afectan a la otra. Este tipo de variables son ideales para análisis independientes.',
        asociacionMinima: 'Existe una asociación débil que debe ser considerada con precaución. Aunque hay una ligera relación entre las variables, esta no es lo suficientemente fuerte como para ser determinante en el análisis. Se recomienda considerar otros factores antes de establecer conclusiones.',
        asociacionModerada: 'La asociación es significativa y debe ser tenida en cuenta en el análisis. Estas variables muestran una relación considerable entre sí, lo que sugiere que los cambios en una variable pueden tener un impacto moderado en la otra.',
        asociacionFuerte: 'Existe una fuerte dependencia entre estas variables. Los cambios en una variable están altamente relacionados con cambios en la otra. Esta fuerte asociación debe ser un factor clave en cualquier análisis o toma de decisiones.',
        asociacionCompleta: 'Estas variables están completamente correlacionadas, lo que indica una dependencia total entre ellas. Cualquier cambio en una variable se refleja directamente en la otra. En términos prácticos, podría considerarse que estas variables representan el mismo fenómeno desde diferentes perspectivas.'
    };

    currentY = addCategorySection(
        'Variables sin asociación (0 - 0.25):',
        correlationCategories.noAsociacion,
        categoryDescriptions.noAsociacion
    );
    currentY = addCategorySection(
        'Variables con asociación mínima (0.25 - 0.5):',
        correlationCategories.asociacionMinima,
        categoryDescriptions.asociacionMinima
    );
    currentY = addCategorySection(
        'Variables con asociación moderada (0.5 - 0.75):',
        correlationCategories.asociacionModerada,
        categoryDescriptions.asociacionModerada
    );
    currentY = addCategorySection(
        'Variables con asociación fuerte (0.75 - 1):',
        correlationCategories.asociacionFuerte,
        categoryDescriptions.asociacionFuerte
    );
    currentY = addCategorySection(
        'Variables con asociación completa (1):',
        correlationCategories.asociacionCompleta,
        categoryDescriptions.asociacionCompleta
    );

    return currentY;
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
                        firstVariable: row[2] || 'Sin nombre',
                        secondVariable: row[3] || 'Sin nombre',
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
                        lineWidth: { left: 0.22, right: 0.4},
                        lineColor: [255, 255, 255],
                    },
                },
                { content: 'Entropía', colSpan: 2, styles: { halign: 'center' } }
            ],
            ['Primera Variable', 'Segunda Variable', 'Chi²', 'Cramer', 'Contingencia', 'Entropía Conjunta', 'Incertidumbre Conjunta']
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
                2: { cellWidth: 22 },
                3: { cellWidth: 22 },
                4: { cellWidth: 22 },
                5: { cellWidth: 22 },
                6: { cellWidth: 22 }
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
        addSummarySection(doc, correlationCategories, finalY + 20);

        console.log('PDF generado exitosamente');
        onProgress(100);

        return doc.output('bloburl');
    } catch (error) {
        console.error('Error al generar el informe:', error);
        throw new Error(`Error al generar el informe: ${error.message}`);
    }
};