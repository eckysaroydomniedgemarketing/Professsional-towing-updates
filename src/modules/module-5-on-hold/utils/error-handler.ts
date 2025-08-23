export class ErrorHandler {
  private static maxRetries = 3;
  private static retryDelay = 1000;
  
  static async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = ErrorHandler.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await ErrorHandler.delay(ErrorHandler.retryDelay);
        return ErrorHandler.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }
  
  static handleError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  }
  
  static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('network') || 
             error.message.includes('fetch') ||
             error.message.includes('timeout');
    }
    return false;
  }
  
  static isSessionError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('session') || 
             error.message.includes('unauthorized') ||
             error.message.includes('401');
    }
    return false;
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}