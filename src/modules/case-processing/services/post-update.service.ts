import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function saveUpdateToHistory(
  caseId: string,
  content: string,
  addressId: string,
  sessionId: string
): Promise<boolean> {
  try {
    // Get the address details for the address_associated field
    const { data: addressData } = await supabase
      .from('case_addresses')
      .select('full_address')
      .eq('id', addressId)
      .single()

    const addressText = addressData?.full_address || 'Unknown Address'

    // Insert the update into case_update_history
    const { error } = await supabase
      .from('case_update_history')
      .insert({
        case_id: caseId,
        update_date: new Date().toISOString(),
        update_type: 'User Update',
        update_author: 'System (User)',
        update_content: content,
        address_associated: addressText,
        session_id: sessionId,
        is_visible: true,
        contains_exclusion_keyword: false
      })

    if (error) {
      console.error('Error saving update to history:', error)
      return false
    }

    console.log('Update saved successfully for case:', caseId)
    return true
  } catch (error) {
    console.error('Failed to save update:', error)
    return false
  }
}