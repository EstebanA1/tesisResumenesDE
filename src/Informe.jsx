import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import Chart from 'chart.js/auto';

console.log('Chart.js version:', Chart.version);
console.log('jsPDF version:', jsPDF.version);

export const generarInforme = async (files, etapaSeleccionada, onProgress) => {
    let diccionario = {};
    let cambiosPorArea = {};
    let yPos = 40;

    onProgress(5); // 5% al iniciar

    // Leer archivo .xlsx para el diccionario
    const diccionarioFile = files.find(file => file.name.endsWith('.xlsm') || file.name.endsWith('.xlsx'));
    if (diccionarioFile) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await diccionarioFile.arrayBuffer());
        const worksheet = workbook.getWorksheet(1);

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 1) {
                const [variable, description] = row.values.slice(1, 3);
                if (variable !== undefined && description !== undefined) {
                    diccionario[variable.toString()] = description.trim();
                    console.log(`Añadiendo al diccionario: ${variable} -> ${description.trim()}`);
                }
            }
        });
        console.log('Diccionario completo:', diccionario);
    }

    onProgress(20); // 20% después de procesar el diccionario

    // Leer archivo CSV para los cambios
    const cambiosFile = files.find(file => file.type === 'text/csv');
    if (cambiosFile) {
        const content = await cambiosFile.text();
        const rows = content.split('\n')
            .map(row => row.split(',').map(item => item.trim()))
            .filter(row => row.some(cell => cell !== '')); // Eliminar filas vacías

        // Ignorar la primera fila (encabezados)
        rows.slice(1).forEach((row, index) => {
            console.log(`Procesando fila ${index + 2}:`, row);

            if (row.length >= 3) {
                const [from, to, rate] = row.slice(0, 3);
                console.log(`Buscando en el diccionario: from='${from}', to='${to}'`);
                console.log(`Valores en el diccionario: from=${diccionario[from]}, to=${diccionario[to]}`);

                if (!diccionario[from]) {
                    console.log(`Advertencia: '${from}' no está en el diccionario`);
                }
                if (!diccionario[to]) {
                    console.log(`Advertencia: '${to}' no está en el diccionario`);
                }

                if (diccionario[from] && diccionario[to]) {
                    if (!cambiosPorArea[diccionario[from]]) {
                        cambiosPorArea[diccionario[from]] = [];
                    }
                    cambiosPorArea[diccionario[from]].push({
                        to: diccionario[to],
                        rate: parseFloat(rate)
                    });
                    console.log('Cambio añadido');
                } else {
                    console.log('Cambio no añadido debido a que falta en el diccionario');
                }
            } else {
                console.log(`Fila ${index + 2} ignorada: no tiene suficientes columnas`);
            }
        });

        console.log('Total de áreas con cambios:', Object.keys(cambiosPorArea).length);
        console.log('Cambios por área:', cambiosPorArea);

        Object.entries(cambiosPorArea).forEach((entry, index, array) => {
            onProgress((index + 1) / array.length * 100);
        });
    }

    onProgress(50); // 50% después de procesar los cambios

    // Generar PDF
    const doc = new jsPDF();
    let title = `Informe de cambios por área - ${etapaSeleccionada.name}`;
    doc.setTextColor(100);
    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.width / 2, 20, { align: 'center' });

    yPos = 40;
    const lineHeight = 10;
    const marginRight = 180;

    for (let [area, cambios] of Object.entries(cambiosPorArea)) {
        let texto = `${area} tuvo ${cambios.length} cambio${cambios.length > 1 ? 's' : ''} que ${cambios.length > 1 ? 'fueron' : 'fue'}:`;
        doc.setFontSize(14);
        doc.text(texto, 20, yPos);
        yPos += lineHeight * 1.5;

        cambios.forEach((cambio, index) => {
            doc.setFontSize(12);
            let detalleCambio = `- Pasó a ${cambio.to} en un ${(cambio.rate * 100).toFixed(4)}%`;
            let splitText = doc.splitTextToSize(detalleCambio, marginRight);

            splitText.forEach((line, i) => {
                if (yPos > doc.internal.pageSize.height - 20) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 30, yPos);
                yPos += lineHeight;
            });

            yPos += lineHeight / 8; // Espacio extra entre cambios
        });

        yPos += lineHeight * 1.5; // Espacio extra entre áreas
    }

    onProgress(70); // 70% después de generar el contenido principal del PDF

    // Título de la sección de gráficos 
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Gráficos', doc.internal.pageSize.width / 2, 20, { align: 'center' });

    let isFirstChart = true;

    yPos = 40;
    const chartWidth = 80;
    const chartHeight = 50;

    const createChartImage = (area, cambios) => {
        return new Promise((resolve) => {
            console.log(`Intentando crear gráfico para ${area}`, cambios);
            const baseWidth = 200; // Aumenta el ancho base
            const baseHeight = 150; // Aumenta la altura base
            const chartWidth = Math.max(baseWidth, cambios.length * 60); // Aumenta el espacio por barra
            const chartHeight = baseHeight + (cambios.length * 30); // Aumenta el espacio vertical

            const canvas = document.createElement('canvas');
            canvas.width = chartWidth * 2;
            canvas.height = chartHeight * 2;
            const ctx = canvas.getContext('2d');

            try {
                const maxValue = Math.max(...cambios.map(c => c.rate * 100));
                const step = calculateStep(maxValue);
                const maxY = Math.ceil(maxValue / step) * step;

                const shortenLabel = (label, maxLength = 15) => {
                    if (label.length <= maxLength) return label;
                    return label.slice(0, maxLength - 3) + '...';
                };

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: cambios.map(c => c.to),
                        datasets: [{
                            label: 'Porcentaje de cambio',
                            data: cambios.map(c => c.rate * 100),
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: false,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: maxY,
                                ticks: {
                                    stepSize: step,
                                    callback: function (value) {
                                        const decimals = Math.max(0, -Math.floor(Math.log10(step)));
                                        return value.toFixed(decimals) + '%';
                                    }
                                },
                                title: {
                                    display: false
                                }
                            },
                            x: {
                                ticks: {
                                    maxRotation: 0, // Mantén las etiquetas horizontales
                                    minRotation: 0,
                                    callback: function (value, index) {
                                        const label = this.getLabelForValue(value);
                                        return this.chart.width < 600 ? label.split(" ") : label;
                                    },
                                    font: {
                                        size: 8 // Mantén un tamaño de fuente pequeño
                                    },
                                    autoSkip: false
                                },
                                title: {
                                    display: false
                                }
                            }
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: `Cambios desde ${area}`,
                                font: {
                                    size: 14
                                }
                            },
                            legend: {
                                display: false
                            }
                        },
                        layout: {
                            padding: {
                                left: 15,
                                right: 15,
                                top: 0,
                                bottom: 50 // Aumenta el espacio en la parte inferior
                            }
                        }
                    }
                });

                console.log(`Gráfico creado para ${area}`);

                setTimeout(() => {
                    const imgData = canvas.toDataURL('image/png');
                    if (imgData === 'data:,') {
                        console.error(`Error: No se pudo generar la imagen del gráfico para ${area}`);
                        resolve(null);
                    } else {
                        console.log(`Imagen generada correctamente para ${area}`);
                        resolve({ imgData, width: chartWidth, height: chartHeight });
                    }
                }, 500);
            } catch (error) {
                console.error(`Error al crear el gráfico para ${area}:`, error);
                resolve(null);
            }
        });
    };

    // Generación de gráficos
    for (let [area, cambios] of Object.entries(cambiosPorArea)) {
        console.log(`Procesando área: ${area}`, cambios);

        if (!isFirstChart) {
            doc.addPage();
        }

        let yPos = isFirstChart ? 40 : 20; // Posición Y más alta para el primer gráfico

        // Crear el gráfico de manera asíncrona
        const chartData = await createChartImage(area, cambios);
        console.log('Datos del gráfico:', cambios.map(c => ({ to: c.to, rate: c.rate * 100 })));

        if (chartData) {
            // Añadir el gráfico al PDF
            try {
                const pdfWidth = doc.internal.pageSize.width;
                const pdfHeight = doc.internal.pageSize.height;
                const aspectRatio = chartData.width / chartData.height;
                let imgWidth = pdfWidth - 20; // 10px de margen en cada lado
                let imgHeight = imgWidth / aspectRatio;

                // Asegurarse de que la imagen no sea más alta que la página
                if (imgHeight > pdfHeight - 60) { // 40px margen arriba y abajo para el primer gráfico, 20px para los demás
                    imgHeight = pdfHeight - (isFirstChart ? 60 : 40);
                    imgWidth = imgHeight * aspectRatio;
                }

                const xPos = (pdfWidth - imgWidth) / 2;
                doc.addImage(chartData.imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
                console.log(`Gráfico añadido al PDF para ${area}`);
            } catch (error) {
                console.error(`Error al añadir la imagen al PDF para ${area}:`, error);
            }
        } else {
            console.error(`No se pudo generar el gráfico para ${area}`);
        }
        isFirstChart = false;
    }
    const pdfUrl = doc.output('bloburl');
    onProgress(100); // 100% al finalizar
    return pdfUrl;
};

// Función auxiliar para calcular el paso óptimo
const calculateStep = (max) => {
    if (max === 0) return 0.01; // Manejo de caso especial cuando max es 0
    const roughStep = max / 5; // Queremos aproximadamente 5 divisiones
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;

    let step;
    if (normalized < 1.5) step = magnitude;
    else if (normalized < 3) step = 2 * magnitude;
    else if (normalized < 7) step = 5 * magnitude;
    else step = 10 * magnitude;

    // Asegurarse de que el paso no sea mayor que el máximo
    while (step > max / 2) {
        step /= 10;
    }

    // Si el paso es muy pequeño, aumentar la precisión
    const minStep = 0.00001;
    while (step < minStep) {
        step *= 10;
    }

    return step;
};