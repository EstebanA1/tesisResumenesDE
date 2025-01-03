import { Router } from 'express';
import { authRequired } from '../middlewares/validateToken.js';
import { createReport, getReports, deleteReport } from '../controllers/report.controller.js';
import Report from '../models/report.model.js';  

const router = Router();

router.post('/', authRequired, createReport);

router.get('/', authRequired, getReports);

router.delete('/:id', authRequired, deleteReport);

router.put('/:id', authRequired, async (req, res) => {
    try {
        const { id } = req.params;
        const { reportName } = req.body;
        
        const updatedReport = await Report.findByIdAndUpdate(
            id,
            { reportName },
            { new: true }
        );

        if (!updatedReport) {
            return res.status(404).json({ message: 'Informe no encontrado' });
        }

        res.json(updatedReport);
    } catch (error) {
        console.error('Error al actualizar el informe:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;