const express = require('express');
const { sequelize } = require('./models');

const app = express();

// Endpoint para investigar threads
app.get('/debug/:ticketId', async (req, res) => {
    const ticketId = req.params.ticketId;
    
    try {
        console.log(`🔍 Investigando threads para ticket ${ticketId}`);
        
        // 1. Verificar estructura de tabla ost_ticket_thread
        const tableStructure = await sequelize.query(`
            SHOW COLUMNS FROM ost_ticket_thread
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('📋 Estructura de ost_ticket_thread:', tableStructure);
        
        // 2. Contar threads para este ticket específico
        const threadCount = await sequelize.query(`
            SELECT COUNT(*) as total FROM ost_ticket_thread WHERE ticket_id = ?
        `, { 
            replacements: [ticketId],
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`📊 Threads para ticket ${ticketId}:`, threadCount[0].total);
        
        // 3. Obtener threads de ejemplo para este ticket
        const sampleThreads = await sequelize.query(`
            SELECT * FROM ost_ticket_thread WHERE ticket_id = ? LIMIT 3
        `, { 
            replacements: [ticketId],
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`📝 Threads encontrados:`, sampleThreads);
        
        // 4. Verificar si hay threads para otros tickets
        const anyThreads = await sequelize.query(`
            SELECT ticket_id, COUNT(*) as thread_count 
            FROM ost_ticket_thread 
            GROUP BY ticket_id 
            HAVING thread_count > 0 
            LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`🎯 Tickets con threads:`, anyThreads);
        
        // 5. Verificar si el ticket existe
        const ticketExists = await sequelize.query(`
            SELECT ticket_id, number FROM ost_ticket WHERE ticket_id = ?
        `, {
            replacements: [ticketId],
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`✅ Ticket existe:`, ticketExists);
        
        res.json({
            ticketId,
            tableStructure,
            threadCount: threadCount[0].total,
            sampleThreads,
            anyThreads,
            ticketExists,
            message: 'Investigación completada'
        });
        
    } catch (error) {
        console.error('❌ Error en debug:', error);
        res.status(500).json({ 
            error: error.message,
            ticketId 
        });
    }
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`🔍 Debug server corriendo en puerto ${PORT}`);
    console.log(`📍 Prueba: http://localhost:${PORT}/debug/14426`);
});
