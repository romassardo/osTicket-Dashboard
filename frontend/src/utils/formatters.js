export const formatDate = (dateString) => {
    if (!dateString)
        return 'N/A';
    try {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    catch (error) {
        console.error('Error formatting date:', error);
        return 'Fecha inválida';
    }
};
