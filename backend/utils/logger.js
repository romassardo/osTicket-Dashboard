const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logDir = path.join(__dirname, '../logs');
    
    // Crear directorio de logs si no existe
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Abrir write streams para evitar bloquear el event loop (async I/O)
    this._appStream = fs.createWriteStream(path.join(this.logDir, 'app.log'), { flags: 'a' });
    this._errorStream = fs.createWriteStream(path.join(this.logDir, 'error.log'), { flags: 'a' });
  }

  _formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  _writeToFile(level, formattedMessage) {
    if (level === 'error') {
      this._errorStream.write(formattedMessage + '\n');
    }
    this._appStream.write(formattedMessage + '\n');
  }

  info(message, ...args) {
    const formattedMessage = this._formatMessage('info', message, ...args);
    
    if (this.isDevelopment) {
      console.log(formattedMessage);
    } else {
      this._writeToFile('info', formattedMessage);
    }
  }

  error(message, ...args) {
    const formattedMessage = this._formatMessage('error', message, ...args);
    
    if (this.isDevelopment) {
      console.error(formattedMessage);
    } else {
      console.error(formattedMessage); // Errores siempre en consola
      this._writeToFile('error', formattedMessage);
    }
  }

  warn(message, ...args) {
    const formattedMessage = this._formatMessage('warn', message, ...args);
    
    if (this.isDevelopment) {
      console.warn(formattedMessage);
    } else {
      this._writeToFile('warn', formattedMessage);
    }
  }

  debug(message, ...args) {
    if (this.isDevelopment) {
      const formattedMessage = this._formatMessage('debug', message, ...args);
      console.log(formattedMessage);
    }
    // En producción, debug no se loguea
  }

  // Método especial para requests HTTP
  request(req, res, next) {
    const start = Date.now();
    const { method, url, ip } = req;
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const message = `${method} ${url} ${statusCode} ${duration}ms - ${ip}`;
      
      if (statusCode >= 400) {
        this.warn(message);
      } else {
        this.info(message);
      }
    });
    
    if (next) next();
  }
}

// Exportar instancia singleton
module.exports = new Logger(); 