import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("La base de datos está conectada");
    } catch (error) {
        console.error("Error al conectar la base de datos:", error);
    }
};
