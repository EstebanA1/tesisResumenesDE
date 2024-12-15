import { Router } from 'express';
import { authRequired } from '../middlewares/validateToken.js';
import { createReport, getReports, deleteReport } from '../controllers/report.controller.js';

const router = Router();

// Crear informe
router.post('/', authRequired, createReport);

// Obtener informes
router.get('/', authRequired, getReports);

// Eliminar informe
router.delete('/:id', authRequired, deleteReport);

export default router;


