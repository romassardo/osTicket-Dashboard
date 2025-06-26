require('dotenv').config({ path: require('path').resolve(__dirname, 'config/.env') });
const mysql = require('mysql2');

console.log('Intentando conectar a MySQL con mysql2 directamente...');
// console.log('Host:', process.env.DB_HOST);
// console.log('Port:', process.env.DB_PORT);
// console.log('User:', process.env.DB_USER);
// console.log('Database:', process.env.DB_NAME);

const connectionConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000, // 10 segundos de timeout para la conexión
  // debug: true // Habilitar logs de depuración para mysql2
};

let connection;
try {
  connection = mysql.createConnection(connectionConfig);

  connection.connect(function(err) {
    if (err) {
      console.error('Error al conectar con mysql2:', err.stack);
      if (err.code) {
        console.error('Código de error:', err.code);
      }
      if (err.fatal) {
        console.error('Error fatal:', err.fatal);
      }
      // Imprimir más detalles del error si están disponibles
      if (err.errno) console.error('Errorno:', err.errno);
      if (err.sqlState) console.error('SQLState:', err.sqlState);
      if (err.sqlMessage) console.error('SQLMessage:', err.sqlMessage);
      process.exit(1); // Salir con error
    }
    console.log('¡Conexión exitosa con mysql2! ID de conexión:', connection.threadId);

    const tableName = 'ost_user';
    console.log(`Intentando SHOW COLUMNS FROM ${tableName} con mysql2...`);

    connection.query(`SHOW COLUMNS FROM ${tableName}`, function (err, results, fields) {
      if (err) {
        console.error(`Error al ejecutar SHOW COLUMNS FROM ${tableName} con mysql2:`, err.stack);
        connection.end();
        process.exit(1);
        return;
      }

      console.log(`Estructura de ${tableName} obtenida con mysql2:`);
      if (results && results.length > 0) {
        results.forEach(col => {
          console.log(`  Campo: ${col.Field}, Tipo: ${col.Type}, Nulo: ${col.Null}, Clave: ${col.Key}, Default: ${col.Default}, Extra: ${col.Extra}`);
        });
      } else {
        console.log('No se encontraron columnas o el resultado está vacío.');
      }
      
      connection.end();
      console.log('Conexión mysql2 cerrada.');
      process.exit(0); // Salir con éxito
    });
  });

} catch (e) {
  console.error('Error al crear la conexión mysql2:', e);
  process.exit(1); // Salir con error
}
