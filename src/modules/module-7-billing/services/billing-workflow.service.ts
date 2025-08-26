import { getPortalService } from '@/modules/module-1-rdn-portal/services/workflow-state.service';
import { navigateToCase } from '@/modules/module-1-rdn-portal/navigate-to-case';
import { extractCaseData } from '@/modules/data-extraction/extractCaseData';

export class BillingWorkflowService {
  async executeWorkflow(caseId: string) {
    const result = {
      success: false,
      data: null as any,
      error: null as string | null,
      steps: {
        login: false,
        navigation: false,
        extraction: false,
        storage: false
      }
    };

    let page: any = null;

    try {
      // Step 1: Start Module 1 workflow via API to handle login
      console.log('Starting billing workflow for case:', caseId);
      console.log('Step 1: Starting RDN Portal workflow...');
      
      const workflowResponse = await fetch('/api/module-1/start-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetCaseId: caseId  // Pass the case ID for direct navigation
        })
      });
      
      if (!workflowResponse.ok) {
        const errorData = await workflowResponse.json();
        throw new Error(errorData.error || 'Failed to start Module 1 workflow');
      }
      
      const workflowResult = await workflowResponse.json();
      console.log('Module 1 workflow started:', workflowResult.message);
      
      // Get the portal service instance that Module 1 created
      const portalService = getPortalService();
      if (!portalService) {
        throw new Error('Portal service not available after workflow initialization');
      }
      
      // Get the page from the portal service
      page = portalService.getPage();
      if (!page) {
        throw new Error('Failed to get browser page from portal service');
      }
      result.steps.login = true;
      result.steps.navigation = true; // Module 1 handles navigation when targetCaseId is provided

      // Step 2: Extract all case data (includes invoice data)
      console.log('Step 2: Extracting billing data...');
      const extractResult = await extractCaseData(caseId, page, false); // Fixed parameter order
      if (!extractResult.success) {
        throw new Error('Failed to extract case data');
      }
      result.steps.extraction = true;

      // Step 3: Data is already stored by extractCaseData
      console.log('Step 3: Data extraction and storage complete');
      result.steps.storage = true;

      // Close the browser
      if (page && page.context()) {
        await page.context().browser()?.close();
      }

      result.success = true;
      result.data = {
        caseId,
        message: 'Billing workflow completed successfully'
      };

      return result;

    } catch (error) {
      console.error('Billing workflow error:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Ensure browser is closed on error
      if (page && page.context()) {
        try {
          await page.context().browser()?.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      
      return result;
    }
  }
}