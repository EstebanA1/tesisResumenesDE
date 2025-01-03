import { defineConfig } from "file:///C:/Users/ba215/Desktop/TESIS/tesisResumenesDE/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ba215/Desktop/TESIS/tesisResumenesDE/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";

var vite_config_default = defineConfig({
  plugins: [react()],
  base: "/tesisResumenesDE/"
});
export {
  vite_config_default as default
};
