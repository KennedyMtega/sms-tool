import { SMSParams } from './nextsms-api'

export function useNextsmsApi() {
  const sendSMS = async (params: SMSParams) => {
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send SMS')
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending SMS:', error)
      throw error
    }
  }

  return { sendSMS }
} 