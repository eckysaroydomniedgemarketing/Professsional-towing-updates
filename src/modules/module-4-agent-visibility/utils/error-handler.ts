export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('already running')) {
      return 'Workflow is already running. Please stop it first.';
    }
    if (error.message.includes('not running')) {
      return 'Workflow is not running. Please start it first.';
    }
    if (error.message.includes('Session timeout') || error.message.includes('authenticate')) {
      return 'Session expired. Please login to RDN portal again.';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('automatic mode')) {
      return 'Cannot process manually while in automatic mode.';
    }
    
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

export function isSessionError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes('Session') || message.includes('login') || message.includes('authenticate');
}

export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes('Network') || message.includes('fetch') || message.includes('connection');
}