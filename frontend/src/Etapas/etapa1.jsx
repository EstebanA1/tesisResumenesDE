import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import Chart from 'chart.js/auto';

export const generarInformeEtapa1 = async (files, etapaSeleccionada, onProgress) => {
    let diccionario = {};
    let cambiosPorArea = {};
    let yPos = 40;

    onProgress(5);

    const diccionarioFile = files.find(file => file.name.endsWith('.xlsx'));
    if (diccionarioFile) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await diccionarioFile.arrayBuffer());
        const worksheet = workbook.getWorksheet(1);

        const totalRows = worksheet.rowCount;
        let processedRows = 0;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 1) {
                let variable, description;
                if (row.values.length >= 3) {
                    [variable, description] = row.values.slice(1, 3);
                } else if (row.values.length === 2) {
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
            processedRows++;
            onProgress(5 + Math.floor((processedRows / totalRows) * 10));
        });
    }

    onProgress(15);

    const cambiosFile = files.find(file => file.type === 'text/csv');
    if (cambiosFile) {
        const content = await cambiosFile.text();
        let erroresYAdvertencias = 0;
        const rows = content.split('\n')
            .map(row => row.split(',').map(item => item.trim()))
            .filter(row => row.some(cell => cell !== ''));

        const totalRows = rows.length - 1;
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
                }
            }
            onProgress(15 + Math.floor((index / totalRows) * 20));
        });
    }

    onProgress(35);

    const doc = new jsPDF();
    let title = `Informe de Matriz de Transición - ${etapaSeleccionada.name}`;
    doc.setTextColor(100);
    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.width / 2, 20, { align: 'center' });

    yPos = 40;
    const lineHeight = 10;
    const marginRight = 180;

    let areasProcesadas = 0;
    const totalAreas = Object.keys(cambiosPorArea).length;

    for (let [area, cambios] of Object.entries(cambiosPorArea)) {
        let texto = `${area} tuvo ${cambios.length} cambio${cambios.length > 1 ? 's' : ''} que ${cambios.length > 1 ? 'fueron' : 'fue'}:`;

        let espacioNecesario = lineHeight * 1.5;
        cambios.forEach((cambio) => {
            let detalleCambio = `- Pasó a ${cambio.to} en un ${(cambio.rate * 100).toFixed(4)}%`;
            let splitText = doc.splitTextToSize(detalleCambio, marginRight);
            espacioNecesario += splitText.length * lineHeight + lineHeight / 8;
        });
        espacioNecesario += lineHeight * 1.5;

        if (yPos + espacioNecesario > doc.internal.pageSize.height - 20) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.text(texto, 20, yPos);
        yPos += lineHeight * 1.5;

        cambios.forEach((cambio, index) => {
            doc.setFontSize(12);
            let detalleCambio = `- Pasó a ${cambio.to} en un ${(cambio.rate * 100).toFixed(4)}%`;
            let splitText = doc.splitTextToSize(detalleCambio, marginRight);

            splitText.forEach((line, i) => {
                doc.text(line, 30, yPos);
                yPos += lineHeight;
            });

            yPos += lineHeight / 8;
        });

        yPos += lineHeight * 1.5;

        areasProcesadas++;
        onProgress(35 + Math.floor((areasProcesadas / totalAreas) * 15));
    }

    doc.addPage();
    onProgress(50);

    const createChartImage = (area, cambios, isGeneral = false) => {
        return new Promise((resolve) => {
            const baseWidth = 400;
            const baseHeight = isGeneral ? 400 : 300;
            const chartWidth = isGeneral ? baseWidth : Math.max(baseWidth, cambios.length * 60);
            const chartHeight = isGeneral ? baseHeight : baseHeight;

            const canvas = document.createElement('canvas');
            canvas.width = chartWidth * 2;
            canvas.height = chartHeight * 2;
            const ctx = canvas.getContext('2d');

            const distinctColors = isGeneral ? generateDistinctColors(cambios.length) : ['rgba(54, 162, 235, 0.8)'];

            new Chart(ctx, {
                type: isGeneral ? 'pie' : 'bar',
                data: {
                    labels: cambios.map(c => c.to),
                    datasets: [{
                        label: 'Porcentaje de cambio',
                        data: isGeneral ? cambios.map(c => c.rate) : cambios.map(c => c.rate * 100),
                        backgroundColor: distinctColors,
                        borderColor: 'rgba(255, 255, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    indexAxis: 'x',
                    animation: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += context.parsed.toFixed(2) + '%';
                                    return label;
                                }
                            }
                        },
                        title: {
                            display: !isGeneral,
                            text: isGeneral ? '' : `Cambios desde ${area}`,
                            font: {
                                size: 16
                            }
                        },
                        legend: {
                            display: isGeneral,
                            position: 'right',
                            labels: {
                                generateLabels: function (chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map((label, i) => {
                                            const meta = chart.getDatasetMeta(0);
                                            const style = meta.controller.getStyle(i);
                                            return {
                                                text: `${label} (${data.datasets[0].data[i].toFixed(2)}%)`,
                                                fillStyle: style.backgroundColor,
                                                strokeStyle: style.borderColor,
                                                lineWidth: style.borderWidth,
                                                hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        }
                    },
                    scales: isGeneral ? {} : {
                        x: {
                            ticks: {
                                callback: function (value) {
                                    const label = this.getLabelForValue(value);
                                    return label.split(' ');
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });

            requestAnimationFrame(() => {
                const imgData = canvas.toDataURL('image/png');
                resolve({ imgData, width: chartWidth, height: chartHeight });
            });
        });
    };

    const generateAllCharts = async () => {
        const chartPromises = Object.entries(cambiosPorArea).map(([area, cambios]) =>
            createChartImage(area, cambios, false)
        );

        const datosGenerales = prepararDatosGraficoGeneral(cambiosPorArea);
        chartPromises.push(createChartImage('Todas las áreas', datosGenerales, true));

        return Promise.all(chartPromises);
    };

    const allCharts = await generateAllCharts();

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text('Gráficos individuales de  Matriz de Transición', doc.internal.pageSize.width / 2, 30, { align: 'center' });

    let isFirstChart = true;
    for (let i = 0; i < allCharts.length - 1; i++) {
        const chartData = allCharts[i];
        if (!isFirstChart) {
            doc.addPage();
        } else {
            yPos = 40; 
        }

        if (chartData) {
            try {
                const pdfWidth = doc.internal.pageSize.width;
                const pdfHeight = doc.internal.pageSize.height;
                const aspectRatio = chartData.width / chartData.height;
                let imgWidth = pdfWidth - 20;
                let imgHeight = imgWidth / aspectRatio;

                if (imgHeight > pdfHeight - 60) { 
                    imgHeight = pdfHeight - 60;
                    imgWidth = imgHeight * aspectRatio;
                }

                const xPos = (pdfWidth - imgWidth) / 2;
                doc.addImage(chartData.imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
            } catch (error) {
                console.error(`Error al añadir la imagen al PDF:`, error);
            }
        }
        isFirstChart = false;
        onProgress(50 + Math.floor(((i + 1) / allCharts.length) * 40));
    }

    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text('Gráfico General de Matriz de Transición', doc.internal.pageSize.width / 2, 30, { align: 'center' });

    const chartDataGeneral = allCharts[allCharts.length - 1];
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
        } catch (error) {
            console.error('Error al añadir el gráfico general al PDF:', error);
        }
    }

    onProgress(95);

    const pdfUrl = doc.output('bloburl');
    onProgress(100);
    return pdfUrl;
};

function generateDistinctColors(count) {
    const hueStep = 360 / count;
    return Array.from({ length: count }, (_, i) => {
        const hue = i * hueStep;
        return `hsl(${hue}, 70%, 60%)`;
    });
}

const prepararDatosGraficoGeneral = (cambiosPorArea) => {
    let datosGenerales = [];
    let totalCambios = 0;

    for (let cambios of Object.values(cambiosPorArea)) {
        const sumaCambiosArea = cambios.reduce((sum, cambio) => sum + cambio.rate, 0);
        totalCambios += sumaCambiosArea;
    }

    for (let [area, cambios] of Object.entries(cambiosPorArea)) {
        const sumaCambiosArea = cambios.reduce((sum, cambio) => sum + cambio.rate, 0);
        const porcentaje = (sumaCambiosArea / totalCambios) * 100;
        datosGenerales.push({ to: area, rate: porcentaje });
    }

    datosGenerales.sort((a, b) => b.rate - a.rate);

    let sumaTotal = 0;
    datosGenerales = datosGenerales.map((dato, index, array) => {
        if (index === array.length - 1) {
            const rateAjustado = 100 - sumaTotal;
            return { ...dato, rate: rateAjustado };
        } else {
            const rateRedondeado = Math.round(dato.rate * 100) / 100;
            sumaTotal += rateRedondeado;
            return { ...dato, rate: rateRedondeado };
        }
    });

    return datosGenerales;
};