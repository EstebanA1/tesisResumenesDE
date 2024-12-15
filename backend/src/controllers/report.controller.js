
import Report from '../models/report.model.js';

export const createReport = async (req, res) => {
    const { stage, reportName, reportUrl } = req.body;

    if (!stage || !reportName || !reportUrl) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const newReport = new Report({
            user: req.user.id, // Esto se pasa desde el middleware `authRequired`
            stage,
            reportName,
            reportUrl,
        });

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (error) {
        console.error('Error al crear el informe:', error);
        res.status(500).json({ message: 'Error al guardar el informe' });
    }
}; 

export const getReports = async (req, res) => {
    try {
        const reports = await Report.find({ user: req.user.id });
        res.json(reports);
    } catch (error) {
        console.error('Error al obtener los informes:', error);
        res.status(500).json({ message: 'Error al obtener los informes' });
    }
}

export const deleteReport = async (req, res) => {
    const { id } = req.params;

    try {
        const report = await Report.findOneAndDelete({ _id: id, user: req.user.id });

        if (!report) {
            return res.status(404).json({ message: 'Informe no encontrado o no autorizado' });
        }

        res.json({ message: 'Informe eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el informe:', error);
        res.status(500).json({ message: 'Error al eliminar el informe' });
    }
};

