# NextSMS Integration Guide and Troubleshooting

This document provides comprehensive guidance for integrating and troubleshooting the NextSMS API in our SMS Marketing Tool.

## Table of Contents

1. [Authentication](#authentication)
2. [Common Errors](#common-errors)
3. [API Endpoints](#api-endpoints)
4. [Troubleshooting](#troubleshooting)
5. [Best Practices](#best-practices)

## Authentication

NextSMS uses Basic Authentication. The authentication token must be properly formatted as follows:

1. Username and password are combined into a string `username:password`
2. The resulting string is encoded using the RFC2045-MIME variant of Base64
3. The authorization method and a space, "Basic ", are put before the encoded string

### Example:
\`\`\`
Username: Aladdin
Password: open sesame
Base64 encoded string: QWxhZGRpbjpvcGVuIHNlc2FtZQ==
Authorization header: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
\`\`\`

### Common Authentication Errors

- **"Not Authorized" Error**: This typically occurs when the authentication header is improperly formatted or contains invalid credentials.
- **Missing "Basic " Prefix**: The authentication header must start with "Basic " followed by the Base64 encoded credentials.
- **Incorrect Base64 Encoding**: Ensure the username:password string is properly Base64 encoded.

## Common Errors

| Error | Description | Solution |
|-------|-------------|----------|
| Not Authorized | Authentication failed | Check credentials and ensure proper formatting with "Basic " prefix |
| REJECTED_NOT_ENOUGH_CREDITS | Account out of SMS credits | Top up your account |
| REJECTED_SENDER | Sender ID has been blacklisted | Use a different sender ID or contact support |
| REJECTED_DESTINATION | Destination number blacklisted | Verify the recipient number |
| REJECTED_INVALID_DESTINATION | Invalid phone number format | Ensure phone numbers use the E.164 format (e.g., 255712345678) |

## API Endpoints

### Balance Check
\`\`\`
GET https://messaging-service.co.tz/api/sms/v1/balance
\`\`\`

### Send SMS
\`\`\`
POST https://messaging-service.co.tz/api/sms/v1/text/single
\`\`\`

### Test Mode
\`\`\`
POST https://messaging-service.co.tz/api/sms/v1/test/text/single
\`\`\`

## Troubleshooting

### Authentication Issues

1. **Verify Credentials Format**:
   - Ensure the auth token is properly formatted with "Basic " prefix
   - Check that the Base64 encoding is correct
   - Verify that the username and password are valid

2. **API Request Headers**:
   - For balance requests, use:
     \`\`\`
     Authorization: Basic YOUR_BASE64_ENCODED_CREDENTIALS
     Accept: application/json
     \`\`\`
   - For sending SMS, use:
     \`\`\`
     Authorization: Basic YOUR_BASE64_ENCODED_CREDENTIALS
     Content-Type: application/json
     Accept: application/json
     \`\`\`

3. **Debugging Authentication**:
   - Log the first few characters of the auth header (for security)
   - Check the HTTP status code of the response
   - Parse and log the error message from the API response

### SMS Sending Issues

1. **Phone Number Formatting**:
   - Ensure phone numbers are in E.164 format (e.g., 255712345678)
   - Remove any spaces, dashes, or special characters
   - Add country code (e.g., 255 for Tanzania) if missing

2. **Sender ID Validation**:
   - Sender ID must be alphanumeric
   - Maximum length is 11 characters
   - Some networks may have additional restrictions

3. **Message Content**:
   - Check message length (standard SMS is 160 characters)
   - For longer messages, the system will split them into multiple parts

## Best Practices

1. **Error Handling**:
   - Implement robust error handling for all API calls
   - Provide clear error messages to users
   - Log detailed error information for debugging

2. **Credential Management**:
   - Store credentials securely
   - Use environment variables for sensitive information
   - Implement proper validation before saving credentials

3. **Testing**:
   - Use the test API endpoints for development
   - Test with various phone numbers and message lengths
   - Verify delivery reports for production messages

4. **Performance**:
   - Implement caching for balance checks
   - Use proper error handling to prevent cascading failures
   - Add retry logic for transient errors

## Implementation Notes

### Proper Authentication Header Format

\`\`\`javascript
// Correct way to format the auth header
const auth = credentials.nextsmsAuth.trim();
const authHeader = auth.startsWith("Basic ") ? auth : `Basic ${auth}`;
\`\`\`

### Phone Number Formatting

\`\`\`javascript
// Format phone number to E.164 format
let formattedPhone = phoneNumber.trim().replace(/\s+/g, "");
if (!formattedPhone.startsWith("+") && formattedPhone.length < 12) {
  if (!formattedPhone.startsWith("255")) {
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "255" + formattedPhone.substring(1);
    } else {
      formattedPhone = "255" + formattedPhone;
    }
  }
}
\`\`\`

### Sender ID Validation

\`\`\`javascript
// Ensure sender ID is valid
const validSenderId = senderId.substring(0, 11).replace(/[^a-zA-Z0-9]/g, "");
\`\`\`

### API Response Handling

\`\`\`javascript
// Proper API response handling
if (!response.ok) {
  const errorText = await response.text();
  let errorData;
  try {
    errorData = JSON.parse(errorText);
  } catch (e) {
    errorData = { error: errorText || "Unknown error" };
  }

  if (response.status === 401) {
    throw new Error("Authentication failed. Please check your API credentials.");
  }

  throw new Error(errorData.error || errorData.details || "API request failed");
}
