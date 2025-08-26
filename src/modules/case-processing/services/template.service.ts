import { createClient } from '@supabase/supabase-js'
import { CaseAddress } from '../types/case.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Template {
  id: string
  template_text: string
  category?: string
  is_active: boolean
}

export interface LastUserUpdate {
  id: string
  update_date: string
  update_content: string
  address_associated?: string
  update_author: string
}

export async function fetchActiveTemplates(category: string): Promise<Template[]> {
  console.log(`Fetching templates for category: ${category}`)
  
  const { data, error } = await supabase
    .from('update_templates')
    .select('id, template_text, category, is_active')
    .eq('is_active', true)
    .ilike('category', category)  // Case-insensitive comparison
    .order('template_text', { ascending: true })

  if (error) {
    console.error('Error fetching templates:', error)
    throw error
  }

  console.log(`Found ${data?.length || 0} templates for category: ${category}`)

  // Convert bigint ID to string and ensure proper typing
  return (data || []).map(template => ({
    ...template,
    id: String(template.id)
  }))
}

export function mapAddressTypeToCategory(addressType: string | undefined): string {
  if (!addressType) {
    return 'No-Address-Generic'
  }

  const type = addressType.toLowerCase().trim()
  
  // Map address types to template categories
  if (type.includes('home')) {
    return 'HOME'
  } else if (type.includes('work')) {
    return 'WORK'
  } else if (type.includes('previous')) {
    return 'PREVIOUS'
  } else if (type.includes('dmv')) {
    return 'DMV'
  } else if (type.includes('additional')) {
    return 'ADDITIONAL'
  } else if (type.includes('3rd party')) {
    return 'THIRD_PARTY'
  } else if (type.includes('unknown')) {
    return 'GENERAL'
  } else {
    // Default for any other address types
    return 'GENERAL'
  }
}

export async function getLastUserUpdate(caseId: string, currentSessionId: string): Promise<LastUserUpdate | null> {
  const { data, error } = await supabase
    .from('case_update_history')
    .select('id, update_date, update_content, address_associated, update_author')
    .eq('case_id', caseId)
    .ilike('update_author', '%(User)%')
    .eq('session_id', currentSessionId)
    .order('update_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.log('No previous user update found:', error)
    return null
  }

  return data
}

export function isUpdateAllowed(lastUpdateDate: string | null): { allowed: boolean; daysUntilAllowed: number; message: string } {
  if (!lastUpdateDate) {
    // No previous update, allow posting
    return { 
      allowed: true, 
      daysUntilAllowed: 0, 
      message: 'No previous update found' 
    }
  }

  // Parse the last update date
  const lastUpdate = new Date(lastUpdateDate)
  const today = new Date()
  
  // Set time to start of day for accurate day calculation
  lastUpdate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  // Calculate days between (excluding today)
  const diffTime = today.getTime() - lastUpdate.getTime()
  const daysBetween = Math.floor(diffTime / (1000 * 60 * 60 * 24)) - 1 // Subtract 1 to exclude today
  
  console.log(`Last update: ${lastUpdateDate}, Days between (excluding today): ${daysBetween}`)
  
  // Need at least 2 days between (excluding today)
  const requiredDays = 2
  
  if (daysBetween >= requiredDays) {
    return { 
      allowed: true, 
      daysUntilAllowed: 0, 
      message: `Last update was ${daysBetween + 1} days ago` 
    }
  } else {
    const daysToWait = requiredDays - daysBetween
    return { 
      allowed: false, 
      daysUntilAllowed: daysToWait,
      message: `Update blocked: Last update was ${daysBetween + 1} days ago. Wait ${daysToWait} more day${daysToWait > 1 ? 's' : ''}.`
    }
  }
}

export function generateDraft(template: string, address: CaseAddress): string {
  if (!template || !address) {
    return ''
  }

  let draft = template

  // Replace placeholders with actual address data
  // Handle both {address} and {{address}} formats
  draft = draft.replace(/\{?\{address\}?\}/g, address.full_address || '')
  draft = draft.replace(/\{?\{city\}?\}/g, address.city || '')
  draft = draft.replace(/\{?\{state\}?\}/g, address.state || '')
  draft = draft.replace(/\{?\{zip\}?\}/g, address.zip_code || '')
  draft = draft.replace(/\{?\{street\}?\}/g, address.street_address || '')
  draft = draft.replace(/\{?\{type\}?\}/g, address.address_type || '')

  return draft
}