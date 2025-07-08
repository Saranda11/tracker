class Logger {
  private log(level: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

    if (args.length > 0) {
      console.log(logMessage, ...args);
    } else {
      console.log(logMessage);
    }
  }

  info(message: string, ...args: any[]) {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log("error", message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, ...args);
    }
  }
}

const logger = new Logger();
export default logger;
