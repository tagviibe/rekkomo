export const normalizePhone = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return "";
  
  // Remove all non-digit characters
  let digits = trimmed.replace(/\D/g, "");
  
  // Remove country code if present (e.g., +91, 91)
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }
  
  // Remove leading + if any digits remain
  return digits;
};

export const isValidPhone = (input: string) => {
  const normalized = normalizePhone(input);
  // Indian mobile numbers are 10 digits and start with 6, 7, 8, or 9
  if (normalized.length !== 10) return false;
  const firstDigit = normalized[0];
  return firstDigit === "6" || firstDigit === "7" || firstDigit === "8" || firstDigit === "9";
};

export const formatPhoneWithCountryCode = (phone: string) => {
  const normalized = normalizePhone(phone);
  if (normalized.length === 10) {
    return `+91${normalized}`;
  }
  return phone.startsWith("+") ? phone : `+${phone}`;
};
