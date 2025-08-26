import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('invoice_data')
      .select('*')
      .eq('case_id', caseId)
      .order('invoice_number', { ascending: true })
      .order('service_date', { ascending: true });

    if (error) {
      console.error('Error fetching invoice data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoice data' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in invoice-data API:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}