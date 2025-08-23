export class ErrorHandler {
  static handle(error: unknown, context?: string): string {
    const prefix = context ? `[${context}] ` : '';
    
    if (error instanceof Error) {
      console.error(`${prefix}${error.message}`, error);
      return error.message;
    }
    
    if (typeof error === 'string') {
      console.error(`${prefix}${error}`);
      return error;
    }
    
    console.error(`${prefix}Unknown error`, error);
    return 'An unknown error occurred';
  }
  
  static async withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: unknown;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}