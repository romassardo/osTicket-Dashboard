type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  args?: unknown[];
}

class Logger {
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Límite de logs en memoria

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  private addToMemory(level: LogLevel, message: string, ...args: unknown[]): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      args: args.length > 0 ? args : undefined
    };

    this.logs.push(logEntry);

    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  info(message: string, ...args: unknown[]): void {
    this.addToMemory('info', message, ...args);
    
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('info', message);
      console.log(formattedMessage, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    this.addToMemory('warn', message, ...args);
    
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('warn', message);
      console.warn(formattedMessage, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    this.addToMemory('error', message, ...args);
    
    // Los errores siempre se muestran, incluso en producción
    const formattedMessage = this.formatMessage('error', message);
    console.error(formattedMessage, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      this.addToMemory('debug', message, ...args);
      const formattedMessage = this.formatMessage('debug', message);
      console.log(formattedMessage, ...args);
    }
  }

  // Método para obtener logs (útil para debugging)
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Método para limpiar logs
  clearLogs(): void {
    this.logs = [];
  }

  // Método para exportar logs (útil para reportes de errores)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Exportar instancia singleton
export default new Logger(); 