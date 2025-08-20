const { sequelize } = require('./models');

async function investigateDatabase() {
    try {
        console.log('🔍 INVESTIGANDO ESTRUCTURA DE BASE DE DATOS OSTICKET');
        console.log('='.repeat(60));
        
        // 1. Verificar qué tablas existen relacionadas con threads/respuestas
        console.log('\n📋 1. BUSCANDO TABLAS RELACIONADAS CON THREADS/RESPUESTAS:');
        const tables = await sequelize.query(`
            SHOW TABLES LIKE '%thread%'
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Tablas con "thread":', tables);
        
        const responseTables = await sequelize.query(`
            SHOW TABLES LIKE '%response%'
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Tablas con "response":', responseTables);
        
        const entryTables = await sequelize.query(`
            SHOW TABLES LIKE '%entry%'
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Tablas con "entry":', entryTables);
        
        // 2. Verificar estructura de ost_ticket_thread si existe
        console.log('\n📋 2. ESTRUCTURA DE ost_ticket_thread:');
        try {
            const threadStructure = await sequelize.query(`
                DESCRIBE ost_ticket_thread
            `, { type: sequelize.QueryTypes.SELECT });
            
            console.log('Estructura de ost_ticket_thread:');
            threadStructure.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
            
            // 3. Contar registros en ost_ticket_thread
            const threadCount = await sequelize.query(`
                SELECT COUNT(*) as total FROM ost_ticket_thread
            `, { type: sequelize.QueryTypes.SELECT });
            
            console.log(`\n📊 Total registros en ost_ticket_thread: ${threadCount[0].total}`);
            
            // 4. Obtener algunos ejemplos de threads
            if (threadCount[0].total > 0) {
                const sampleThreads = await sequelize.query(`
                    SELECT ticket_id, id, poster, title, body, created 
                    FROM ost_ticket_thread 
                    LIMIT 5
                `, { type: sequelize.QueryTypes.SELECT });
                
                console.log('\n📝 EJEMPLOS DE THREADS:');
                sampleThreads.forEach((thread, index) => {
                    console.log(`  ${index + 1}. Ticket ID: ${thread.ticket_id}, Thread ID: ${thread.id}`);
                    console.log(`     Poster: ${thread.poster}`);
                    console.log(`     Title: ${thread.title}`);
                    console.log(`     Created: ${thread.created}`);
                    console.log(`     Body (primeros 100 chars): ${thread.body ? thread.body.substring(0, 100) : 'NULL'}...`);
                    console.log('');
                });
            }
            
        } catch (error) {
            console.log('❌ Error accediendo a ost_ticket_thread:', error.message);
        }
        
        // 5. Buscar otras posibles tablas para threads/respuestas
        console.log('\n📋 3. BUSCANDO TODAS LAS TABLAS OST_*:');
        const allOstTables = await sequelize.query(`
            SHOW TABLES LIKE 'ost_%'
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Todas las tablas ost_*:');
        allOstTables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  - ${tableName}`);
        });
        
        // 6. Verificar un ticket específico para ver qué datos tiene
        console.log('\n📋 4. INVESTIGANDO TICKET ESPECÍFICO (14411):');
        const ticketInfo = await sequelize.query(`
            SELECT * FROM ost_ticket WHERE ticket_id = 14411
        `, { type: sequelize.QueryTypes.SELECT });
        
        if (ticketInfo.length > 0) {
            console.log('Información del ticket 14411:');
            console.log('Campos disponibles:', Object.keys(ticketInfo[0]));
        }
        
        // 7. Buscar en ost_thread_entry si existe
        console.log('\n📋 5. VERIFICANDO ost_thread_entry:');
        try {
            const entryStructure = await sequelize.query(`
                DESCRIBE ost_thread_entry
            `, { type: sequelize.QueryTypes.SELECT });
            
            console.log('Estructura de ost_thread_entry encontrada:');
            entryStructure.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type}`);
            });
            
            const entryCount = await sequelize.query(`
                SELECT COUNT(*) as total FROM ost_thread_entry
            `, { type: sequelize.QueryTypes.SELECT });
            
            console.log(`Total registros en ost_thread_entry: ${entryCount[0].total}`);
            
        } catch (error) {
            console.log('❌ ost_thread_entry no existe o no es accesible:', error.message);
        }
        
        console.log('\n✅ INVESTIGACIÓN COMPLETADA');
        
    } catch (error) {
        console.error('❌ Error en investigación:', error);
    } finally {
        process.exit(0);
    }
}

investigateDatabase();
