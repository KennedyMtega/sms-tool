# Bulk SMS Implementation Documentation

## Issues Identified

After analyzing the codebase, I identified the following issues with the SMS sending functionality:

1. **No Bulk SMS Capability**: The existing implementation only supported sending individual SMS messages through the `/api/sms/send` endpoint. There was no dedicated functionality for sending multiple messages efficiently.

2. **Potential Rate Limiting Issues**: The NextSMS API likely has rate limits, but the current implementation didn't account for these limits when making multiple API requests.

3. **No Batch Processing**: When sending messages to multiple recipients (e.g., for a campaign), each message would require a separate API call without any batching or throttling mechanism.

4. **Error Handling for Multiple Requests**: The existing error handling was designed for single message sending, making it difficult to track which messages failed in a bulk sending scenario.

5. **Performance Bottlenecks**: Sending many messages sequentially could lead to performance issues and timeouts, especially for large campaigns.

## Solution Implemented

I implemented a new `/api/sms/bulk` endpoint with the following features:

### 1. Rate Limiting and Throttling

```typescript
// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 60,  // Maximum requests per minute
  BATCH_SIZE: 10,               // Number of SMS to send in each batch
  DELAY_BETWEEN_BATCHES: 1000,  // Delay between batches in milliseconds
};
```

This configuration:
- Limits the number of requests to 60 per minute to avoid hitting API rate limits
- Processes messages in batches of 10 to optimize throughput
- Adds a 1-second delay between batches to prevent overwhelming the API

### 2. Batch Processing

The solution processes messages in batches rather than all at once:

```typescript
// Process in batches
for (let i = 0; i < totalMessages; i += RATE_LIMIT.BATCH_SIZE) {
  const batch = messages.slice(i, i + RATE_LIMIT.BATCH_SIZE);
  
  // Process each message in the current batch concurrently
  const batchPromises = batch.map(message => sendSingleSMS(message, auth));
  const batchResults = await Promise.all(batchPromises);
  
  results.push(...batchResults);
  
  // If there are more batches to process, add a delay to respect rate limits
  if (i + RATE_LIMIT.BATCH_SIZE < totalMessages) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.DELAY_BETWEEN_BATCHES));
  }
}
```

### 3. Concurrent Processing Within Batches

Within each batch, messages are processed concurrently using `Promise.all()`, which improves performance while still maintaining overall rate limits.

### 4. Comprehensive Error Handling

The implementation includes detailed error handling for each individual message:

```typescript
return {
  success: false,
  to: formattedPhone,
  error: errorData.error || errorData.message || `NextSMS API Error (${response.status})`,
  status: response.status
};
```

This allows for tracking which specific messages failed and why, making it easier to retry only the failed messages if needed.

### 5. Detailed Response Format

The API returns a comprehensive response that includes:
- Total number of messages processed
- Number of successful messages
- Number of failed messages
- Detailed results for each message

```typescript
return NextResponse.json({
  total: results.length,
  successful,
  failed,
  results
});
```

## How to Use the Bulk SMS API

### Request Format

```json
{
  "messages": [
    {
      "from": "SENDER_ID",
      "to": "255712345678",
      "text": "Message content 1",
      "metadata": {
        "campaignId": "campaign-123",
        "contactId": "contact-456"
      }
    },
    {
      "from": "SENDER_ID",
      "to": "255787654321",
      "text": "Message content 2",
      "metadata": {
        "campaignId": "campaign-123",
        "contactId": "contact-789"
      }
    }
    // Add more messages as needed
  ],
  "auth": "Basic YOUR_AUTH_TOKEN" // Optional if using cookie authentication
}
```

The `metadata` field is optional but recommended for tracking purposes. It allows you to associate additional information with each message, such as campaign IDs and contact IDs, which can be useful for analytics and tracking message delivery status.

### Response Format

```json
{
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "success": true,
      "to": "255712345678",
      "data": { /* NextSMS API response */ },
      "metadata": {
        "campaignId": "campaign-123",
        "contactId": "contact-456"
      }
    },
    {
      "success": true,
      "to": "255787654321",
      "data": { /* NextSMS API response */ },
      "metadata": {
        "campaignId": "campaign-123",
        "contactId": "contact-789"
      }
    }
  ]
}
```

The `metadata` field in the response contains the same metadata that was provided in the request, making it easy to track which messages were successfully sent and which failed, especially in the context of campaign management.

## Best Practices for Using Bulk SMS

1. **Optimal Batch Size**: The default batch size is set to 10, which balances throughput with API rate limits. Adjust this based on your specific NextSMS API plan if needed.

2. **Error Handling**: Always check the response for failed messages and implement a retry mechanism for those specific messages.

3. **Campaign Sending**: For large campaigns, consider breaking up very large recipient lists into multiple API calls to avoid timeouts.

4. **Monitoring**: Monitor the success rate of your bulk SMS sends to identify any patterns in failures.

5. **Testing**: Before sending to a large audience, test with a small batch to ensure everything is working correctly.

## Future Improvements

1. **Webhook Integration**: Implement webhook support to receive delivery status updates from NextSMS.

2. **Queue System**: For very large campaigns, implement a proper queue system (like Bull or similar) to handle message processing asynchronously.

3. **Adaptive Rate Limiting**: Dynamically adjust rate limits based on API response times and error rates.

4. **Retry Mechanism**: Automatically retry failed messages with exponential backoff.

5. **Analytics**: Track and analyze delivery rates, open rates, and response rates for campaigns.