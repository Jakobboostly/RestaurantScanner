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
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/"/g, '\\"') // Then escape quotes
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, ' ') // Replace carriage returns with spaces
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .trim()
      .substring(0, 2000); // Increase length limit
  }
  
  /**
   * Safely stringify JSON with error handling
   */
  static safeStringify(obj: any): string {
    try {
      // First sanitize the entire object
      const sanitizedObj = this.sanitizeValue(obj);
      
      // Use built-in JSON.stringify with proper error handling
      const jsonString = JSON.stringify(sanitizedObj, null, 0);
      
      // Validate the JSON is not truncated
      if (jsonString && this.isValidJson(jsonString)) {
        return jsonString;
      } else {
        throw new Error('Invalid JSON generated');
      }
    } catch (error) {
      console.error('JSON stringify error:', error);
      return JSON.stringify({ error: 'Serialization failed', message: error.message });
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