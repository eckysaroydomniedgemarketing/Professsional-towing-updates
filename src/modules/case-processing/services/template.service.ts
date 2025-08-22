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

export async function fetchActiveTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('update_templates')
    .select('id, template_text, category, is_active')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('template_text', { ascending: true })

  if (error) {
    console.error('Error fetching templates:', error)
    throw error
  }

  // Convert bigint ID to string and ensure proper typing
  return (data || []).map(template => ({
    ...template,
    id: String(template.id)
  }))
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