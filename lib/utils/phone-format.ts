export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let formatted = phone.replace(/[^0-9]/g, "")
  
  // Handle Tanzanian numbers
  if (formatted.length >= 9) {
    // Remove leading zeros
    while (formatted.startsWith("0")) {
      formatted = formatted.substring(1)
    }
    
    // Add country code if missing
    if (!formatted.startsWith("255")) {
      formatted = "255" + formatted
    }
  }
  
  return formatted
} 