// Importar los módulos necesarios
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno desde el archivo .env PRIMERO
dotenv.config({ path: './config/.env' });

// LUEGO importar módulos que usen las variables de entorno
// Importar la instancia de Sequelize y los modelos desde el archivo index.js de la carpeta models
const db = require('./models'); // Esto importa el objeto db de ./models/index.js

// Importar manejadores de rutas
const ticketRoutes = require('./routes/ticketRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const userRoutes = require('./routes/userRoutes');
const staffRoutes = require('./routes/staffRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const statusRoutes = require('./routes/statusRoutes');
const priorityRoutes = require('./routes/priorityRoutes');
const helpTopicRoutes = require('./routes/helpTopicRoutes');
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
app.get('/', (req, res) => {
  res.json({ message: '¡Bienvenido al API del Dashboard de OsTicket!' });
});

// Ruta de prueba para la base de datos
app.get('/api/db-test', async (req, res) => {
  try {
    const [results, metadata] = await db.sequelize.query("SELECT COUNT(*) as ticket_count FROM ost_ticket;");
    res.json({
      message: 'Conexión a BD exitosa y consulta realizada.',
      data: results[0] // results es un array, tomamos el primer elemento
    });
  } catch (error) {
    console.error('Error en /api/db-test:', error);
    res.status(500).json({
      message: 'Error al realizar la consulta a la base de datos.',
      error: error.message
    });
  }
});

// --- API Endpoints ---

// Usar los manejadores de rutas
app.use('/api/tickets', ticketRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/priorities', priorityRoutes);
app.use('/api/helptopics', helpTopicRoutes);

// Middleware de manejo de errores centralizado
// Debe ser el último middleware que se añade
app.use(errorHandler);

// Función para iniciar el servidor
async function startServer() {
  try {
    // Sincronizar todos los modelos con la base de datos
    // Esto también autenticará la conexión
    await db.sequelize.sync(); // { force: true } o { alter: true } si se necesitan cambios destructivos
    console.log('Todos los modelos fueron sincronizados exitosamente.');
    console.log('Modelos disponibles:', Object.keys(db.sequelize.models).join(', '));

    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar y sincronizar con la base de datos al iniciar el servidor:', error);
    // Opcionalmente, puedes decidir no iniciar el servidor si la BD no está disponible:
    // process.exit(1); 
  }
}

startServer();
