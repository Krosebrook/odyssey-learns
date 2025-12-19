import { toast } from 'sonner';

/**
 * Global error handler for unhandled errors and promise rejections
 * Production-grade implementation with batching and retry logic
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

// Batch configuration for database logging
const ERROR_BATCH_SIZE = 10;
const ERROR_BATCH_TIMEOUT = 5000; // 5 seconds
let errorBatch: HandledError[] = [];
let batchTimeout: NodeJS.Timeout | null = null;

/**
 * Flush error batch to database
 */
const flushErrorBatch = async () => {
  if (errorBatch.length === 0) return;

  const batch = [...errorBatch];
  errorBatch = [];
  
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const records = batch.map(error => ({
      user_id: error.context.userId || null,
      error_message: error.message.substring(0, 500), // Limit length
      error_stack: error.stack?.substring(0, 2000) || null, // Limit length
      severity: error.severity,
      component: error.context.component?.substring(0, 100) || null,
      action: error.context.action?.substring(0, 100) || null,
      url: error.context.url.substring(0, 500),
      user_agent: error.context.userAgent.substring(0, 500),
      metadata: {
        timestamp: error.context.timestamp,
        batchSize: batch.length
      }
    }));

    const { error: dbError } = await supabase.from('error_logs').insert(records);
    
    if (dbError) {
      console.error('[Error Handler] Failed to log error batch:', dbError);
      storeFailedBatch(batch);
    }
  } catch (error) {
    console.error('[Error Handler] Critical: Failed to flush error batch:', error);
    storeFailedBatch(batch);
  }
};

/**
 * Store failed batch locally for retry (using sessionStorage for security)
 */
const storeFailedBatch = (batch: HandledError[]) => {
  try {
    const failed = JSON.parse(sessionStorage.getItem('failed_error_batches') || '[]');
    failed.push(...batch);
    // Keep only last 50 errors, limit sensitive data exposure
    sessionStorage.setItem('failed_error_batches', JSON.stringify(failed.slice(-50)));
  } catch (e) {
    console.error('[Error Handler] Failed to store error batch locally:', e);
  }
};

/**
 * Retry failed batches (using sessionStorage for security)
 */
export const retryFailedBatches = async () => {
  try {
    const failed = JSON.parse(sessionStorage.getItem('failed_error_batches') || '[]');
    if (failed.length === 0) return;

    const { supabase } = await import('@/integrations/supabase/client');
    
    const records = failed.map((error: HandledError) => ({
      user_id: error.context.userId || null,
      error_message: error.message.substring(0, 500),
      error_stack: error.stack?.substring(0, 2000) || null,
      severity: error.severity,
      component: error.context.component?.substring(0, 100) || null,
      action: error.context.action?.substring(0, 100) || null,
      url: error.context.url.substring(0, 500),
      user_agent: error.context.userAgent.substring(0, 500),
      metadata: { timestamp: error.context.timestamp, retry: true }
    }));

    const { error: dbError } = await supabase.from('error_logs').insert(records);
    
    if (!dbError) {
      sessionStorage.removeItem('failed_error_batches');
      console.log('[Error Handler] Successfully retried failed batches');
    }
  } catch (error) {
    console.error('[Error Handler] Failed to retry batches:', error);
  }
};

/**
 * Add error to batch and schedule flush (using sessionStorage for security)
 */
const addToBatch = (error: HandledError) => {
  errorBatch.push(error);

  // Store critical errors immediately to session storage (not persisted across sessions for security)
  if (error.severity === 'critical' || error.severity === 'high') {
    try {
      const errors = JSON.parse(sessionStorage.getItem('critical_errors') || '[]');
      errors.push(error);
      // Limit to 20 most recent critical errors
      sessionStorage.setItem('critical_errors', JSON.stringify(errors.slice(-20)));
    } catch (e) {
      console.error('[Error Handler] Failed to store critical error locally:', e);
    }
  }

  // Flush immediately if batch is full
  if (errorBatch.length >= ERROR_BATCH_SIZE) {
    flushErrorBatch();
    return;
  }

  // Schedule batch flush
  if (!batchTimeout) {
    batchTimeout = setTimeout(flushErrorBatch, ERROR_BATCH_TIMEOUT);
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
  
  const sanitizedContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    component: context.component?.substring(0, 100),
    action: context.action?.substring(0, 100),
    userId: context.userId,
  };

  const handledError: HandledError = {
    message: errorMessage.substring(0, 500),
    stack: errorStack?.substring(0, 2000),
    context: sanitizedContext,
    severity: determineSeverity(errorMessage),
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', handledError);
  }

  addToBatch(handledError);

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
    } else if (handledError.severity === 'medium') {
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
    lowerMessage.includes('database') ||
    lowerMessage.includes('server error') ||
    lowerMessage.includes('internal error') ||
    lowerMessage.includes('crash') ||
    lowerMessage.includes('fatal')
  ) {
    return 'critical';
  }
  
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('security')
  ) {
    return 'high';
  }
  
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('abort')
  ) {
    return 'medium';
  }
  
  return 'low';
};

/**
 * Convert technical error messages to user-friendly messages
 */
const getUserFriendlyMessage = (technicalMessage: string): string => {
  const lowerMessage = technicalMessage.toLowerCase();
  
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  if (lowerMessage.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
    return 'You need to sign in to continue.';
  }
  
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission')) {
    return 'You don\'t have permission to perform this action.';
  }
  
  if (lowerMessage.includes('not found')) {
    return 'The requested resource was not found.';
  }
  
  if (lowerMessage.includes('database')) {
    return 'A database error occurred. Our team has been notified.';
  }
  
  if (lowerMessage.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Generic message for unknown errors
  return 'Something went wrong. Please try again later.';
};

/**
 * Setup global error handlers
 */
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    handleError(event.reason, {
      component: 'global',
      action: 'unhandled_promise_rejection',
    });
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    event.preventDefault();
    handleError(event.error || event.message, {
      component: 'global',
      action: 'uncaught_error',
    });
  });

  // Retry failed batches on page load
  retryFailedBatches();

  // Flush any remaining errors before page unload
  window.addEventListener('beforeunload', () => {
    flushErrorBatch();
  });

  console.log('[Error Handler] Global error handlers initialized');
};

/**
 * Manually flush error batch (useful for testing)
 */
export const flushErrors = flushErrorBatch;

/**
 * Get all stored errors for debugging/support (from sessionStorage)
 */
export const getStoredErrors = (): HandledError[] => {
  try {
    return JSON.parse(sessionStorage.getItem('critical_errors') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear stored errors from sessionStorage
 */
export const clearStoredErrors = (): void => {
  sessionStorage.removeItem('critical_errors');
  sessionStorage.removeItem('failed_error_batches');
};

/**
 * Clear all sensitive session data (call on logout)
 */
export const clearSensitiveData = (): void => {
  clearStoredErrors();
  // Clear any other session-related data
  sessionStorage.removeItem('session_activity');
};
