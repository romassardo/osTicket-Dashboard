const mysql = require('mysql2/promise');

async function investigateThreads() {
    let connection;
    
    try {
        // Conectar usando las credenciales del .env
        connection = await mysql.createConnection({
            host: '10.12.32.4',
            port: 3306,
            user: 'powerbi',
            password: 'Diego2024@',
            database: 'osticketdb'
        });
        
        console.log('✅ Conectado a la base de datos osticketdb');
        console.log('='.repeat(60));
        
        // 1. Buscar tablas relacionadas con threads
        console.log('\n📋 1. TABLAS RELACIONADAS CON THREADS:');
        const [threadTables] = await connection.execute(`SHOW TABLES LIKE '%thread%'`);
        console.log('Tablas con "thread":', threadTables);
        
        const [entryTables] = await connection.execute(`SHOW TABLES LIKE '%entry%'`);
        console.log('Tablas con "entry":', entryTables);
        
        const [responseTables] = await connection.execute(`SHOW TABLES LIKE '%response%'`);
        console.log('Tablas con "response":', responseTables);
        
        // 2. Investigar ost_ticket_thread
        console.log('\n📋 2. ESTRUCTURA DE ost_ticket_thread:');
        try {
            const [structure] = await connection.execute(`DESCRIBE ost_ticket_thread`);
            console.log('Campos disponibles:');
            structure.forEach(field => {
                console.log(`  - ${field.Field}: ${field.Type} (${field.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
            
            // 3. Contar registros
            const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ost_ticket_thread`);
            console.log(`\n📊 Total registros: ${count[0].total}`);
            
            // 4. Ver ejemplos
            if (count[0].total > 0) {
                console.log('\n📝 EJEMPLOS DE THREADS:');
                const [examples] = await connection.execute(`
                    SELECT ticket_id, id, poster, title, LEFT(body, 100) as body_preview, created 
                    FROM ost_ticket_thread 
                    ORDER BY created DESC 
                    LIMIT 5
                `);
                
                examples.forEach((thread, index) => {
                    console.log(`  ${index + 1}. Ticket: ${thread.ticket_id}, ID: ${thread.id}`);
                    console.log(`     Poster: ${thread.poster}`);
                    console.log(`     Title: ${thread.title}`);
                    console.log(`     Created: ${thread.created}`);
                    console.log(`     Body: ${thread.body_preview}...`);
                    console.log('');
                });
                
                // 5. Buscar threads para ticket específico
                console.log('\n📋 3. THREADS PARA TICKET 14411:');
                const [specificThreads] = await connection.execute(`
                    SELECT * FROM ost_ticket_thread WHERE ticket_id = 14411
                `);
                
                if (specificThreads.length > 0) {
                    console.log(`✅ Encontrados ${specificThreads.length} threads para ticket 14411:`);
                    specificThreads.forEach(thread => {
                        console.log(`  - ID: ${thread.id}, Poster: ${thread.poster}, Title: ${thread.title}`);
                    });
                } else {
                    console.log('❌ No se encontraron threads para ticket 14411');
                    
                    // Buscar tickets que SÍ tienen threads
                    console.log('\n📋 4. TICKETS QUE SÍ TIENEN THREADS:');
                    const [withThreads] = await connection.execute(`
                        SELECT ticket_id, COUNT(*) as thread_count 
                        FROM ost_ticket_thread 
                        GROUP BY ticket_id 
                        HAVING thread_count > 0 
                        LIMIT 5
                    `);
                    
                    console.log('Tickets con threads:');
                    withThreads.forEach(ticket => {
                        console.log(`  - Ticket ${ticket.ticket_id}: ${ticket.thread_count} threads`);
                    });
                }
            }
            
        } catch (error) {
            console.log('❌ Error accediendo a ost_ticket_thread:', error.message);
        }
        
        // 6. Investigar ost_thread_entry si existe
        console.log('\n📋 5. INVESTIGANDO ost_thread_entry:');
        try {
            const [entryStructure] = await connection.execute(`DESCRIBE ost_thread_entry`);
            console.log('✅ ost_thread_entry existe. Campos:');
            entryStructure.forEach(field => {
                console.log(`  - ${field.Field}: ${field.Type}`);
            });
            
            const [entryCount] = await connection.execute(`SELECT COUNT(*) as total FROM ost_thread_entry`);
            console.log(`Total registros en ost_thread_entry: ${entryCount[0].total}`);
            
        } catch (error) {
            console.log('❌ ost_thread_entry no existe:', error.message);
        }
        
        console.log('\n✅ INVESTIGACIÓN COMPLETADA');
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

investigateThreads();
