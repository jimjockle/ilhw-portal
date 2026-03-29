/**
 * Input validation utilities for the ILHW Business Portal.
 * All user inputs must be validated before storing in Supabase.
 */

export function validateUrl(url) {
  if (!url || url.trim() === "") return { valid: true, value: "" };
  const trimmed = url.trim();
  try {
    new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return { valid: true, value: trimmed };
  } catch {
    return { valid: false, error: "Please enter a valid URL (e.g., www.example.com)" };
  }
}

export function validatePhone(phone) {
  if (!phone || phone.trim() === "") return { valid: true, value: "" };
  const cleaned = phone.trim();
  // Allow common US phone formats
  if (!/^[+]?[(]?\d{1,4}[)]?[-\s./0-9]{6,20}$/.test(cleaned)) {
    return { valid: false, error: "Please enter a valid phone number" };
  }
  return { valid: true, value: cleaned };
}

export function validateText(text, { maxLength = 5000, fieldName = "Field" } = {}) {
  if (!text) return { valid: true, value: "" };
  const trimmed = text.trim();
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be under ${maxLength} characters` };
  }
  // Strip any HTML tags for safety
  const clean = trimmed.replace(/<[^>]*>/g, "");
  return { valid: true, value: clean };
}

export function validateKeyword(keyword) {
  if (!keyword || keyword.trim() === "") return { valid: false, error: "Keyword cannot be empty" };
  const trimmed = keyword.trim();
  if (trimmed.length > 50) {
    return { valid: false, error: "Keyword must be under 50 characters" };
  }
  if (/<[^>]*>/.test(trimmed)) {
    return { valid: false, error: "Keywords cannot contain HTML" };
  }
  return { valid: true, value: trimmed };
}

export function validateBusinessForm(form) {
  const errors = {};

  const name = validateText(form.name, { maxLength: 255, fieldName: "Business name" });
  if (!name.valid) errors.name = name.error;
  if (!form.name?.trim()) errors.name = "Business name is required";

  const address = validateText(form.address, { maxLength: 500, fieldName: "Address" });
  if (!address.valid) errors.address = address.error;

  const phone = validatePhone(form.phone);
  if (!phone.valid) errors.phone = phone.error;

  const website = validateUrl(form.website);
  if (!website.valid) errors.website = website.error;

  const hours = validateText(form.hours, { maxLength: 500, fieldName: "Hours" });
  if (!hours.valid) errors.hours = hours.error;

  const description = validateText(form.description, { maxLength: 5000, fieldName: "Description" });
  if (!description.valid) errors.description = description.error;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      name: name.value || form.name?.trim() || "",
      address: address.value,
      phone: phone.value,
      website: website.value,
      hours: hours.value,
      description: description.value,
      keywords: (form.keywords || []).map(k => k.trim().replace(/<[^>]*>/g, "")).filter(Boolean),
    },
  };
}
