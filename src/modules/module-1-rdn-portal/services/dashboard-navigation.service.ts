import { Page } from 'playwright'
import { NavigationResult, NavigationStep } from '../types'
import { NavigationUtilities } from './navigation-utilities.service'

export class DashboardNavigationService {
  private utilities = new NavigationUtilities()

  async navigateToDashboard(page: Page): Promise<NavigationResult> {
    this.utilities.log('NAV', 'Starting navigation to dashboard')
    try {
      await page.waitForSelector('iframe[name="mainFrame"]', { timeout: 50000 })      
      this.utilities.log('NAV', 'Dashboard loaded successfully')      
      return {
        success: true,
        nextStep: NavigationStep.DASHBOARD
      }
    } catch (error) {
      this.utilities.log('NAV', 'Failed to navigate to dashboard', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Failed to navigate to dashboard'
      }
    }
  }
}