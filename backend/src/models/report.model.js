import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    stage: {
        type: String, // Etapa del informe
        required: true,
    },
    reportName: {
        type: String, // Nombre del informe
        required: true,
    },
    reportUrl: {
        type: String, // URL o ruta donde se almacena el informe
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('Report', ReportSchema);
