require('dotenv').config({ path: require('path').resolve(__dirname, 'config/.env') });
// Script modificado para mostrar la estructura de ost_ticket_status

const sequelize = require('./config/db');

async function showSpecificTableStructure() {
  try {
    // Verificar la conexión a la base de datos
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');

    // Obtener el nombre de la base de datos (para confirmación o uso en consultas más complejas si es necesario)
    console.log('Punto A: Antes de SELECT DATABASE()');
    const [dbInfoResult] = await sequelize.query('SELECT DATABASE() as dbname');
    console.log('Punto B: Después de SELECT DATABASE(), dbInfoResult:', JSON.stringify(dbInfoResult));
    const dbName = dbInfoResult[0].dbname;
    console.log('Punto C: dbName obtenido:', dbName);
    
    const targetTableName = 'ost_ticket_status';

    // Verificar si la tabla existe (opcional, pero buena práctica)
    console.log('Punto D: targetTableName definido:', targetTableName);
    console.log('Punto E: Antes de SELECT table_name (table check)');
    const [tableCheckResult] = await sequelize.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      { replacements: [dbName, targetTableName] }
    );
    console.log('Punto F: Después de SELECT table_name (table check), tableCheckResult:', JSON.stringify(tableCheckResult));
    
    if (tableCheckResult.length === 0) {
      console.log(`\nTabla ${targetTableName} no encontrada en la base de datos ${dbName}.`);
    } else {
      console.log(`\nESTRUCTURA DE LA TABLA: ${targetTableName}`);
      console.log('====================================');
      
      console.log('Punto G: Antes de SHOW COLUMNS');
      const [columnsResult] = await sequelize.query(
        `SHOW COLUMNS FROM ${targetTableName}`
      );

      console.log('Punto H: Después de SHOW COLUMNS, verificando resultado...');
      console.log('Número de columnas encontradas:', columnsResult ? columnsResult.length : 0);

      if (columnsResult && columnsResult.length > 0) {
        console.log('--- Detalle de Columnas (inicio) ---');
        columnsResult.forEach(col => {
          console.log(`Campo: ${col.Field}, Tipo: ${col.Type}, Nulo: ${col.Null}, Clave: ${col.Key}, Default: ${col.Default}, Extra: ${col.Extra}`);
        });
        console.log('--- Detalle de Columnas (fin) ---');
      } else {
        console.log('No se encontraron columnas para la tabla o columnsResult está vacío.');
      }
      console.log('Procesamiento de columnas finalizado.');
    }

  } catch (error) {
    console.error('Error al explorar la base de datos:', error);
  } finally {
    // Cerrar la conexión
    if (sequelize) {
        await sequelize.close();
        console.log('\nConexión cerrada.');
    }
  }
}

// Ejecutar la función principal
showSpecificTableStructure();