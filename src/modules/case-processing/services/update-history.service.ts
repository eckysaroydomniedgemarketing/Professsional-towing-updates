import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UpdatePostingRecord {
  case_id: string
  update_content: string
  address_associated?: string
  posting_mode: 'manual' | 'automatic'
  posting_status: 'success' | 'failed'
  session_id?: string
  error_message?: string
}

export async function saveUpdateHistory(record: UpdatePostingRecord): Promise<string | null> {
  try {
    console.log('[Update History] Saving update record:', {
      case_id: record.case_id,
      mode: record.posting_mode,
      status: record.posting_status
    })

    const { data, error } = await supabase
      .from('system_posted_updates_logs')
      .insert({
        case_id: record.case_id,
        update_content: record.update_content,
        address_associated: record.address_associated || null,
        posting_mode: record.posting_mode,
        posting_status: record.posting_status,
        session_id: record.session_id || null,
        error_message: record.error_message || null,
        posted_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Update History] Error saving record:', error)
      throw error
    }

    console.log('[Update History] Record saved successfully with ID:', data?.id)
    return data?.id || null

  } catch (error) {
    console.error('[Update History] Failed to save update history:', error)
    return null
  }
}