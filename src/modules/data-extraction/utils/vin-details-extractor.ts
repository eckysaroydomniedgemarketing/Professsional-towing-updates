import { Page } from 'playwright';

/**
 * Interface for VIN Details extracted from the VIN Details page
 */
export interface VinDetails {
  market_class?: string | null;
  driving_wheels?: string | null;
  transmission_type?: string | null;
}

/**
 * Extract VIN details from the VIN Details page
 * @param page - Playwright page object (should be on VIN Details page)
 * @returns VinDetails object with extracted values
 */
export async function extractVinDetails(page: Page): Promise<VinDetails> {
  const details: VinDetails = {
    market_class: null,
    driving_wheels: null,
    transmission_type: null
  };

  try {
    console.log('Starting VIN Details extraction...');

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Extract from Vehicle Description table
    const vehicleDescriptionData = await parseVehicleDescription(page);
    if (vehicleDescriptionData.market_class) {
      details.market_class = vehicleDescriptionData.market_class;
      console.log('Market Class extracted:', details.market_class);
    }
    if (vehicleDescriptionData.driving_wheels) {
      details.driving_wheels = vehicleDescriptionData.driving_wheels;
      console.log('Driving Wheels extracted:', details.driving_wheels);
    }

    // Extract from Drivetrain - Transmission table
    const transmissionData = await parseDrivetrain(page);
    if (transmissionData.transmission_type) {
      details.transmission_type = transmissionData.transmission_type;
      console.log('Transmission Type extracted:', details.transmission_type);
    }

    console.log('VIN Details extraction completed:', details);
    return details;

  } catch (error) {
    console.error('Error extracting VIN details:', error);
    // Return partial data even if extraction fails
    return details;
  }
}

/**
 * Parse the Vehicle Description table
 * @param page - Playwright page object
 * @returns Object containing market_class and driving_wheels
 */
async function parseVehicleDescription(page: Page): Promise<{
  market_class: string | null;
  driving_wheels: string | null;
}> {
  const result = {
    market_class: null as string | null,
    driving_wheels: null as string | null
  };

  try {
    console.log('Looking for Vehicle Description table...');
    
    // Look for Vehicle Description table
    const vehicleTable = await page.$('h3:has-text("Vehicle Description") + table');
    
    if (vehicleTable) {
      console.log('Vehicle Description table found');
      
      // Get all headers from thead
      const headers = await vehicleTable.$$eval('thead th', elements => 
        elements.map(el => el.textContent?.trim() || '')
      );
      console.log('Headers found:', headers);
      
      // Get all values from first row of tbody
      const values = await vehicleTable.$$eval('tbody tr:first-child td', elements => 
        elements.map(el => el.textContent?.trim() || '')
      );
      console.log('Values found:', values);
      
      // Find Market Class by index
      const marketClassIndex = headers.findIndex(h => h === 'Market Class');
      if (marketClassIndex !== -1 && values[marketClassIndex]) {
        result.market_class = values[marketClassIndex];
        console.log(`Market Class found at index ${marketClassIndex}:`, result.market_class);
      } else {
        console.log('Market Class not found in table');
      }
      
      // Find Driving Wheels by index
      const drivingWheelsIndex = headers.findIndex(h => h === 'Driving Wheels');
      if (drivingWheelsIndex !== -1 && values[drivingWheelsIndex]) {
        result.driving_wheels = values[drivingWheelsIndex];
        console.log(`Driving Wheels found at index ${drivingWheelsIndex}:`, result.driving_wheels);
      } else {
        console.log('Driving Wheels not found in table');
      }
    } else {
      console.log('Vehicle Description table not found');
    }

  } catch (error) {
    console.log('Error parsing Vehicle Description table:', error);
  }

  return result;
}

/**
 * Parse the Drivetrain - Transmission table
 * @param page - Playwright page object
 * @returns Object containing transmission_type
 */
async function parseDrivetrain(page: Page): Promise<{
  transmission_type: string | null;
}> {
  const result = {
    transmission_type: null as string | null
  };

  try {
    // Look for Drivetrain - Transmission table
    const transmissionTable = await page.$('th:has-text("Drivetrain - Transmission")');
    
    if (transmissionTable) {
      // The transmission table is likely the parent table of this header
      const table = await transmissionTable.evaluateHandle(el => el.closest('table'));
      
      if (table) {
        // Look for Manual/Automatic row
        const rows = await table.$$('tr');
        for (const row of rows) {
          const cells = await row.$$('td');
          for (const cell of cells) {
            const cellText = await cell.textContent();
            if (cellText && cellText.includes('Manual/Automatic:')) {
              // Extract the value after the colon
              const parts = cellText.split(':');
              if (parts.length > 1) {
                result.transmission_type = parts[1].trim();
                break;
              }
            }
          }
          if (result.transmission_type) break;
        }
      }
    }

    // Alternative approach: Direct text search
    if (!result.transmission_type) {
      const allTds = await page.$$('td');
      for (const td of allTds) {
        const text = await td.textContent();
        if (text && text.includes('Manual/Automatic:')) {
          const parts = text.split(':');
          if (parts.length > 1) {
            result.transmission_type = parts[1].trim();
            break;
          }
        }
      }
    }

  } catch (error) {
    console.log('Error parsing Drivetrain - Transmission table:', error);
  }

  return result;
}

/**
 * Handle VIN Details page navigation and extraction
 * @param page - Current Playwright page object
 * @param vinDetailsUrl - URL to the VIN Details page (required - constructed from case ID and VIN)
 * @returns VinDetails object with extracted values
 */
export async function navigateAndExtractVinDetails(page: Page, vinDetailsUrl?: string): Promise<VinDetails> {
  let newPage: Page | null = null;
  
  try {
    // URL should be provided through direct construction
    if (!vinDetailsUrl) {
      console.log('VIN Details URL not provided');
      return {
        market_class: null,
        driving_wheels: null,
        transmission_type: null
      };
    }

    console.log('Opening VIN Details page with URL:', vinDetailsUrl);
    
    // Open new tab/page directly with the constructed URL
    const context = page.context();
    newPage = await context.newPage();
    await newPage.goto(vinDetailsUrl);

    // Wait for the new page to load
    await newPage.waitForLoadState('domcontentloaded');
    await newPage.waitForTimeout(2000);

    // Extract VIN details from the new page
    const vinDetails = await extractVinDetails(newPage);

    // Close the VIN details tab
    await newPage.close();

    return vinDetails;

  } catch (error) {
    console.error('Error navigating to and extracting VIN details:', error);
    
    // Attempt to close the new page if it was opened
    if (newPage) {
      try {
        await newPage.close();
      } catch (closeError) {
        console.log('Error closing VIN details page:', closeError);
      }
    }

    return {
      market_class: null,
      driving_wheels: null,
      transmission_type: null
    };
  }
}