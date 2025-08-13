/**
 * UpdatesManager module - Coordinates the updates workflow
 * Enhanced with comprehensive error handling and clean logging
 */

const CaseExtractor = require('./CaseExtractor');
const UpdateExtractor = require('./UpdateExtractor');
const CaseAnalyzer = require('./CaseAnalyzer');
const UpdateAnalyzer = require('./UpdateAnalyzer');
const UpdateDrafter = require('./UpdateDrafter');
const UpdatePoster = require('./UpdatePoster');
const ReportGenerator = require('./ReportGenerator');
const ExtractorUtils = require('./ExtractorUtils');
const SummaryTabExtractor = require('./SummaryTabExtractor');
const { logger } = require('../../utils/Logger');

// Import manager modules
const NavigationManager = require('./managers/NavigationManager');
const UserInputManager = require('./managers/UserInputManager');
const ReportManager = require('./managers/ReportManager');
const CaseProcessor = require('./managers/CaseProcessor');
const PriorityClientSearchManager = require('./managers/PriorityClientSearchManager');
const PriorityClientAutoHandler = require('./handlers/priorityClientAutoHandler');
const SessionManager = require('./managers/SessionManager');

/**
 * UpdatesManager class to coordinate the updates workflow
 * Enhanced with comprehensive error handling and logging for troubleshooting
 */
class UpdatesManager {
  /**
   * @param {import('../../browser')} browser - Browser instance
   * @param {import('../../database')} database - Database instance for client exclusions
   */
  constructor(browser, database = null) {
    try {
      // Validate required dependencies
      if (!browser) {
        throw new Error('Browser instance is required for UpdatesManager');
      }
      
      if (!browser.page) {
        throw new Error('Browser page instance is required for UpdatesManager');
      }
      
      this.browser = browser;
      this.page = browser.page;
      this.database = database;
      this.currentCaseTab = null;
      this.caseSummaryFile = null;
      this.updateSummaryFile = null;
      this.processedCases = 0;
      this.targetCaseCount = 0;
      this.batchMode = false;
      this.autoPostMode = false;
      this.cleanMode = false;
      this.testMode = false; // Flag to prevent actual update posting for testing
      this.generateHtmlReports = false; // Flag to control HTML report generation
      this.processedCaseIds = []; // Track case IDs processed in current session
      this.sessionStartTime = new Date(); // Track when session started for filtering
      this.priorityClientMode = false; // Flag to indicate priority client processing
      this.currentSessionId = null; // Track current session ID
      
      // Initialize sub-modules with shared database instance
      this.caseExtractor = new CaseExtractor(this);
      this.updateExtractor = new UpdateExtractor(this);
      this.caseAnalyzer = new CaseAnalyzer(database?.manager?.db || database?.db || null);
      this.updateAnalyzer = new UpdateAnalyzer();
      this.updateDrafter = new UpdateDrafter(this);
      this.updatePoster = new UpdatePoster(this);
      this.reportGenerator = new ReportGenerator(database); // Pass shared database instance
      this.summaryTabExtractor = new SummaryTabExtractor(this);
      
      // Initialize manager modules
      this.navigationManager = new NavigationManager(this);
      this.userInputManager = new UserInputManager(this);
      this.reportManager = new ReportManager(this);
      this.caseProcessor = new CaseProcessor(this);
      this.sessionManager = new SessionManager(database);
      
      // Set up graceful shutdown handlers
      this.setupShutdownHandlers();
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set options from the API or other controlling scripts
   * @param {Object} options - The options for processing
   */
  setOptions(options) {
    this.options = options || {};
    this.setTestMode(this.options.testMode === true);
    this.setHtmlReportGeneration(this.options.generateHtmlReports === true);
    this.setAutoPostMode(this.options.autoPost === true);
    this.setCleanMode(this.options.cleanMode !== false); // Default to true
    
    // Set batch mode if specified
    if (this.options.batchMode !== undefined) {
      this.setBatchMode(this.options.batchMode);
    }
    
    // Set target case count if specified
    if (this.options.caseCount !== undefined) {
      this.targetCaseCount = this.options.caseCount;
    }
  }

  /**
   * Set up graceful shutdown handlers for partial report generation
   */
  setupShutdownHandlers() {
    // Handle Ctrl+C gracefully
    process.on('SIGINT', async () => {
      console.log('\n⚠️ Process interrupted - generating partial reports...');
      try {
        await this.reportManager.generatePartialReports();
        console.log('✅ Partial reports generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate partial reports:', error.message);
      }
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('\n❌ Fatal error occurred:', error.message);
      try {
        await this.reportManager.generatePartialReports();
        console.log('✅ Emergency reports generated');
      } catch (reportError) {
        console.error('❌ Failed to generate emergency reports:', reportError.message);
      }
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('\n❌ Unhandled promise rejection:', reason);
      try {
        await this.reportManager.generatePartialReports();
        console.log('✅ Emergency reports generated');
      } catch (reportError) {
        console.error('❌ Failed to generate emergency reports:', reportError.message);
      }
      process.exit(1);
    });
  }

  /**
   * Main method to manage the updates workflow based on user's selected mode
   * @returns {Promise<boolean>} - True if processing successful
   */
  async processAllCases() {
    try {
      // Validate browser and page are available
      if (!this.browser || !this.page) {
        throw new Error('Browser instance not available. Cannot proceed with case processing.');
      }
      
      // Ask user for processing mode (Task 5.1)
      const { mode, caseId, url, client } = await this.userInputManager.askForProcessingMode();
      
      // Create a new session for this processing run
      if (this.database && this.sessionManager) {
        const sessionOptions = {
          mode: mode,
          userId: process.env.USER || 'system',
          userName: process.env.USER || 'System User',
          autoMode: this.autoPostMode,
          metadata: {
            startMode: mode,
            specificCaseId: caseId,
            specificUrl: url,
            clientFilter: client
          }
        };
        
        this.currentSessionId = this.sessionManager.createSession(sessionOptions);
      }
      
      // Ask the user how many cases to process automatically (Task 5.2)
      if (mode === 'multiple') {
        const caseCount = await this.userInputManager.askForCaseCount();
        if (caseCount > 0) {
          this.batchMode = true;
          this.targetCaseCount = caseCount;
          this.processedCases = 0;
          
          // Update session with batch information
          if (this.sessionManager && this.currentSessionId) {
            this.sessionManager.updateSession(this.currentSessionId, {
              totalCases: 0,
              batchSize: caseCount
            });
          }
        } else {
          this.batchMode = false;
        }
        
        // Ask if user wants to generate HTML reports
        const enableHtmlReports = await this.userInputManager.askForHtmlReports();
        this.setHtmlReportGeneration(enableHtmlReports);
      }
      
      // If mode is specific, process a specific case
      if (mode === 'specific' && url) {
        return await this.navigationManager.processSpecificCase(url, caseId);
      }

      // If mode is priority, process priority client cases
      if (mode === 'priority' && client) {
        return await this.processPriorityClientCases(client);
      }
      
      // For standard workflow, navigate to the three-day updates page first
      const navigated = await this.navigationManager.navigateToUpdatesPage(true);
      if (!navigated) {
        throw new Error('Navigation to updates page failed or page did not load correctly');
      }
      
      // Configure page display options
      try {
        await this.batchProcessor.selectResultsPerPage();
      } catch (error) {
        // Not critical, continue processing
      }
      
      // Sort cases by update date FIRST (before pagination to avoid reset)
      try {
        await this.navigationManager.sortLastUpdateColumn();
      } catch (error) {
        // Not critical, continue processing
      }
      
      // Handle pagination AFTER sorting (so user's page selection is preserved)
      try {
        const { navigateToPage, pageNumber } = await this.userInputManager.askForPagination();
        if (navigateToPage && pageNumber) {
          const pageNavigationResult = await this.navigationManager.navigateToSpecificPage(pageNumber);
          if (pageNavigationResult) {
            this.batchProcessor.setCurrentPage(pageNumber);
          }
        }
      } catch (error) {
        // Continue with current page
      }
      
      // Process all cases
      const result = await this.batchProcessor.processAllCases();
      
      // Generate final reports for the current session after processing completes
      if (result && this.database && this.currentSessionId) {
        try {
          console.log('\n🎯 Processing completed. Generating session reports...');
          
          const FinalReportGenerator = require('./FinalReportGenerator');
          const finalReportGenerator = new FinalReportGenerator(this.database);
          
          const sessionInfo = {
            mode: this.batchMode ? 'batch' : 'standard',
            autoMode: this.autoPostMode,
            processedCases: result.processedCases || 0,
            updatesPosted: result.updatesPosted || 0,
            casesRequiringNoUpdate: result.casesRequiringNoUpdate || 0,
            sessionCompleted: true
          };
          
          // Generate reports for current session only
          await finalReportGenerator.generateAllReports(sessionInfo, { 
            sessionId: this.currentSessionId 
          });
          
          console.log(`✅ Session reports generated for session: ${this.currentSessionId}`);
        } catch (reportError) {
          console.error('❌ Failed to generate final reports:', reportError.message);
        }
      }
      
      return result;
      
    } catch (error) {
      if (this.cleanMode) {
        logger.simple.complete(0, 0);
        console.log('❌ Processing failed: ' + error.message);
      } else {
        console.error('❌ Updates workflow failed:', {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'),
          timestamp: new Date().toISOString()
        });
      }
      // End session with error status
      if (this.sessionManager && this.currentSessionId) {
        this.sessionManager.endSession(this.currentSessionId, 'error');
      }
      return false;
    } finally {
      // Ensure session is ended if not already done
      if (this.sessionManager && this.currentSessionId) {
        const session = this.sessionManager.getActiveSession();
        if (session && session.status === 'active') {
          this.sessionManager.endSession(this.currentSessionId, 'completed');
        }
      }
    }
  }

  /**
   * Process a single case
   * @param {string} caseId - ID of the case
   * @param {import('playwright').ElementHandle} [caseLink=null] - Element handle for the case link (optional)
   * @returns {Promise<{updatePosted: boolean, stopProcessing?: boolean} | null>} - Processing result
   */
  async processCase(caseId, caseLink = null) {
    if (this.cleanMode) {
      logger.simple.processing(caseId);
    }
    
    try {
      // Validate inputs
      if (!caseId || typeof caseId !== 'string') {
        throw new Error('Invalid case ID provided');
      }
      
      if (!this.caseProcessor) {
        throw new Error('Case processor not initialized');
      }
      
      const result = await this.caseProcessor.processCase(caseId, caseLink);
      return result;
      
    } catch (error) {
      if (this.cleanMode) {
        console.log(`❌ Case ${caseId}: Processing failed`);
      } else {
        console.error(`❌ Failed to process case ${caseId}:`, {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        updatePosted: false,
        stopProcessing: false,
        error: error.message
      };
    }
  }
  
  /**
   * Set clean mode for simplified console output
   * @param {boolean} enabled - Whether to enable clean mode
   */
  setCleanMode(enabled) {
    this.cleanMode = enabled;
    
    // Set clean mode on logger
    logger.setCleanMode(enabled);
    
    // Pass clean mode to all managers
    if (this.userInputManager && this.userInputManager.setCleanMode) {
      this.userInputManager.setCleanMode(enabled);
    }
    if (this.caseProcessor && this.caseProcessor.setCleanMode) {
      this.caseProcessor.setCleanMode(enabled);
    }
    if (this.batchProcessor && this.batchProcessor.setCleanMode) {
      this.batchProcessor.setCleanMode(enabled);
    }
  }
  
  /**
   * Enable or disable HTML report generation
   * @param {boolean} enabled - Whether to enable HTML report generation
   */
  setHtmlReportGeneration(enabled) {
    this.generateHtmlReports = enabled;
    console.log(`[HTML REPORTS] HTML report generation ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Enable or disable test mode (prevents actual update posting)
   * @param {boolean} enabled - Whether to enable test mode
   */
  setTestMode(enabled) {
    this.testMode = enabled;
    console.log(`[TEST MODE] Test mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    if (enabled) {
      console.log('[TEST MODE] 🔒 Updates will be prepared but NOT actually posted');
    }
  }
  
  /**
   * Set batch mode
   * @param {boolean} enabled - Whether batch mode is enabled
   */
  setBatchMode(enabled) {
    this.batchMode = enabled;
  }

  /**
   * Set target case count
   * @param {number} count - Number of cases to process
   */
  setTargetCaseCount(count) {
    this.targetCaseCount = count;
  }

  /**
   * Set auto-post mode
   * @param {boolean} enabled - Whether to auto-post updates
   */
  setAutoPostMode(enabled) {
    this.autoPostMode = enabled;
  }

  /**
   * Process a specific case by URL or case ID
   * @param {string} caseInput - Case URL or case ID
   * @returns {Promise<{updatePosted: boolean, stopProcessing?: boolean} | null>} - Processing result
   */
  async processSpecificCase(caseInput) {
    try {
      // If it's a URL, extract the case ID
      let caseId = caseInput;
      let url = caseInput;
      
      if (!caseInput.startsWith('http')) {
        // It's a case ID, construct the URL
        const config = require('../../../config/app-config');
        url = `${config.urls.base}/alpha_rdn/module/default/case2/?tab=6&case_id=${caseInput}`;
        caseId = caseInput;
      } else {
        // Extract case ID from URL
        const caseIdMatch = caseInput.match(/case_id=(\d+)/) || caseInput.match(/case\/(\d+)/);
        if (caseIdMatch) {
          caseId = caseIdMatch[1];
        }
      }
      
      // Use navigation manager to process the specific case
      if (this.navigationManager && this.navigationManager.processSpecificCase) {
        return await this.navigationManager.processSpecificCase(url, caseId);
      } else {
        // Fallback: Navigate and process
        await this.browser.navigate(url);
        return await this.processCase(caseId);
      }
    } catch (error) {
      console.error(`❌ Failed to process specific case ${caseInput}:`, error);
      return {
        updatePosted: false,
        stopProcessing: false,
        error: error.message
      };
    }
  }

  /**
   * Process Priority Client cases with Auto Mode Support
   * @param {string} clientName - Selected priority client name
   * @returns {Promise<Object>} - Processing result
   */
  async processPriorityClientCases(clientName) {
    try {
      // Check if this is a manual search (no pre-selected client)
      if (clientName === 'MANUAL_SEARCH') {
        console.log(`\n===============================================`);
        console.log(`PRIORITY CLIENT SEARCH - MANUAL MODE`);
        console.log(`===============================================`);
        
        // Ask user if they want to use auto mode
        const useAutoMode = await this.userInputManager.askYesNo('\nDo you want to use AUTO MODE for processing? (yes/no): ');

        // Create PriorityClientSearchManager for this specific search
        const searchManager = new PriorityClientSearchManager(this);

        // Use a more descriptive placeholder for manual search
        const searchResult = await searchManager.searchPriorityClientCasesManual('Priority Client Search', { 
          dateRange: 30, // 30 days default range for manual search
          autoMode: useAutoMode 
        });
        
        return this.handlePriorityClientSearchResult(searchResult, searchManager, searchResult.client || 'Priority Client Search');
      }
      
      // Original flow for specific client (kept for backward compatibility if needed)
      console.log(`\n===============================================`);
      console.log(`PROCESSING PRIORITY CLIENT: ${clientName}`);
      console.log(`===============================================`);

      // Ask user if they want to use auto mode
      const useAutoMode = await this.userInputManager.askYesNo('\nDo you want to use AUTO MODE for processing? (yes/no): ');

      // Create PriorityClientSearchManager for this specific search
      const searchManager = new PriorityClientSearchManager(this);

      // Perform the priority client search with auto mode flag
      const searchResult = await searchManager.searchPriorityClientCases(clientName, { 
        dateRange: 15, // 15 days default range
        autoMode: useAutoMode 
      });

      return this.handlePriorityClientSearchResult(searchResult, searchManager, clientName);

    } catch (error) {
      console.error('Error processing priority client cases:', error.message);
      
      // Generate reports even if there was an error
      try {
        const FinalReportGenerator = require('./FinalReportGenerator');
        const finalReportGenerator = new FinalReportGenerator(this.database);
        
        console.log('\n⚠️ Generating emergency reports for priority client processing...');
        const sessionInfo = {
          mode: 'priority',
          autoMode: false,
          processedCases: 0,
          updatesPosted: 0,
          casesRequiringNoUpdate: 0,
          clientName: clientName || 'Unknown',
          sessionTerminated: true,
          errorTerminated: true
        };
        
        await finalReportGenerator.generateAllReports(sessionInfo, { sessionId: this.currentSessionId });
        console.log('✅ Emergency reports generated successfully');
      } catch (reportError) {
        console.error('❌ Failed to generate emergency reports:', reportError.message);
      }
      
      return {
        processed: 0,
        successful: 0,
        total: 0,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Handle priority client search results - extracted for reuse
   * @param {Object} searchResult - Search result from PriorityClientSearchManager
   * @param {Object} searchManager - PriorityClientSearchManager instance
   * @param {string} clientName - Client name for display
   * @returns {Promise<Object>} - Processing result
   */
  async handlePriorityClientSearchResult(searchResult, searchManager, clientName) {
    if (!searchResult || !searchResult.success) {
      const errorMessage = searchResult?.error || 'Unknown error occurred during search';
      console.log(`Error searching for priority client: ${errorMessage}`);
      return {
        processed: 0,
        success: false,
        message: errorMessage
      };
    }

    // Handle auto mode if enabled
    if (searchResult.autoMode && searchResult.cases.length > 0) {
      const autoHandler = new PriorityClientAutoHandler(searchManager);
      const autoResult = await autoHandler.handleAutoMode(searchResult);
      autoHandler.close();

      // If processing was done, generate reports and return the results
      if (autoResult.processed) {
        const processedCount = autoResult.processingResults.processed.length;
        const successCount = autoResult.processingResults.successful || processedCount; // Assume all successful if not specified
        
        // Generate final reports for auto mode
        try {
          const FinalReportGenerator = require('./FinalReportGenerator');
          const finalReportGenerator = new FinalReportGenerator(this.database);
          
          console.log('\n🎯 Generating comprehensive final reports for auto mode processing...');
          const sessionInfo = {
            mode: 'priority',
            autoMode: true,
            processedCases: processedCount,
            updatesPosted: successCount,
            casesRequiringNoUpdate: processedCount - successCount,
            clientName: clientName,
            sessionTerminated: false
          };
          
          await finalReportGenerator.generateAllReports(sessionInfo, { sessionId: this.currentSessionId });
        } catch (error) {
          console.error('❌ Failed to generate final reports:', error.message);
        }
        
        return {
          processed: processedCount,
          success: true,
          message: `Auto mode completed: ${processedCount} cases processed`,
          details: autoResult.processingResults
        };
      }
      
      // If only viewing, continue with manual processing
      if (autoResult.viewOnly) {
        console.log('\nContinuing with manual processing...');
      }
    }

    const qualifiedCases = searchResult.cases;
    if (!qualifiedCases || qualifiedCases.length === 0) {
      console.log(`No qualifying cases found for: ${clientName}`);
      
      // Generate reports even when no cases found
      try {
        const FinalReportGenerator = require('./FinalReportGenerator');
        const finalReportGenerator = new FinalReportGenerator(this.database);
        
        console.log('\n🎯 Generating reports (no qualifying cases found)...');
        const sessionInfo = {
          mode: 'priority',
          autoMode: searchResult.autoMode || false,
          processedCases: 0,
          updatesPosted: 0,
          casesRequiringNoUpdate: 0,
          clientName: clientName,
          sessionTerminated: false,
          noCasesFound: true
        };
        
        await finalReportGenerator.generateAllReports(sessionInfo, { sessionId: this.currentSessionId });
      } catch (error) {
        console.error('❌ Failed to generate reports:', error.message);
      }
      
      return {
        processed: 0,
        success: true,
        message: `No qualifying cases found for ${clientName}`
      };
    }

    console.log(`Found ${qualifiedCases.length} qualifying cases for ${clientName}`);

    let processedCount = 0;
    let successCount = 0;

    // Enable batch mode for priority client processing to skip manual confirmations
    const originalBatchMode = this.batchMode;
    const originalPriorityMode = this.priorityClientMode;
    this.batchMode = true;
    this.priorityClientMode = true;
    console.log('📍 Priority client mode: Batch processing enabled to skip manual confirmations');

    // Set up CSV report files using session timestamp if not already done
    if (!this.caseSummaryFile || !this.updateSummaryFile) {
      console.log('📋 Setting up CSV report files for priority client processing...');
      await this.reportManager.setupReportFiles();
      console.log('✅ CSV report files initialized successfully');
    }

    // Process each qualified case using existing business rules
    for (const caseItem of qualifiedCases) {
      const caseUrl = caseItem.href?.startsWith('http') 
        ? caseItem.href 
        : `https://app.recoverydatabase.net${caseItem.href}`;

      console.log(`\nProcessing case ${processedCount + 1}/${qualifiedCases.length}: ${caseItem.caseId}`);
      console.log(`URL: ${caseUrl}`);
      console.log(`Last update: ${caseItem.lastUpdate} ${caseItem.lastUpdateTime || ''}`);

      let result = { stopProcessing: false };

      try {
        // Get the case link element from search results
        const caseLink = await searchManager.getCaseLinkElement(caseItem.caseId);
        
        if (caseLink) {
          // Use the standard CaseProcessor for consistent handling
          const processingResult = await this.caseProcessor.processCase(caseItem.caseId, caseLink);
          
          processedCount++;
          if (processingResult && processingResult.updatePosted) {
            successCount++;
          }
          
          // Check if user wants to stop
          if (processingResult && processingResult.stopProcessing) {
            console.log('User requested to stop processing');
            break;
          }
          
          continue;
        }
        
        // If we couldn't get the case link, use direct navigation
        this.currentCaseTab = await this.browser.openNewPage(caseUrl);
        
        if (this.currentCaseTab) {
          const result = await this.processCase(caseItem.caseId);
          
          processedCount++;
          if (result && result.updatePosted) {
            successCount++;
          }
          
          // Clean up the case tab after processing
          if (this.currentCaseTab && !this.currentCaseTab.isClosed()) {
            await this.currentCaseTab.close();
            this.currentCaseTab = null;
          }
          
          // Check if user wants to stop
          if (result && result.stopProcessing) {
            console.log('User requested to stop processing');
            break;
          }
        }

      } catch (caseError) {
        console.error(`Error processing case ${caseItem.caseId}:`, caseError.message);
        processedCount++;
      }
    }

    // Restore original batch mode and priority mode
    this.batchMode = originalBatchMode;
    this.priorityClientMode = originalPriorityMode;
    console.log('📍 Priority client mode: Batch processing restored to original state');

    // Generate final reports for priority client processing
    try {
      const FinalReportGenerator = require('./FinalReportGenerator');
      const finalReportGenerator = new FinalReportGenerator(this.database);
      
      console.log('\n🎯 Generating comprehensive final reports for priority client processing...');
      const sessionInfo = {
        mode: 'priority',
        autoMode: searchResult.autoMode || false,
        processedCases: processedCount,
        updatesPosted: successCount,
        casesRequiringNoUpdate: processedCount - successCount,
        clientName: clientName,
        sessionTerminated: false
      };
      
      const reportResults = await finalReportGenerator.generateAllReports(sessionInfo);
      
      if (reportResults.error) {
        console.error('❌ Error generating final reports:', reportResults.error);
      }
    } catch (error) {
      console.error('❌ Failed to generate final reports:', error.message);
      // Don't throw - continue with normal flow even if final reports fail
    }

    // Ask user what to do next
    const nextAction = await this.askForNextAction('priority');
    
    return {
      processed: processedCount,
      successful: successCount,
      total: qualifiedCases.length,
      nextAction: nextAction,
      success: true
    };
  }

  /**
   * Ask user for next action after processing priority client cases
   * @param {string} currentMode - Current processing mode
   * @returns {Promise<string>} - User's choice for next action
   */
  async askForNextAction(currentMode) {
    try {
      console.log(`\n===============================================`);
      console.log(`NEXT ACTION SELECTION`);
      console.log(`===============================================`);
      console.log(`What would you like to do next?`);
      
      if (currentMode === 'priority') {
        console.log(`1) Search another priority client`);
        console.log(`2) Return to standard workflow`);
        console.log(`3) Exit the automation`);
      }

      return await this.userInputManager.askForNextActionChoice(currentMode);
    } catch (error) {
      console.error('Error asking for next action:', error.message);
      return 'exit';
    }
  }
}

module.exports = UpdatesManager;
