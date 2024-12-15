import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configurar dotenv para cargar variables de entorno
dotenv.config();

export const connectDB = async () => {
    try {
        // Conectar a MongoDB usando la URL desde el archivo .env
        await mongoose.connect(process.env.DB_URL);
        console.log("La base de datos está conectada");
    } catch (error) {
        console.error("Error al conectar la base de datos:", error);
    }
};
