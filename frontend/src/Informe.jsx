import { generarInformeEtapa1 } from './Etapas/etapa1';
import { generarInformeEtapa2 } from './Etapas/etapa2';
import { generarInformeEtapa3 } from './Etapas/etapa3';

export const generarInforme = async (files, etapaSeleccionada, onProgress) => {
    const generadores = {
        1: generarInformeEtapa1,
        2: generarInformeEtapa2,
        3: generarInformeEtapa3,
    };

    const generador = generadores[etapaSeleccionada.id];
    if (!generador) {
        throw new Error("Etapa no reconocida");
    }

    return generador(files, etapaSeleccionada, onProgress);
};
