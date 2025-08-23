import { NextRequest, NextResponse } from 'next/server';
import { OnHoldWorkflowService } from '@/modules/module-5-on-hold/services/on-hold-workflow.service';
import { RDNPortalService } from '@/modules/module-1-rdn-portal/services/rdn-portal-service';
import type { Page } from 'playwright';

// Store page and service instances (shared across all API routes)
export let page: Page | null = null;
export let portalService: RDNPortalService | null = null;
export let workflowService: OnHoldWorkflowService | null = null;

export async function POST(request: NextRequest) {
  try {
    const { mode = 'manual' } = await request.json();

    // Initialize workflow service if not already done
    if (!workflowService) {
      workflowService = new OnHoldWorkflowService();
    }

    // Check if workflow is already running
    const currentState = workflowService.getState();
    if (currentState.status === 'processing' || currentState.status === 'paused') {
      return NextResponse.json(
        { error: 'Workflow is already running' },
        { status: 400 }
      );
    }

    // Check if we need to authenticate first
    if (!page) {
      // Get credentials from environment variables
      const credentials = {
        username: process.env.RDN_USERNAME || '',
        password: process.env.RDN_PASSWORD || '',
        securityCode: process.env.RDN_SECURITY_CODE || ''
      };

      if (!credentials.username || !credentials.password || !credentials.securityCode) {
        throw new Error('Missing RDN credentials in environment variables');
      }

      // Create and initialize the portal service
      console.log('[MODULE-5] Creating RDNPortalService');
      portalService = new RDNPortalService(credentials);
      
      console.log('[MODULE-5] Initializing portal service');
      await portalService.initialize();
      
      // Add small delay to ensure initialization is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('[MODULE-5] Navigating to login page');
      // Navigate to login page first
      const loginResult = await portalService.navigateToLogin();
      if (!loginResult.success) {
        throw new Error(`Failed to navigate to login: ${loginResult.error}`);
      }
      
      // Authenticate using the service
      const authResult = await portalService.authenticate();
      
      if (!authResult.success) {
        throw new Error(`Failed to authenticate with RDN portal: ${authResult.error}`);
      }

      // Get the authenticated page from the service's browser manager
      console.log('[MODULE-5] Getting authenticated page from browser manager');
      const browserManager = (portalService as any).browserManager;
      page = browserManager.getPage();
      
      if (!page) {
        console.error('[MODULE-5] Failed to get page from browser manager', {
          hasBrowserManager: !!browserManager,
          hasPortalService: !!portalService
        });
        throw new Error('Failed to get authenticated page from portal service');
      }
      
      console.log('[MODULE-5] Successfully got authenticated page');
    }

    // Set the page in workflow service
    workflowService.setPage(page);

    // Start workflow in background
    workflowService.startWorkflow(mode).catch(error => {
      console.error('[MODULE-5] Workflow error:', error);
    });

    // Get current state
    const finalState = workflowService.getState();
    
    return NextResponse.json({
      success: true,
      message: 'On Hold workflow started',
      mode,
      state: finalState
    });
  } catch (error) {
    console.error('[MODULE-5] Error starting workflow:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Cleanup on process exit
process.on('beforeExit', async () => {
  if (portalService) {
    await portalService.cleanup();
  }
});