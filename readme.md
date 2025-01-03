# TESISRESUMENESDE

Sistema de generación de resúmenes lingüísticos y visuales para datos intermedios de dinámica ego.

## Descripción

TESISRESUMENESDE es una aplicación web fullstack diseñada para mejorar la comprensión y el trabajo relacionado con datos intermedios de dinámica ego, generando resúmenes lingüísticos y visuales. La aplicación permite a los usuarios registrados crear, gestionar y visualizar informes personalizados.

## Estructura del Proyecto

```
TESISRESUMENESDE/
├── backend/
│   ├── node_modules/
│   ├── src/
│   │   ├── controllers/
│   │   ├── libs/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── app.js
│   │   ├── config.js
│   │   ├── db.js
│   │   └── index.js
│   ├── .env
│   ├── package-lock.json
│   └── package.json
│
└── frontend/
    ├── node_modules/
    ├── src/
    │   ├── Etapas/
    │   ├── imagenes/
    │   ├── pages/
    │   ├── routes/
    │   ├── App.css
    │   ├── App.jsx
    │   ├── Home.jsx
    │   ├── Informe.jsx
    │   └── main.jsx
    ├── .env
    ├── index.html
    ├── package-lock.json
    ├── package.json
    └── vite.config.js
```

## Tecnologías Utilizadas

### Backend
- Node.js
- Express
- MongoDB
- JWT
- Bcrypt
- Zod

### Frontend
- React
- Vite
- Material-UI
- Axios
- Chart.js
- ExcelJS
- jsPDF
- React Router DOM
- React Dropzone

## Requisitos Previos

- Node.js
- MongoDB
- Git

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/EstebanA1/tesisResumenesDE.git
```

2. Configurar el backend:
```bash
cd backend
npm install
```

3. Crear archivo `.env` en el backend:
```env
MONGODB_URI=tu_uri_de_mongodb
PORT=tu_puerto
TOKEN_SECRET=tu_secret_key
```

4. Configurar el frontend:
```bash
cd frontend
npm install
```

5. Crear archivo `.env` en el frontend
```bash
VITE_API_URL=tu_api_vite
```
## Ejecución del Proyecto

1. Iniciar el backend:
```bash
cd backend
npm run dev
```

2. Iniciar el frontend:
```bash
cd frontend
npm run dev
```

## Características Principales

- Sistema de autenticación de usuarios
- CRUD de clientes
- Generación de informes personalizados
- Visualización de datos mediante gráficos
- Exportación de informes en PDF
- Interface intuitiva con Material-UI
- Carga de archivos mediante drag & drop

## Estructura de API

### Endpoints de Autenticación
- POST /api/registro - Registro de usuarios
- POST /api/login - Inicio de sesión
- GET /api/perfil - Obtener perfil del usuario

### Endpoints de Clientes
- GET /api/clients - Obtener lista de clientes
- GET /api/clients/:id - Obtener un cliente específico
- POST /api/clients - Crear nuevo cliente
- PUT /api/clients/:id - Actualizar cliente
- DELETE /api/clients/:id - Eliminar cliente

## Seguridad

- Autenticación mediante JWT
- Validación de esquemas con Zod
- Encriptación de contraseñas con Bcrypt
- Middleware de autorización para rutas protegidas

## Contribución

Para contribuir al proyecto:
1. Fork del repositorio
2. Crear una rama para tu feature
3. Commit de tus cambios
4. Push a la rama
5. Crear un Pull Request

## Sobre este Proyecto

Este es un proyecto académico de código abierto desarrollado para la universidad.