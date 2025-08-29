import { Page, BrowserContext } from 'playwright'
import { NavigationResult, NavigationStep } from '../types'
import { NavigationUtilities } from './navigation-utilities.service'
import { DashboardNavigationService } from './dashboard-navigation.service'
import { CaseListingNavigationService } from './case-listing-navigation.service'
import { CaseDetailNavigationService } from './case-detail-navigation.service'
import { PaginationService } from './pagination.service'

export class NavigationManager {
  private utilities = new NavigationUtilities()
  private dashboardNav = new DashboardNavigationService()
  private caseListingNav = new CaseListingNavigationService()
  private caseDetailNav = new CaseDetailNavigationService()
  private pagination = new PaginationService()

  constructor() {}

  // Delegate to dashboard navigation service
  async navigateToDashboard(page: Page): Promise<NavigationResult> {
    return await this.dashboardNav.navigateToDashboard(page)
  }

  // Delegate to case listing navigation service
  async navigateToCaseListing(page: Page, context: BrowserContext): Promise<NavigationResult> {
    return await this.caseListingNav.navigateToCaseListing(page, context)
  }

  // Delegate to utilities service
  async clickUpdatesTab(page: Page): Promise<boolean> {
    return await this.utilities.clickUpdatesTab(page)
  }

  // Delegate to case listing navigation service
  getCaseListingUrl(): string | null {
    return this.caseListingNav.getCaseListingUrl()
  }

  // Delegate to case detail navigation service
  async navigateToSpecificCase(page: Page, caseId: string, isDirectNavigation: boolean = true): Promise<NavigationResult> {
    return await this.caseDetailNav.navigateToSpecificCase(page, caseId, isDirectNavigation)
  }

  // Delegate to pagination service
  async extractPageInfo(page: Page): Promise<{ totalPages: number; currentPage: number } | null> {
    return await this.pagination.extractPageInfo(page)
  }

  // Delegate to pagination service
  async navigateToSpecificPage(page: Page, pageNumber: number): Promise<NavigationResult> {
    return await this.pagination.navigateToSpecificPage(page, pageNumber)
  }
}