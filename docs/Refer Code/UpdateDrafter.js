/**
 * UpdateDrafter module - Handles drafting updates with address selection and templates
 */

const config = require('../../../config/app-config');
const Database = require('../../database');

/**
 * UpdateDrafter class for creating update drafts
 */
class UpdateDrafter {
  /**
   * @param {import('./UpdatesManager')} manager - Reference to the UpdatesManager
   */
  constructor(manager) {
    this.manager = manager;
    this.database = new Database();
    this.templates = [];
  }
  
  /**
   * Check if two addresses match (with fuzzy matching for slight variations)
   * @param {string} address1 - First address
   * @param {string} address2 - Second address
   * @returns {boolean} - True if addresses match
   */
  addressesMatch(address1, address2) {
    if (!address1 || !address2) return false;
    
    // Normalize addresses for comparison
    const normalize = (addr) => addr
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[,\.]/g, '')
      .trim();
    
    const norm1 = normalize(address1);
    const norm2 = normalize(address2);
    
    // Exact match after normalization
    if (norm1 === norm2) return true;
    
    // Check if one contains the other (for cases where one has more details)
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      // But make sure it's not a very short match
      const shorterLength = Math.min(norm1.length, norm2.length);
      if (shorterLength > 10) return true; // Only consider it a match if the shorter address is substantial
    }
    
    return false;
  }

  /**
   * Helper function to check if an address category is a work-related type
   * @param {string} category - The address category to check
   * @returns {boolean} - True if this is a work-related category
   */
  isBorrowerWorkCategory(category) {
    if (!category) return false;
    
    const categoryLower = category.toLowerCase();
    
    // Check 1: Standard pattern - look for both 'borrower' and 'work' together
    const standardPattern = categoryLower.includes('borrower') && categoryLower.includes('work');
    
    // Check exact matches of common borrower-work formats
    const exactMatches = [
      'borrower-work',
      'borrower - work',
      'borrower work',
      'borrower/work',
      'borrower_work'
    ].includes(categoryLower);
    
    // Handle special case format like 'Borrower - Work'
    const dashedFormat = /borrower\s*[-]\s*work/i.test(category);
    
    // Exact match for 'Borrower - Work' with proper capitalization and spacing
    const exactCapitalizedMatch = (category === 'Borrower - Work');
    
    // Check 2: NEW - Check for ANY category containing 'work'
    const hasWorkKeyword = categoryLower.includes('work');
    
    // Handle business address indicators
    const businessIndicators = categoryLower.includes('business') || 
                              categoryLower.includes('employer') || 
                              categoryLower.includes('employment') || 
                              categoryLower.includes('workplace');
    
    // Combine all checks: borrower-work patterns OR any work keyword OR business indicators
    const isWorkCategory = standardPattern || exactMatches || dashedFormat || exactCapitalizedMatch || hasWorkKeyword || businessIndicators;
    
    console.log(`Category '${category}' is work-related? ${isWorkCategory}`);
    console.log(`  - Borrower-work pattern match: ${standardPattern || exactMatches || dashedFormat || exactCapitalizedMatch}`);
    console.log(`  - Has 'work' keyword: ${hasWorkKeyword}`);
    console.log(`  - Business indicators: ${businessIndicators}`);
    
    return isWorkCategory;
  }

  /**
   * Load the templates from the database with comprehensive error handling - Priority 5
   * @returns {Promise<boolean>} - True if templates loaded successfully
   */
  async loadTemplates() {
    try {
      console.log('Loading update templates from database...');
      
      // Enhanced null/undefined checks - Priority 5
      if (!this.database) {
        throw new Error('Database instance is null or undefined');
      }
      
      // Initialize database if not already done
      if (!this.database.isInitialized) {
        const success = await this.database.initialize();
        if (!success) {
          throw new Error('Failed to initialize database');
        }
      }
      
      // Enhanced validation of database templates service
      if (!this.database.templates) {
        throw new Error('Database templates service is not available');
      }
      
      if (typeof this.database.templates.getAllActiveTemplates !== 'function') {
        throw new Error('Database templates service does not have getAllActiveTemplates method');
      }
      
      // Get all active templates from database
      const templateRecords = this.database.templates.getAllActiveTemplates();
      
      // Enhanced validation of template records - Priority 5
      if (!templateRecords) {
        throw new Error('No template records returned from database');
      }
      
      if (!Array.isArray(templateRecords)) {
        throw new Error(`Expected array of template records, got: ${typeof templateRecords}`);
      }
      
      if (templateRecords.length === 0) {
        throw new Error('No active templates found in database. Please add templates to the update_templates table.');
      }
      
      // Extract and validate template text with null safety
      this.templates = templateRecords
        .filter(record => {
          if (!record) {
            console.warn('Skipping null/undefined template record');
            return false;
          }
          if (!record.template_text) {
            console.warn('Skipping template record with no template_text');
            return false;
          }
          if (typeof record.template_text !== 'string') {
            console.warn(`Skipping template record with invalid template_text type: ${typeof record.template_text}`);
            return false;
          }
          if (record.template_text.trim().length === 0) {
            console.warn('Skipping template record with empty template_text');
            return false;
          }
          return true;
        })
        .map(record => record.template_text.trim());
      
      // Final validation
      if (this.templates.length === 0) {
        throw new Error('No valid templates found after filtering. Please check template data in the database.');
      }
      
      console.log(`Successfully loaded ${this.templates.length} update templates from database`);
      return true;
    } catch (error) {
      console.error('Failed to load templates from database:', error);
      
      // No fallback to default templates - database templates are required
      console.error('Database templates are required for the system to function.');
      console.error('Please ensure the update_templates table contains active templates.');
      return false;
    }
  }

  /**
   * Method to check if an address is valid and usable
   * @param {string} address - The address to check
   * @returns {boolean} - True if the address is valid and usable
   */
  isValidAddress(address) {
    // Address validity is now determined by the isValid flag from the address data
    // This method is kept for backward compatibility but should only be used as a basic sanity check
    return address && address.trim() !== '' && 
           address !== 'Unknown' && 
           address !== 'No address found' && 
           address !== 'Error extracting data';
  }

  
  /**
   * Select a random template from the database with enhanced error handling - Priority 5
   * @returns {string} - The selected template
   */
  selectRandomTemplate() {
    try {
      // Enhanced null/undefined checks - Priority 5
      if (!this.database) {
        throw new Error('Database instance is null - cannot select template without database connection');
      }
      
      // Try to get random template directly from database
      if (this.database.isInitialized) {
        try {
          if (!this.database.templates) {
            throw new Error('Database templates service is not available');
          }
          
          if (typeof this.database.templates.getRandomTemplate !== 'function') {
            throw new Error('Database templates service does not have getRandomTemplate method');
          }
          
          const randomTemplate = this.database.templates.getRandomTemplate();
          if (randomTemplate && randomTemplate.template_text) {
            const templateText = randomTemplate.template_text.trim();
            if (templateText.length > 0) {
              console.log(`Selected template ID ${randomTemplate.id} from database`);
              return templateText;
            } else {
              console.warn(`Template ID ${randomTemplate.id} has empty text content`);
            }
          }
        } catch (dbError) {
          console.warn('Error accessing database template:', dbError.message);
        }
      }
      
      // No fallback - templates must come from database
      throw new Error('Unable to select template from database');
    } catch (error) {
      console.error('Error selecting random template:', error);
      throw new Error('Critical error in template selection - no templates available');
    }
  }
  
  /**
   * Select template from loaded templates array with validation - Priority 5
   * @returns {string} - The selected template
   */
  selectFallbackTemplate() {
    try {
      // Enhanced validation of templates array
      if (!this.templates) {
        throw new Error('Templates array is null or undefined - database templates must be loaded first');
      }
      
      if (!Array.isArray(this.templates)) {
        throw new Error(`Templates is not an array: ${typeof this.templates}`);
      }
      
      if (this.templates.length === 0) {
        throw new Error('No templates available for selection - database must contain active templates');
      }
      
      // Validate templates contain valid strings
      const validTemplates = this.templates.filter(template => {
        return template && typeof template === 'string' && template.trim().length > 0;
      });
      
      if (validTemplates.length === 0) {
        throw new Error('No valid templates found after filtering - check template data quality in database');
      }
      
      const randomIndex = Math.floor(Math.random() * validTemplates.length);
      const selectedTemplate = validTemplates[randomIndex];
      
      console.log(`Selected template index ${randomIndex} out of ${validTemplates.length} valid templates`);
      return selectedTemplate;
    } catch (error) {
      console.error('Error in fallback template selection:', error);
      throw error; // Re-throw the error instead of using emergency template
    }
  }
  

  /**
   * Determine which addresses were used in recent updates
   * @param {Array<Object>} updates - Array of update data objects
   * @param {number} recentCount - Number of recent updates to consider
   * @returns {Object} - Object with last update address and count of address usage
   */
  getRecentUpdateAddresses(updates, recentCount = 3) {
    if (!updates || updates.length === 0) {
      return { lastAddress: null, addressUsage: {} };
    }
    
    // Sort updates by date (most recent first)
    const sortedUpdates = [...updates].sort((a, b) => {
      // Parse dates - handle common formats
      let dateA, dateB;
      
      try {
        // Try different date formats
        if (a.dateTime && a.dateTime.includes('/')) {
          // MM/DD/YYYY format
          const parts = a.dateTime.split(' ')[0].split('/');
          dateA = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else if (a.dateTime) {
          dateA = new Date(a.dateTime);
        } else {
          dateA = new Date(0);
        }
      } catch (e) {
        dateA = new Date(0); // Default to old date if parsing fails
      }
      
      try {
        if (b.dateTime && b.dateTime.includes('/')) {
          // MM/DD/YYYY format
          const parts = b.dateTime.split(' ')[0].split('/');
          dateB = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else if (b.dateTime) {
          dateB = new Date(b.dateTime);
        } else {
          dateB = new Date(0);
        }
      } catch (e) {
        dateB = new Date(0); // Default to old date if parsing fails
      }
      
      return dateB - dateA; // Most recent first
    });
    
    // Track address usage in recent updates
    const addressUsage = {};
    let lastAddress = null;
    let foundFirst = false;
    
    // Filter for agent updates only
    const agentUpdates = sortedUpdates.filter(update => {
      const updateType = update.updateType || update.type || '';
      const isAgentUpdate = updateType.toLowerCase().includes('agent');
      const hasLastUpdatedByAgent = update.lastUpdatedBy && 
                               (update.lastUpdatedBy.toLowerCase().includes('agent') ||
                                update.lastUpdatedBy === 'RDN Admin (Lender)' ||
                                update.lastUpdatedBy.toLowerCase().includes('accent') ||
                                update.lastUpdatedBy.toLowerCase().includes('elantra'));
      
      return isAgentUpdate || hasLastUpdatedByAgent;
    });
    
    // Count recent updates by address
    for (let i = 0; i < Math.min(recentCount, agentUpdates.length); i++) {
      const update = agentUpdates[i];
      
      // Check if update has a valid address field
      if (update.forAddress && 
          update.forAddress !== 'General' && 
          update.forAddress !== 'Address Related (Unspecified)') {
        
        // Store the first (most recent) address found
        if (!foundFirst) {
          lastAddress = update.forAddress;
          foundFirst = true;
        }
        
        // Count address usage
        if (!addressUsage[update.forAddress]) {
          addressUsage[update.forAddress] = 1;
        } else {
          addressUsage[update.forAddress]++;
        }
      }
    }
    
    return { lastAddress, addressUsage };
  }

  /**
   * Evaluate address viability by comparing it to details in the updates
   * @param {string} address - The address to evaluate
   * @param {Array<Object>} updates - Array of update data objects
   * @returns {number} - Score indicating viability (higher is better)
   */
  evaluateAddressViability(address, updates) {
    if (!address || !updates || updates.length === 0) {
      console.log(`    No address or updates to evaluate viability`);
      return 0;
    }
    
    let score = 1; // Base score for any valid address
    console.log(`    Starting with base score: 1`);
    const addressLower = address.toLowerCase();
    
    // Keywords that indicate address is being actively worked
    const positiveIndicators = [
      'agent visited', 'agent ran', 'agent checked', 'agent will continue',
      'recovery efforts', 'continuing all efforts', 'will continue', 
      'follow up', 'revisit', 're-ran', 'appears occupied'
    ];
    
    // Keywords that suggest the address might not be viable
    const negativeIndicators = [
      'no answer', 'not present', 'vacant', 'abandoned', 'vacant lot',
      'moved out', 'evicted', 'foreclosed', 'demolished', 'incorrect address',
      'false address', 'wrong address', 'bad address', 'invalid address',
      'out of coverage', 'no such address', 'address not found', 'address denied',
      'could not locate address'
    ];
    
    console.log(`    Checking ${updates.length} updates for address viability...`);
    // Loop through updates to find mentions of this address
    for (const update of updates) {
      // Check if update is related to this address
      const isRelated = update.forAddress && update.forAddress.toLowerCase().includes(addressLower);
      
      if (isRelated && update.details) {
        console.log(`      Found update related to this address: "${update.details.substring(0, 30)}..."`);
        let indicatorFound = false;
        
        // Check for positive indicators
        for (const indicator of positiveIndicators) {
          if (update.details.toLowerCase().includes(indicator)) {
            score += 0.5;
            console.log(`        Positive indicator "${indicator}" found: +0.5`);
            indicatorFound = true;
            break; // Only count once per update
          }
        }
        
        // Check for negative indicators
        for (const indicator of negativeIndicators) {
          if (update.details.toLowerCase().includes(indicator)) {
            score -= 1.0;
            console.log(`        Negative indicator "${indicator}" found: -1.0`);
            indicatorFound = true;
            break; // Only count once per update
          }
        }
        
        if (!indicatorFound) {
          console.log(`        No specific indicators found in this update`);
        }
      }
    }
    
    console.log(`    Final viability score for address: ${score}`);
    return score;
  }
  
  /**
   * Enhanced address validation with improved fallback logic
   * @param {Array<Object>} addressesData - Array of address data objects
   * @returns {Object} - Object with valid and eligible addresses
   */
  validateAndCategorizeAddresses(addressesData) {
    console.log('🔍 ENHANCED ADDRESS VALIDATION START');
    
    if (!addressesData || addressesData.length === 0) {
      return {
        validAddresses: [],
        eligibleAddresses: [],
        unknownValidityAddresses: [],
        invalidAddresses: [],
        stats: { total: 0, valid: 0, invalid: 0, unknown: 0, eligible: 0 }
      };
    }
    
    const validAddresses = [];
    const invalidAddresses = [];
    const unknownValidityAddresses = [];
    
    // Categorize addresses by validity
    addressesData.forEach((addr, index) => {
      console.log(`  Address ${index + 1}: "${addr.address}"`);
      console.log(`    Category: ${addr.category}`);
      console.log(`    Validity: ${addr.isValid} (type: ${typeof addr.isValid})`);
      
      // Improved validity checking
      if (addr.isValid === true) {
        validAddresses.push(addr);
        console.log(`    ✅ CLASSIFIED: Valid`);
      } else if (addr.isValid === false) {
        invalidAddresses.push(addr);
        console.log(`    ❌ CLASSIFIED: Invalid`);
      } else {
        // Handle null, undefined, or other unknown validity states
        unknownValidityAddresses.push(addr);
        console.log(`    ❓ CLASSIFIED: Unknown validity - will evaluate for usability`);
      }
    });
    
    // Filter out work-related addresses from valid addresses
    const eligibleAddresses = validAddresses.filter(addr => {
      const isBorrowerWork = this.isBorrowerWorkCategory(addr.category);
      if (isBorrowerWork) {
        console.log(`    🚫 EXCLUDED: Valid address "${addr.address}" excluded due to work-related category`);
      } else {
        console.log(`    ✅ ELIGIBLE: Valid address "${addr.address}" is eligible for updates`);
      }
      return !isBorrowerWork;
    });
    
    const stats = {
      total: addressesData.length,
      valid: validAddresses.length,
      invalid: invalidAddresses.length,
      unknown: unknownValidityAddresses.length,
      eligible: eligibleAddresses.length
    };
    
    console.log('📊 ADDRESS VALIDATION SUMMARY:');
    console.log(`    Total addresses: ${stats.total}`);
    console.log(`    Valid addresses: ${stats.valid}`);
    console.log(`    Invalid addresses: ${stats.invalid}`);
    console.log(`    Unknown validity: ${stats.unknown}`);
    console.log(`    Eligible for updates: ${stats.eligible}`);
    
    return {
      validAddresses,
      eligibleAddresses,
      unknownValidityAddresses,
      invalidAddresses,
      stats
    };
  }
  
  /**
   * Enhanced fallback address selection with better logic
   * @param {Array<Object>} unknownValidityAddresses - Addresses with unknown validity
   * @returns {string|null} - Selected fallback address or null
   */
  selectFallbackAddress(unknownValidityAddresses) {
    console.log('🔄 ENHANCED FALLBACK ADDRESS SELECTION');
    
    if (!unknownValidityAddresses || unknownValidityAddresses.length === 0) {
      console.log('    No unknown validity addresses available for fallback');
      return null;
    }
    
    console.log(`    Evaluating ${unknownValidityAddresses.length} addresses with unknown validity`);
    
    // Filter out work-related addresses from unknown validity addresses
    const eligibleUnknownAddresses = unknownValidityAddresses.filter(addr => {
      const isBorrowerWork = this.isBorrowerWorkCategory(addr.category);
      if (isBorrowerWork) {
        console.log(`    🚫 EXCLUDED: Unknown validity address "${addr.address}" excluded due to work-related category`);
      } else {
        console.log(`    ✅ FALLBACK CANDIDATE: "${addr.address}" (${addr.category})`);
      }
      return !isBorrowerWork;
    });
    
    if (eligibleUnknownAddresses.length === 0) {
      console.log('    No eligible unknown validity addresses after filtering');
      return null;
    }
    
    // Enhanced selection logic for unknown validity addresses
    // Prefer home addresses over other types
    const homeAddresses = eligibleUnknownAddresses.filter(addr => 
      addr.category && addr.category.toLowerCase().includes('home')
    );
    
    if (homeAddresses.length > 0) {
      console.log(`    ✅ SELECTED: Home address as fallback: "${homeAddresses[0].address}"`);
      return homeAddresses[0].address;
    }
    
    // If no home addresses, use first eligible address
    console.log(`    ✅ SELECTED: First eligible unknown validity address: "${eligibleUnknownAddresses[0].address}"`);
    return eligibleUnknownAddresses[0].address;
  }
  
  /**
   * Improved address quality assessment
   * @param {string} address - Address to assess
   * @returns {number} - Quality score (0-10, higher is better)
   */
  assessAddressQuality(address) {
    if (!address || typeof address !== 'string') return 0;
    
    let score = 5; // Base score
    const addressLower = address.toLowerCase();
    
    // Positive indicators
    if (address.match(/\d+\s+\w+\s+(st|street|ave|avenue|rd|road|ln|lane|blvd|boulevard|dr|drive|ct|court|pl|place)/i)) {
      score += 2; // Has proper street format
    }
    
    if (address.match(/,\s*[A-Z]{2}\s+\d{5}/)) {
      score += 2; // Has state and ZIP code
    }
    
    if (address.match(/\d{5}-\d{4}/)) {
      score += 1; // Has ZIP+4
    }
    
    // Negative indicators
    if (addressLower.includes('unknown') || addressLower.includes('error') || addressLower.includes('not found')) {
      score -= 5;
    }
    
    if (address.length < 10) {
      score -= 2; // Too short to be a complete address
    }
    
    if (address.length > 200) {
      score -= 1; // Unusually long, might contain extra data
    }
    
    return Math.max(0, Math.min(10, score));
  }
  
  /**
   * Select the best address for the new update (Enhanced)
   * @param {Array<Object>} addressesData - Array of address data objects
   * @param {Array<Object>} updates - Array of update data objects
   * @returns {string} - The selected address
   */
  selectAddress(addressesData, updates) {
    console.log(`============= ENHANCED ADDRESS SELECTION START =============`);
    console.log(`Selecting best address from ${addressesData ? addressesData.length : 0} available addresses`);
    
    // If no addresses available, return a generic response
    if (!addressesData || addressesData.length === 0) {
      console.log('❌ No addresses available, using generic fallback');
      console.log(`============= ADDRESS SELECTION END: the property =============`);
      return 'the property';
    }
    
    // Enhanced address validation and categorization
    const addressValidation = this.validateAndCategorizeAddresses(addressesData);
    
    // If we have eligible valid addresses, use them
    if (addressValidation.eligibleAddresses.length > 0) {
      console.log(`✅ Found ${addressValidation.eligibleAddresses.length} eligible valid addresses`);
      return this.selectFromEligibleAddresses(addressValidation.eligibleAddresses, updates);
    }
    
    // No eligible valid addresses - try enhanced fallback logic
    console.log('⚠️  No eligible valid addresses found - initiating enhanced fallback');
    
    // Try addresses with unknown validity using enhanced selection
    const fallbackAddress = this.selectFallbackAddress(addressValidation.unknownValidityAddresses);
    if (fallbackAddress) {
      console.log(`✅ FALLBACK SUCCESS: Selected address with unknown validity`);
      console.log(`============= ADDRESS SELECTION END: ${fallbackAddress} =============`);
      return fallbackAddress;
    }
    
    // Last resort: analyze all addresses by quality and select the best one
    console.log('🔄 LAST RESORT: Analyzing all addresses by quality');
    const addressQualityScores = addressesData.map(addr => ({
      address: addr.address,
      category: addr.category,
      isValid: addr.isValid,
      qualityScore: this.assessAddressQuality(addr.address),
      isBorrowerWork: this.isBorrowerWorkCategory(addr.category)
    }));
    
    // Sort by quality score (highest first) and filter out borrower-work
    const qualitySortedAddresses = addressQualityScores
      .filter(addr => !addr.isBorrowerWork)
      .sort((a, b) => b.qualityScore - a.qualityScore);
    
    console.log('📊 Address Quality Analysis:');
    qualitySortedAddresses.forEach((addr, index) => {
      console.log(`  ${index + 1}. Score: ${addr.qualityScore}/10 | "${addr.address.substring(0, 50)}..."`);
    });
    
    if (qualitySortedAddresses.length > 0) {
      const selectedAddress = qualitySortedAddresses[0].address;
      console.log(`✅ QUALITY-BASED SELECTION: Highest quality address selected`);
      console.log(`============= ADDRESS SELECTION END: ${selectedAddress} =============`);
      return selectedAddress;
    }
    
    // Absolute fallback
    console.log('❌ All enhanced fallback methods failed, using generic address');
    console.log('💡 RECOMMENDATION: Review CaseExtractor.js address validity detection logic');
    console.log(`============= ADDRESS SELECTION END: the property =============`);
    return 'the property';
  }
  
  /**
   * Select from eligible valid addresses using enhanced logic
   * @param {Array<Object>} eligibleAddresses - Array of eligible address objects
   * @param {Array<Object>} updates - Array of update data objects
   * @returns {string} - Selected address
   */
  selectFromEligibleAddresses(eligibleAddresses, updates) {
    console.log('🎯 SELECTING FROM ELIGIBLE ADDRESSES');
    
    // If only one eligible address, use it (Task 5.9 requirement)
    if (eligibleAddresses.length === 1) {
      console.log('✅ Single eligible address found - using it (Task 5.9 requirement)');
      const chosenAddress = eligibleAddresses[0].address || 'the property';
      return chosenAddress;
    }
    
    // Multiple eligible addresses - use enhanced selection logic
    console.log(`📝 Multiple eligible addresses (${eligibleAddresses.length}) - applying enhanced selection logic`);
    
    // Enhanced address selection with quality scoring
    const addressesWithScores = eligibleAddresses.map(addr => {
      const qualityScore = this.assessAddressQuality(addr.address);
      const viabilityScore = this.evaluateAddressViability(addr.address, updates);
      const combinedScore = qualityScore + viabilityScore;
      
      return {
        ...addr,
        qualityScore,
        viabilityScore,
        combinedScore
      };
    });
    
    console.log('📊 Address Scoring Results:');
    addressesWithScores.forEach((addr, index) => {
      console.log(`  ${index + 1}. Quality: ${addr.qualityScore}/10, Viability: ${addr.viabilityScore}, Combined: ${addr.combinedScore}`);
      console.log(`      "${addr.address.substring(0, 50)}..." (${addr.category})`);
    });
    
    // Get recent update address usage to avoid repetition
    const { lastAddress, addressUsage } = this.getRecentUpdateAddresses(updates, 5);
    console.log(`🕐 Last update address: ${lastAddress || 'None found'}`);
    console.log(`📈 Recent address usage: ${JSON.stringify(addressUsage)}`);
    
    // Sort by combined score (highest first)
    const sortedAddresses = addressesWithScores.sort((a, b) => b.combinedScore - a.combinedScore);
    
    // Per Task 5.9: Try to select a different address than the last used one
    if (lastAddress) {
      const addressesExcludingLast = sortedAddresses.filter(addr => 
        !this.addressesMatch(addr.address, lastAddress)
      );
      
      if (addressesExcludingLast.length > 0) {
        const selected = addressesExcludingLast[0];
        console.log(`✅ SELECTED: Different address than last used (Score: ${selected.combinedScore})`);
        console.log(`    "${selected.address}"`);
        return selected.address;
      } else {
        console.log('⚠️  All eligible addresses were recently used, selecting highest scoring one');
      }
    }
    
    // Use the highest scoring address
    const bestAddress = sortedAddresses[0];
    console.log(`✅ SELECTED: Highest scoring address (Score: ${bestAddress.combinedScore})`);
    console.log(`    "${bestAddress.address}"`);
    return bestAddress.address;
  }

  /**
   * Enhanced address validation before update draft creation
   * @param {Array<Object>} addressesData - Array of address data objects
   * @returns {Object} - Validation result with recommendations
   */
  validateAddressesForUpdate(addressesData) {
    const validation = {
      isValid: false,
      hasUsableAddresses: false,
      recommendations: [],
      addressCount: addressesData ? addressesData.length : 0,
      validCount: 0,
      eligibleCount: 0
    };
    
    if (!addressesData || addressesData.length === 0) {
      validation.recommendations.push('No addresses found - check CaseExtractor address detection');
      return validation;
    }
    
    const addressValidation = this.validateAndCategorizeAddresses(addressesData);
    validation.validCount = addressValidation.stats.valid;
    validation.eligibleCount = addressValidation.stats.eligible;
    
    if (addressValidation.stats.eligible > 0) {
      validation.isValid = true;
      validation.hasUsableAddresses = true;
      validation.recommendations.push(`Found ${addressValidation.stats.eligible} eligible addresses for updates`);
    } else if (addressValidation.stats.unknown > 0) {
      validation.hasUsableAddresses = true;
      validation.recommendations.push(`No valid addresses, but ${addressValidation.stats.unknown} addresses with unknown validity can be used as fallback`);
    } else {
      validation.recommendations.push('No usable addresses found - all addresses are either invalid or borrower-work category');
      validation.recommendations.push('Consider reviewing address validity detection in CaseExtractor.js');
    }
    
    if (addressValidation.stats.unknown > addressValidation.stats.valid) {
      validation.recommendations.push('Most addresses have unknown validity - address validity detection may need improvement');
    }
    
    return validation;
  }
  
  /**
   * Create an update draft for the case with enhanced address handling (Task 5.9)
   * @param {string} caseId - ID of the case
   * @param {Array<Object>} addressesData - Array of address data objects
   * @param {Array<Object>} updates - Array of update data objects
   * @returns {Promise<Object>} - Update draft info
   */
  async createUpdateDraft(caseId, addressesData, updates) {
    try {
      console.log(`\n==== ENHANCED UPDATE DRAFT CREATION START (Task 5.9) ====`);
      
      // Enhanced null/undefined checks at start - Priority 5
      if (!caseId) {
        throw new Error('Case ID is required but was null, undefined, or empty');
      }
      
      if (typeof caseId !== 'string') {
        throw new Error(`Case ID must be a string, received: ${typeof caseId}`);
      }
      
      if (caseId.trim().length === 0) {
        throw new Error('Case ID cannot be empty or contain only whitespace');
      }
      
      console.log(`Creating update draft for case ID: ${caseId}`);
      console.log(`Total addresses: ${addressesData ? addressesData.length : 0}`);
      console.log(`Total updates: ${updates ? updates.length : 0}`);
      
      // Enhanced address validation with null safety
      let addressValidation;
      try {
        addressValidation = this.validateAddressesForUpdate(addressesData);
      } catch (validationError) {
        console.error('Error during address validation:', validationError.message);
        addressValidation = {
          isValid: false,
          hasUsableAddresses: false,
          recommendations: ['Address validation failed'],
          addressCount: 0,
          validCount: 0,
          eligibleCount: 0
        };
      }
      
      console.log('📋 ADDRESS VALIDATION RESULTS:');
      console.log(`    Total addresses: ${addressValidation.addressCount}`);
      console.log(`    Valid addresses: ${addressValidation.validCount}`);
      console.log(`    Eligible addresses: ${addressValidation.eligibleCount}`);
      console.log(`    Has usable addresses: ${addressValidation.hasUsableAddresses ? '✅ Yes' : '❌ No'}`);
      
      if (addressValidation.recommendations && Array.isArray(addressValidation.recommendations)) {
        addressValidation.recommendations.forEach(rec => {
          console.log(`    💡 ${rec}`);
        });
      }
      
      // 1. Enhanced database and template initialization - Priority 5
      try {
        if (!this.database) {
          throw new Error('Database instance is null or undefined');
        }
        
        if (!this.database.isInitialized) {
          console.log('Initializing database for template operations...');
          const success = await this.database.initialize();
          if (!success) {
            throw new Error('Failed to initialize database');
          }
        }
        
        // Enhanced template loading validation
        if (!this.templates || !Array.isArray(this.templates) || this.templates.length === 0) {
          console.log('Loading update templates from database...');
          const templatesLoaded = await this.loadTemplates();
          if (!templatesLoaded) {
            console.warn('Failed to load templates from database, but continuing with fallbacks');
            // Don't throw error here, as we have fallback templates
          }
        }
        
        // Final validation that we have templates
        if (!this.templates || !Array.isArray(this.templates) || this.templates.length === 0) {
          throw new Error('No templates available after loading attempts - database must contain active templates');
        }
      } catch (initError) {
        console.error('Error during database/template initialization:', initError.message);
        throw new Error('Cannot proceed without database templates: ' + initError.message);
      }
      
      // 2. Enhanced address selection with comprehensive validation - Priority 5
      console.log(`🎯 Selecting appropriate address using enhanced logic...`);
      let selectedAddress;
      
      try {
        selectedAddress = this.selectAddress(addressesData, updates);
        
        // Enhanced validation of selected address
        if (!selectedAddress) {
          console.warn('Selected address is null or undefined, using fallback');
          selectedAddress = 'the property';
        }
        
        if (typeof selectedAddress !== 'string') {
          console.warn(`Selected address is not a string: ${typeof selectedAddress}, using fallback`);
          selectedAddress = 'the property';
        }
        
        if (selectedAddress.trim().length === 0) {
          console.warn('Selected address is empty, using fallback');
          selectedAddress = 'the property';
        }
        
        console.log(`✅ Final selected address: "${selectedAddress}"`);
        
        // Additional validation for selected address
        if (selectedAddress === 'the property' || selectedAddress === 'Error') {
          console.log('⚠️  Selected address is generic/error - this may indicate address detection issues');
        } else {
          try {
            const qualityScore = this.assessAddressQuality(selectedAddress);
            console.log(`📊 Selected address quality score: ${qualityScore}/10`);
          } catch (qualityError) {
            console.warn('Error assessing address quality:', qualityError.message);
          }
        }
      } catch (selectionError) {
        console.error('Error during address selection:', selectionError.message);
        selectedAddress = 'the property';
        console.log(`Using fallback address: "${selectedAddress}"`);
      }
      
      // 3. Enhanced template selection with validation - Priority 5
      console.log(`🎲 Selecting a random template from the database...`);
      let template;
      
      try {
        template = this.selectRandomTemplate();
        
        // Validate selected template
        if (!template) {
          throw new Error('Selected template is null or undefined');
        }
        
        if (typeof template !== 'string') {
          throw new Error(`Selected template is not a string: ${typeof template}`);
        }
        
        if (template.trim().length === 0) {
          throw new Error('Selected template is empty');
        }
        
        console.log(`✅ Selected template: "${template.substring(0, 80)}..."`);
      } catch (templateError) {
        console.error('Error during template selection:', templateError.message);
        throw new Error('Cannot select template: ' + templateError.message);
      }
      
      // 4. Enhanced template processing with comprehensive validation - Priority 5
      console.log(`🔧 Processing template placeholders with enhanced formatting...`);
      
      let cleanedAddress;
      let updateDraft;
      
      try {
        // Enhanced address cleaning with better formatting preservation
        cleanedAddress = this.cleanAddressForTemplate(selectedAddress);
        console.log(`✅ Cleaned address: "${cleanedAddress}"`);
        
        // Enhanced template processing
        updateDraft = this.processTemplate(template, cleanedAddress);
        
        // Final validation of update draft
        if (!updateDraft || typeof updateDraft !== 'string' || updateDraft.trim().length === 0) {
          console.warn('Generated update draft is invalid, creating emergency draft');
          updateDraft = `Agent-Update for address ${cleanedAddress}. Agent continuing recovery efforts.`;
        }
        
        console.log(`✅ Generated update draft: "${updateDraft.substring(0, 100)}..."`);
      } catch (processingError) {
        console.error('Error during template processing:', processingError.message);
        cleanedAddress = selectedAddress || 'the property';
        updateDraft = `Agent-Update for address ${cleanedAddress}. Agent continuing recovery efforts.`;
        console.log(`Using emergency update draft: "${updateDraft.substring(0, 100)}..."`);
      }
      
      console.log(`==== ENHANCED UPDATE DRAFT CREATION END ====\n`);
      
      // Return enhanced update draft information with validation
      const result = {
        caseId: caseId,
        selectedAddress: selectedAddress || 'the property',
        forAddress: selectedAddress || 'the property',
        updateDraft: updateDraft || '',
        template: template || 'No template available',
        addressValidation: addressValidation || {},
        timestamp: new Date().toISOString()
      };
      
      // Final validation of result object
      Object.keys(result).forEach(key => {
        if (result[key] === null || result[key] === undefined) {
          console.warn(`Result property '${key}' is null/undefined`);
          if (typeof result[key] === 'string' && key !== 'updateDraft') {
            result[key] = 'Unknown';
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error(`Failed to create update draft for case ${caseId}:`, error);
      
      // Enhanced error handling with comprehensive fallback - Priority 5
      const errorCaseId = caseId || 'Unknown';
      const errorMessage = error?.message || 'Unknown error occurred';
      
      return {
        caseId: errorCaseId,
        error: `Error creating update draft: ${errorMessage}`,
        selectedAddress: 'Error',
        forAddress: 'Error',
        updateDraft: '',
        template: 'Error: No template available',
        addressValidation: {
          isValid: false,
          hasUsableAddresses: false,
          recommendations: ['Error occurred during processing'],
          addressCount: 0,
          validCount: 0,
          eligibleCount: 0
        },
        timestamp: new Date().toISOString(),
        hasError: true
      };
    }
  }
  
  /**
   * Enhanced address cleaning for template use with comprehensive validation - Priority 5
   * @param {string} address - Address to clean
   * @returns {string} - Cleaned address
   */
  cleanAddressForTemplate(address) {
    try {
      // Enhanced null/undefined checks - Priority 5
      if (address === null || address === undefined) {
        console.warn('Address is null or undefined, using fallback');
        return 'the property';
      }
      
      if (typeof address !== 'string') {
        console.warn(`Address is not a string: ${typeof address}, attempting conversion`);
        try {
          address = String(address);
        } catch (conversionError) {
          console.error('Failed to convert address to string:', conversionError.message);
          return 'the property';
        }
      }
      
      if (address.trim().length === 0) {
        console.warn('Address is empty after trimming, using fallback');
        return 'the property';
      }
      
      // Enhanced cleaning with error handling for each step
      let cleanedAddress = address;
      
      try {
        // Convert line breaks to spaces
        cleanedAddress = cleanedAddress.replace(/\r\n|\r|\n/g, ' ');
      } catch (error) {
        console.warn('Error replacing line breaks:', error.message);
      }
      
      try {
        // Normalize multiple spaces
        cleanedAddress = cleanedAddress.replace(/\s+/g, ' ');
      } catch (error) {
        console.warn('Error normalizing spaces:', error.message);
      }
      
      try {
        // Remove duplicate commas
        cleanedAddress = cleanedAddress.replace(/,\s*,/g, ',');
      } catch (error) {
        console.warn('Error removing duplicate commas:', error.message);
      }
      
      try {
        // Final trim
        cleanedAddress = cleanedAddress.trim();
      } catch (error) {
        console.warn('Error trimming cleaned address:', error.message);
      }
      
      // Final validation
      if (!cleanedAddress || cleanedAddress.length === 0) {
        console.warn('Cleaned address is empty, using fallback');
        return 'the property';
      }
      
      // Check for common invalid addresses
      const invalidPatterns = ['unknown', 'error', 'not found', 'no address'];
      const lowerCleaned = cleanedAddress.toLowerCase();
      
      for (const pattern of invalidPatterns) {
        if (lowerCleaned.includes(pattern)) {
          console.warn(`Address contains invalid pattern '${pattern}', using fallback`);
          return 'the property';
        }
      }
      
      return cleanedAddress;
    } catch (error) {
      console.error('Critical error in address cleaning:', error);
      return 'the property';
    }
  }
  
  /**
   * Enhanced template processing with comprehensive error handling - Priority 5
   * @param {string} template - Template string
   * @param {string} cleanedAddress - Cleaned address
   * @returns {string} - Processed template
   */
  processTemplate(template, cleanedAddress) {
    try {
      // Enhanced null/undefined checks - Priority 5
      if (!template) {
        console.warn('Template is null or undefined, using emergency template');
        template = this.getEmergencyTemplate();
      }
      
      if (typeof template !== 'string') {
        console.warn(`Template is not a string: ${typeof template}, using emergency template`);
        template = this.getEmergencyTemplate();
      }
      
      if (template.trim().length === 0) {
        console.warn('Template is empty, using emergency template');
        template = this.getEmergencyTemplate();
      }
      
      if (!cleanedAddress) {
        console.warn('Cleaned address is null or undefined, using fallback');
        cleanedAddress = 'the property';
      }
      
      if (typeof cleanedAddress !== 'string') {
        console.warn(`Cleaned address is not a string: ${typeof cleanedAddress}, using fallback`);
        cleanedAddress = 'the property';
      }
      
      let updateDraft = template;
      
      // Enhanced pattern matching with more specific rules
      const patterns = [
        {
          regex: /^For Address\s*{[Aa]ddress}/,
          replacement: `For Address ${cleanedAddress}`,
          description: 'For Address {address}'
        },
        {
          regex: /^For Address\s*[:–-]\s*{[Aa]ddress}/,
          replacement: `For Address: ${cleanedAddress}`,
          description: 'For Address: {address}'
        },
        {
          regex: /^For Address-\s*{[Aa]ddress}/,
          replacement: `For Address - ${cleanedAddress}`,
          description: 'For Address- {address}'
        }
      ];
      
      // Apply pattern-specific replacements with error handling
      let patternApplied = false;
      for (const pattern of patterns) {
        try {
          if (!pattern.regex || !pattern.replacement || !pattern.description) {
            console.warn('Invalid pattern configuration, skipping');
            continue;
          }
          
          if (template.match(pattern.regex)) {
            console.log(`    Applying pattern: ${pattern.description}`);
            updateDraft = updateDraft.replace(pattern.regex, pattern.replacement);
            patternApplied = true;
            break;
          }
        } catch (patternError) {
          console.warn(`Error applying pattern ${pattern.description}:`, patternError.message);
        }
      }
      
      // Handle any remaining {address} placeholders with error handling
      try {
        const beforeReplacement = updateDraft;
        updateDraft = updateDraft.replace(/{[Aa]ddress}/g, cleanedAddress);
        
        if (beforeReplacement !== updateDraft) {
          console.log(`    Replaced {address} placeholders with: ${cleanedAddress}`);
        }
      } catch (replacementError) {
        console.error('Error replacing address placeholders:', replacementError.message);
        // Fallback: try simple string replacement
        try {
          updateDraft = updateDraft.replace('{address}', cleanedAddress);
          updateDraft = updateDraft.replace('{Address}', cleanedAddress);
        } catch (fallbackError) {
          console.error('Fallback replacement also failed:', fallbackError.message);
        }
      }
      
      // Final validation of processed template
      const finalTemplate = updateDraft.trim();
      if (finalTemplate.length === 0) {
        console.warn('Processed template is empty, using emergency template');
        return `Agent-Update for address ${cleanedAddress}. Agent continuing recovery efforts.`;
      }
      
      // Check if template still contains unprocessed placeholders
      if (finalTemplate.includes('{address}') || finalTemplate.includes('{Address}')) {
        console.warn('Template still contains unprocessed placeholders');
        console.log(`Template: "${finalTemplate}"`);
      }
      
      return finalTemplate;
    } catch (error) {
      console.error('Critical error in template processing:', error);
      // Emergency fallback
      const emergencyAddress = cleanedAddress || 'the property';
      return `Agent-Update for address ${emergencyAddress}. Agent continuing recovery efforts.`;
    }
  }
}

module.exports = UpdateDrafter;