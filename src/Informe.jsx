import { generarInformeEtapa1 } from './Etapas/etapa1';
import { generarInformeEtapa2 } from './Etapas/etapa2';
// import { generarInformeEtapa3 } from './Etapas/etapa3';
// import { generarInformeEtapa4 } from './Etapas/etapa4';
// import { generarInformeEtapa5 } from './Etapas/etapa5';
// import { generarInformeEtapa6 } from './Etapas/etapa6';
// import { generarInformeEtapa7 } from './Etapas/etapa7';
// import { generarInformeEtapa8 } from './Etapas/etapa8';
// import { generarInformeEtapa9 } from './Etapas/etapa9';
// import { generarInformeEtapa10 } from './Etapas/etapa10';

export const generarInforme = async (files, etapaSeleccionada, onProgress) => {
    const generadores = {
        1: generarInformeEtapa1,
        2: generarInformeEtapa2,
        // 3: generarInformeEtapa3,
        // 4: generarInformeEtapa4,
        // 5: generarInformeEtapa5,
        // 6: generarInformeEtapa6,
        // 7: generarInformeEtapa7,
        // 8: generarInformeEtapa8,
        // 9: generarInformeEtapa9,
        // 10: generarInformeEtapa10
    };

    const generador = generadores[etapaSeleccionada.id];
    if (!generador) {
        throw new Error("Etapa no reconocida");
    }

    return generador(files, etapaSeleccionada, onProgress);
};
