// src/utils/logger.ts

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

class Logger {
  private formatMessage(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  }

  info(message: string, ...args: any[]) {
    if (!IS_PRODUCTION) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(this.formatMessage('error', message), ...args);
  }

  debug(message: string, ...args: any[]) {
    if (!IS_PRODUCTION) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }
}

export const logger = new Logger();
