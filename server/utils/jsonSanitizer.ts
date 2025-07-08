/**
 * Robust JSON sanitization utility to prevent parsing errors
 */

export class JsonSanitizer {
  /**
   * Sanitizes any value to be JSON-safe
   */
  static sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    
    if (typeof value === 'number') {
      return isNaN(value) || !isFinite(value) ? 0 : value;
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item));
    }
    
    if (typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeValue(val);
      }
      return sanitized;
    }
    
    return String(value);
  }
  
  /**
   * Sanitizes strings to prevent JSON parsing issues
   */
  static sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return String(str);
    }
    
    return str
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t') // Escape tabs
      .replace(/\f/g, '\\f') // Escape form feeds
      .replace(/\b/g, '\\b') // Escape backspace
      .trim()
      .substring(0, 1000); // Limit length
  }
  
  /**
   * Safely stringify JSON with error handling
   */
  static safeStringify(obj: any): string {
    try {
      const sanitized = this.sanitizeValue(obj);
      return JSON.stringify(sanitized);
    } catch (error) {
      console.error('JSON stringify error:', error);
      return JSON.stringify({ error: 'Serialization failed' });
    }
  }
  
  /**
   * Validates that a string is valid JSON
   */
  static isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}