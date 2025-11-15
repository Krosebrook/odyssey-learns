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
 * Log error to monitoring service and database
 */
const logError = async (error: HandledError) => {
  console.error('[Error Handler]', error);
  
  // Log to database for centralized monitoring
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.from('error_logs').insert({
      user_id: error.context.userId || null,
      error_message: error.message,
      error_stack: error.stack || null,
      severity: error.severity,
      component: error.context.component || null,
      action: error.context.action || null,
      url: error.context.url,
      user_agent: error.context.userAgent,
      metadata: {
        timestamp: error.context.timestamp,
        ...error.context
      }
    });
  } catch (dbError) {
    console.warn('Failed to log error to database:', dbError);
  }
  
  // Store critical errors locally as backup
  if (error.severity === 'critical' || error.severity === 'high') {
    try {
      const errors = JSON.parse(localStorage.getItem('critical_errors') || '[]');
      errors.push(error);
      localStorage.setItem('critical_errors', JSON.stringify(errors.slice(-20)));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  }
};

/**
 * Handle application errors with appropriate user feedback
 */
export const handleError = async (
  error: Error | unknown,
  context: Partial<ErrorContext> = {},
  showToast: boolean = true
): Promise<void> => {
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

  await logError(handledError);

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
