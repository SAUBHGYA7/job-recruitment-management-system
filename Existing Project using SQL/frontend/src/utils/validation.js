/**
 * Client-side Form Validation Utilities for JRMS Database Records
 * Validates against Oracle data types, NOT NULL constraints, check conditions,
 * and format rules before sending requests to the backend.
 */

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[+]?[\d\s\-()]{7,15}$/;

/**
 * Validate a required non-empty string or value
 */
export function validateRequired(value, fieldLabel = 'This field') {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return 'This field is required.';
  }
  return null;
}

/**
 * Validate a numeric field with optional min, max, integer checks
 */
export function validateNumber(value, { min, max, allowNegative = false, label = 'Value', integerOnly = false } = {}) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return `${label} must be a valid number.`;
  }
  if (!allowNegative && num < 0) {
    return `${label} must be greater than or equal to 0.`;
  }
  if (min !== undefined && num < min) {
    return `${label} must be greater than or equal to ${min}.`;
  }
  if (max !== undefined && num > max) {
    return `${label} must be less than or equal to ${max}.`;
  }
  if (integerOnly && !Number.isInteger(num)) {
    return `${label} must be an integer.`;
  }
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(value, { required = false, label = 'Email' } = {}) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    if (required) return 'This field is required.';
    return null;
  }
  if (!emailRegex.test(String(value).trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

/**
 * Validate phone number format
 */
export function validatePhone(value, { required = false, label = 'Phone' } = {}) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    if (required) return 'This field is required.';
    return null;
  }
  const clean = String(value).trim();
  if (!phoneRegex.test(clean) || clean.replace(/\D/g, '').length < 7) {
    return 'Please enter a valid phone number (7-15 digits).';
  }
  return null;
}

/**
 * Validate date field
 */
export function validateDate(value, { required = false, minDate, maxDate, label = 'Date' } = {}) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    if (required) return 'This field is required.';
    return null;
  }
  const parsed = Date.parse(value);
  if (isNaN(parsed)) {
    return `${label} must be a valid date.`;
  }
  if (minDate && new Date(value) < new Date(minDate)) {
    return `${label} cannot be before ${minDate}.`;
  }
  if (maxDate && new Date(value) > new Date(maxDate)) {
    return `${label} cannot be after ${maxDate}.`;
  }
  return null;
}

/**
 * Validate text length
 */
export function validateLength(value, { max, min, label = 'Field' } = {}) {
  if (!value) return null;
  const str = String(value);
  if (max !== undefined && str.length > max) {
    return `${label} cannot exceed ${max} characters.`;
  }
  if (min !== undefined && str.length < min) {
    return `${label} must be at least ${min} characters.`;
  }
  return null;
}
