// Importar los módulos necesarios
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde el archivo .env PRIMERO
dotenv.config({ path: './config/.env' });

// LUEGO importar módulos que usen las variables de entorno
// Importar la instancia de Sequelize y los modelos desde el archivo index.js de la carpeta models
const db = require('./models'); // Esto importa el objeto db de ./models/index.js
const logger = require('./utils/logger');

// Importar manejadores de rutas
const ticketRoutes = require('./routes/ticketRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const userRoutes = require('./routes/userRoutes');
const staffRoutes = require('./routes/staffRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const statusRoutes = require('./routes/statusRoutes');
const priorityRoutes = require('./routes/priorityRoutes');
const helpTopicRoutes = require('./routes/helpTopicRoutes');
const statsRoutes = require('./routes/statsRoutes'); // <-- AÑADIR NUEVA RUTA
const slaRoutes = require('./routes/slaRoutes');
const errorHandler = require('./middleware/errorHandler');

// Crear una instancia de la aplicación Express
const app = express();

// Definir el puerto en el que escuchará el servidor
// Usará el valor de BACKEND_PORT del archivo .env, o 3001 si no está definido
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware para parsear JSON en las solicitudes
app.use(express.json());

// Middleware para habilitar CORS
app.use(cors()); // Esto permitirá todas las solicitudes CORS por defecto
// Para configuraciones más específicas, consulta la documentación de CORS: https://www.npmjs.com/package/cors
// Ejemplo: app.use(cors({ origin: 'http://localhost:5173' }));

// Ruta de prueba para verificar que el servidor funciona
// Ruta de prueba que ahora será manejada por el servidor de archivos estáticos
// app.get('/', (req, res) => {
//   res.json({ message: '¡Bienvenido al API del Dashboard de OsTicket!' });
// });

// Ruta de prueba para la base de datos
// app.get('/api/db-test', async (req, res) => {
//   try {
//     const [results, metadata] = await db.sequelize.query("SELECT COUNT(*) as ticket_count FROM ost_ticket;");
//     res.json({
//       message: 'Conexión a BD exitosa y consulta realizada.',
//       data: results[0] // results es un array, tomamos el primer elemento
//     });
//   } catch (error) {
//     console.error('Error en /api/db-test:', error);
//     res.status(500).json({
//       message: 'Error al realizar la consulta a la base de datos.',
//       error: error.message
//     });
//   }
// });

// --- API Endpoints ---

// Usar los manejadores de rutas
logger.debug('Registrando ruta /api/tickets...');
app.use('/api/tickets', ticketRoutes);
logger.debug('✓ Ruta /api/tickets registrada exitosamente');

logger.debug('Registrando ruta /api/departments...');
app.use('/api/departments', departmentRoutes);
logger.debug('✓ Ruta /api/departments registrada exitosamente');

logger.debug('Registrando ruta /api/users...');
app.use('/api/users', userRoutes);
logger.debug('✓ Ruta /api/users registrada exitosamente');

logger.debug('Registrando ruta /api/staff...');
app.use('/api/staff', staffRoutes);
logger.debug('✓ Ruta /api/staff registrada exitosamente');

logger.debug('Registrando ruta /api/organizations...');
app.use('/api/organizations', organizationRoutes);
logger.debug('✓ Ruta /api/organizations registrada exitosamente');

logger.debug('Registrando ruta /api/statuses...');
app.use('/api/statuses', statusRoutes);
logger.debug('✓ Ruta /api/statuses registrada exitosamente');

logger.debug('Registrando ruta /api/priorities...');
app.use('/api/priorities', priorityRoutes);
logger.debug('✓ Ruta /api/priorities registrada exitosamente');

logger.debug('Registrando ruta /api/helptopics...');
app.use('/api/helptopics', helpTopicRoutes);
logger.debug('✓ Ruta /api/helptopics registrada exitosamente');

logger.debug('Registrando ruta /api/stats...');
app.use('/api/stats', statsRoutes); // <-- AÑADIR USO DE LA RUTA
logger.debug('✓ Ruta /api/stats registrada exitosamente');

logger.debug('Registrando ruta /api/sla...');
app.use('/api/sla', slaRoutes);
logger.debug('✓ Ruta /api/sla registrada exitosamente');

logger.info('✓ Todas las rutas API registradas exitosamente');

// Middleware de manejo de errores centralizado
// Debe registrarse DESPUÉS de las rutas de la API pero ANTES de servir el frontend.
app.use(errorHandler);

// --- Servir Frontend Estático ---

// Construir la ruta a la carpeta 'dist' del frontend
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

// Servir los archivos estáticos de la aplicación de React
app.use(express.static(frontendDistPath));

// Para cualquier otra ruta no manejada por la API o los archivos estáticos,
// servir el index.html de la aplicación de React.
// Esto es crucial para que el enrutamiento del lado del cliente (React Router) funcione.
// Compatible con Express 5.x - usa middleware condicional en lugar de regex
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    next();
  }
});

// Función para iniciar el servidor
async function startServer() {
  try {
    // Sincronizar todos los modelos con la base de datos
    // Esto también autenticará la conexión
    await db.sequelize.sync(); // { force: true } o { alter: true } si se necesitan cambios destructivos
    logger.info('Modelos disponibles:', Object.keys(db.models));

    app.listen(PORT, () => {
      logger.info(`Servidor backend escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('No se pudo conectar y sincronizar con la base de datos al iniciar el servidor:', error);
    // Opcionalmente, puedes decidir no iniciar el servidor si la BD no está disponible:
    // process.exit(1); 
  }
}

startServer();
