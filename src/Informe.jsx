import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import Chart from 'chart.js/auto';

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
                let variable, description;
                if (row.values.length >= 3) {
                    // Formato con múltiples columnas
                    [variable, description] = row.values.slice(1, 3);
                } else if (row.values.length === 2) {
                    // Formato con una sola columna
                    const cellValue = row.values[1];
                    if (typeof cellValue === 'string') {
                        const match = cellValue.match(/^(\d+)\s*(.+)$/);
                        if (match) {
                            [, variable, description] = match;
                        }
                    }
                }
                if (variable !== undefined && description !== undefined) {
                    diccionario[variable.toString()] = description.trim();
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
        let erroresYAdvertencias = 0;
        const rows = content.split('\n')
            .map(row => row.split(',').map(item => item.trim()))
            .filter(row => row.some(cell => cell !== '')); // Eliminar filas vacías

        // Ignorar la primera fila (encabezados)
        rows.slice(1).forEach((row, index) => {


            if (row.length >= 3) {
                const [from, to, rate] = row.slice(0, 3);

                if (!diccionario[from]) {
                    console.warn(`Advertencia: '${from}' no está en el diccionario`);
                    erroresYAdvertencias++;
                }

                if (!diccionario[to]) {
                    console.warn(`Advertencia: '${to}' no está en el diccionario`);
                    erroresYAdvertencias++;
                }

                if (diccionario[from] && diccionario[to]) {
                    if (!cambiosPorArea[diccionario[from]]) {
                        cambiosPorArea[diccionario[from]] = [];
                    }
                    cambiosPorArea[diccionario[from]].push({
                        to: diccionario[to],
                        rate: parseFloat(rate)
                    });
                } else {
                    console.log('Cambio no añadido debido a que falta en el diccionario');
                }
            } else {
                console.log(`Fila ${index + 2} ignorada: no tiene suficientes columnas`);
            }
        });
        console.log('Cambios por área:', cambiosPorArea);
        Object.entries(cambiosPorArea).forEach((entry, index, array) => {
            onProgress((index + 1) / array.length * 100);
        });
        console.log(`Total de errores y advertencias: ${erroresYAdvertencias}`);
    }

    onProgress(40); // 40% después de procesar los cambios

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

    onProgress(50); // 50% después de generar el contenido principal del PDF

    // Título de la sección de gráficos 
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Gráficos', doc.internal.pageSize.width / 2, 20, { align: 'center' });

    let isFirstChart = true;

    const createChartImage = (area, cambios, isGeneral = false) => {
        return new Promise((resolve) => {
            const baseWidth = 400;
            const baseHeight = isGeneral ? 400 : 300;
            const chartWidth = isGeneral ? baseWidth : Math.max(baseWidth, cambios.length * 60);
            const chartHeight = isGeneral ? baseHeight + (cambios.length * 30) : baseHeight;

            const canvas = document.createElement('canvas');
            canvas.width = chartWidth * 2;
            canvas.height = chartHeight * 2;
            const ctx = canvas.getContext('2d');

            try {
                const maxValue = isGeneral ? 100 : Math.max(...cambios.map(c => c.rate * 100));
                const step = calculateStep(maxValue);
                const maxY = Math.ceil(maxValue / step) * step;
                console.log(`Creando gráfico para ${area} con datos:`, cambios);

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: cambios.map(c => c.to),
                        datasets: [{
                            label: 'Porcentaje de cambio',
                            data: isGeneral ? cambios.map(c => c.rate) : cambios.map(c => c.rate * 100),
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: false,
                        maintainAspectRatio: false,
                        indexAxis: isGeneral ? 'y' : 'x',
                        scales: {
                            x: {
                                beginAtZero: true,
                                max: isGeneral ? 100 : undefined,
                                ticks: {
                                    callback: function (value, index) {
                                        if (isGeneral) {
                                            const decimals = Math.max(0, -Math.floor(Math.log10(step)));
                                            return value.toFixed(decimals) + '%';
                                        } else {
                                            const label = this.getLabelForValue(value);
                                            return label.split(' ');
                                        }
                                    }
                                },
                                title: {
                                    display: false
                                }
                            },
                            y: {
                                beginAtZero: true,
                                max: isGeneral ? 100 : maxY,
                                ticks: {
                                    callback: function (value, index) {
                                        if (isGeneral) {
                                            const label = this.getLabelForValue(value);
                                            const dataItem = cambios[index];
                                            if (dataItem) {
                                                return `${label} (${dataItem.rate.toFixed(2)}%)`;
                                            }
                                            return label;
                                        } else {
                                            const decimals = Math.max(0, -Math.floor(Math.log10(step)));
                                            return value.toFixed(decimals) + '%';
                                        }
                                    }
                                },
                                title: {
                                    display: false
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        let label = context.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        label += context.formattedValue + '%';
                                        return label;
                                    }
                                }
                            },
                            title: {
                                display: !isGeneral, // Mostrar título solo si no es el gráfico general
                                text: isGeneral ? '' : `Cambios desde ${area}`,
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
                                top: 15,
                                bottom: 15
                            }
                        }
                    }
                });

                setTimeout(() => {
                    const imgData = canvas.toDataURL('image/png');
                    if (imgData === 'data:,') {
                        console.error(`Error: No se pudo generar la imagen del gráfico para ${area}`);
                        resolve(null);
                    } else {
                        console.log(`Imagen generada correctamente para ${area}`);
                        resolve({ imgData, width: chartWidth, height: chartHeight });
                    }
                }, 1000);
            } catch (error) {
                console.error(`Error al crear el gráfico para ${area}:`, error);
                resolve(null);
            }
        });
    };

    // Generación de gráficos individuales
    let totalCharts = Object.keys(cambiosPorArea).length + 1; // +1 para el gráfico general
    let chartsDone = 0;

    for (let [area, cambios] of Object.entries(cambiosPorArea)) {

        if (!isFirstChart) {
            doc.addPage();
        }

        let yPos = isFirstChart ? 40 : 20;
        
        chartsDone++;
        onProgress(50 + (chartsDone / totalCharts) * 45); // Progreso del 50% al 95%

        const chartData = await createChartImage(area, cambios, false);

        if (chartData) {
            try {
                const pdfWidth = doc.internal.pageSize.width;
                const pdfHeight = doc.internal.pageSize.height;
                const aspectRatio = chartData.width / chartData.height;
                let imgWidth = pdfWidth - 20;
                let imgHeight = imgWidth / aspectRatio;

                if (imgHeight > pdfHeight - 60) {
                    imgHeight = pdfHeight - (isFirstChart ? 60 : 40);
                    imgWidth = imgHeight * aspectRatio;
                }

                const xPos = (pdfWidth - imgWidth) / 2;
                doc.addImage(chartData.imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
            } catch (error) {
                console.error(`Error al añadir la imagen al PDF para ${area}:`, error);
            }
        } else {
            console.error(`No se pudo generar el gráfico para ${area}`);
        }
        isFirstChart = false;
    }

    // Añadir página para el gráfico general
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text('Gráfico General de Cambios por Área', doc.internal.pageSize.width / 2, 30, { align: 'center' });

    const datosGenerales = prepararDatosGraficoGeneral(cambiosPorArea);
    const chartDataGeneral = await createChartImage('Todas las áreas', datosGenerales, true);

    if (chartDataGeneral) {
        try {
            const pdfWidth = doc.internal.pageSize.width;
            const pdfHeight = doc.internal.pageSize.height;
            const aspectRatio = chartDataGeneral.width / chartDataGeneral.height;
            let imgWidth = pdfWidth - 40;
            let imgHeight = imgWidth / aspectRatio;

            if (imgHeight > pdfHeight - 60) {
                imgHeight = pdfHeight - 60;
                imgWidth = imgHeight * aspectRatio;
            }

            const xPos = (pdfWidth - imgWidth) / 2;
            const yPos = 40;
            doc.addImage(chartDataGeneral.imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
            console.log('Gráfico general añadido al PDF');
        } catch (error) {
            console.error('Error al añadir el gráfico general al PDF:', error);
        }
    }

    chartsDone++;
    onProgress(95 + (chartsDone / totalCharts) * 5); // Últimos 5% para el gráfico general

    const pdfUrl = doc.output('bloburl');
    onProgress(100); // 100% al finalizar
    return pdfUrl;
};

const calculateStep = (max) => {
    if (max === 0) return 0.01;
    const roughStep = max / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;

    let step;
    if (normalized < 1.5) step = magnitude;
    else if (normalized < 3) step = 2 * magnitude;
    else if (normalized < 7) step = 5 * magnitude;
    else step = 10 * magnitude;

    while (step > max / 2) {
        step /= 10;
    }

    const minStep = 0.00001;
    while (step < minStep) {
        step *= 10;
    }

    return step;
};

const prepararDatosGraficoGeneral = (cambiosPorArea) => {
    let datosGenerales = [];
    let totalCambios = 0;

    // Calcular el total de cambios sumando todos los cambios de todas las áreas
    for (let cambios of Object.values(cambiosPorArea)) {
        const sumaCambiosArea = cambios.reduce((sum, cambio) => sum + cambio.rate, 0);
        totalCambios += sumaCambiosArea;
    }

    // Calcular el porcentaje para cada área
    for (let [area, cambios] of Object.entries(cambiosPorArea)) {
        const sumaCambiosArea = cambios.reduce((sum, cambio) => sum + cambio.rate, 0);
        const porcentaje = (sumaCambiosArea / totalCambios) * 100;
        datosGenerales.push({ to: area, rate: porcentaje });
    }

    // Ordenar los datos de mayor a menor
    datosGenerales.sort((a, b) => b.rate - a.rate);

    // Redondear los valores y ajustar para que sumen exactamente 100%
    let sumaTotal = 0;
    datosGenerales = datosGenerales.map((dato, index, array) => {
        if (index === array.length - 1) {
            // Para el último elemento, asignar el resto para llegar a 100
            const rateAjustado = 100 - sumaTotal;
            return { ...dato, rate: rateAjustado };
        } else {
            const rateRedondeado = Math.round(dato.rate * 100) / 100; // Redondear a 2 decimales
            sumaTotal += rateRedondeado;
            return { ...dato, rate: rateRedondeado };
        }
    });

    // Verificación final
    console.log('Datos generales preparados:', datosGenerales);

    return datosGenerales;
};

const generateAllCharts = async (cambiosPorArea) => {
    const chartPromises = Object.entries(cambiosPorArea).map(([area, cambios]) => 
        createChartImage(area, cambios, false)
    );

    // Añadir el gráfico general
    const datosGenerales = prepararDatosGraficoGeneral(cambiosPorArea);
    chartPromises.push(createChartImage('Todas las áreas', datosGenerales, true));

    return Promise.all(chartPromises);
};