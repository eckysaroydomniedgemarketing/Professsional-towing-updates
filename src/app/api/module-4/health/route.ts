import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerService } from '@/modules/module-4-agent-visibility/services/supabase-server.service';

export async function GET(request: NextRequest) {
  try {
    // Test Supabase connection
    const isConnected = await supabaseServerService.testConnection();
    
    // Get environment status
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    
    // Overall health status
    const isHealthy = isConnected && Object.values(envStatus).every(v => v);
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        supabase: {
          connected: isConnected,
          message: isConnected ? 'Database connection successful' : 'Database connection failed'
        },
        environment: {
          status: envStatus,
          message: Object.values(envStatus).every(v => v) 
            ? 'All environment variables configured' 
            : 'Missing environment variables'
        }
      }
    }, { 
      status: isHealthy ? 200 : 503 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        supabase: {
          connected: false,
          message: 'Health check error'
        }
      }
    }, { status: 503 });
  }
}