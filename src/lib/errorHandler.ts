import { toast } from 'sonner';

/**
 * Global error handler for unhandled errors and promise rejections
 * Provides consistent error handling across the application
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

export interface HandledError {
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log error to monitoring service
 */
const logError = (error: HandledError) => {
  // In production, send to monitoring service (Sentry, DataDog, etc.)
  console.error('[Error Handler]', error);
  
  // Store critical errors locally for debugging
  if (error.severity === 'critical' || error.severity === 'high') {
    try {
      const errors = JSON.parse(localStorage.getItem('critical_errors') || '[]');
      errors.push(error);
      localStorage.setItem('critical_errors', JSON.stringify(errors.slice(-20)));
    } catch (e) {
      console.error('Failed to store error:', e);
    }
  }
};

/**
 * Handle application errors with appropriate user feedback
 */
export const handleError = (
  error: Error | unknown,
  context: Partial<ErrorContext> = {},
  showToast: boolean = true
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const handledError: HandledError = {
    message: errorMessage,
    stack: errorStack,
    context: {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context,
    },
    severity: determineSeverity(errorMessage),
  };

  logError(handledError);

  if (showToast) {
    const userMessage = getUserFriendlyMessage(errorMessage);
    
    if (handledError.severity === 'critical') {
      toast.error(userMessage, {
        description: 'Please refresh the page or contact support if this persists.',
        duration: 10000,
      });
    } else if (handledError.severity === 'high') {
      toast.error(userMessage, {
        duration: 5000,
      });
    } else {
      toast.warning(userMessage, {
        duration: 3000,
      });
    }
  }
};

/**
 * Determine error severity based on error message
 */
const determineSeverity = (message: string): HandledError['severity'] => {
  const lowerMessage = message.toLowerCase();
  
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('timeout')
  ) {
    return 'medium';
  }
  
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('authentication')
  ) {
    return 'high';
  }
  
  if (
    lowerMessage.includes('database') ||
    lowerMessage.includes('server error') ||
    lowerMessage.includes('internal error')
  ) {
    return 'critical';
  }
  
  return 'low';
};

/**
 * Convert technical error messages to user-friendly ones
 */
const getUserFriendlyMessage = (technicalMessage: string): string => {
  const lowerMessage = technicalMessage.toLowerCase();
  
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Unable to connect. Please check your internet connection.';
  }
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }
  
  if (lowerMessage.includes('not found')) {
    return 'The requested resource could not be found.';
  }
  
  if (lowerMessage.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }
  
  if (lowerMessage.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Default to technical message for development
  return process.env.NODE_ENV === 'development' 
    ? technicalMessage 
    : 'Something went wrong. Please try again.';
};

/**
 * Initialize global error handlers
 */
export const initializeErrorHandlers = () => {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    handleError(event.error, {
      component: 'window',
      action: 'uncaught_error',
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, {
      component: 'window',
      action: 'unhandled_rejection',
    });
  });

  console.log('[Error Handler] Global error handlers initialized');
};

/**
 * Get all stored errors for debugging/support
 */
export const getStoredErrors = (): HandledError[] => {
  try {
    return JSON.parse(localStorage.getItem('critical_errors') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear stored errors
 */
export const clearStoredErrors = (): void => {
  localStorage.removeItem('critical_errors');
  localStorage.removeItem('app_errors');
};
