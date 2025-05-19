import type { Contact } from './contact-service'

export type PersonalizationVariables = {
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  [key: string]: string | undefined
}

export function replacePersonalizationVariables(
  template: string,
  variables: PersonalizationVariables
): string {
  let result = template

  // Replace each variable in the template
  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      const regex = new RegExp(`{{${key}}}`, 'gi')
      result = result.replace(regex, value)
    }
  })

  return result
}

export function getPersonalizationVariables(contact: Contact): PersonalizationVariables {
  return {
    name: contact.name,
    firstName: contact.firstName || undefined,
    lastName: contact.lastName || undefined,
    phone: contact.phone,
  }
}

export function extractPersonalizationVariables(template: string): string[] {
  const regex = /{{([^}]+)}}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1])
  }

  return variables
} 