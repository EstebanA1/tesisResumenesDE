import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    stage: {
        type: String,
        required: true,
    },
    reportName: {
        type: String, 
        required: true,
    },
    reportUrl: {
        type: String, 
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('Report', ReportSchema);
