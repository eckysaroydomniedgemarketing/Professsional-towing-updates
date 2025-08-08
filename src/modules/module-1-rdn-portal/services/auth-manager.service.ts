import { Page } from 'playwright'
import { RDNCredentials, NavigationResult, NavigationStep } from '../types'

export class AuthManager {
  private debug = true
  private isAuthenticated = false

  constructor(private credentials: RDNCredentials) {}

  private log(step: string, message: string, data?: unknown) {
    if (this.debug) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [RDN-${step}]`, message, data ? JSON.stringify(data, null, 2) : '')
    }
  }

  async navigateToLogin(page: Page): Promise<NavigationResult> {
    this.log('AUTH', 'Starting navigation to login page')
    try {
      const loginUrl = 'https://secureauth.recoverydatabase.net/public/login?rd=/'
      this.log('AUTH', 'Navigating to URL', { url: loginUrl })
      
      await page.goto(loginUrl)
      
      this.log('AUTH', 'Waiting for login form')
      await page.waitForSelector('form[method="post"]', { timeout: 10000 })
      
      this.log('AUTH', 'Login form found successfully')
      
      return {
        success: true,
        nextStep: NavigationStep.LOGIN_PAGE
      }
    } catch (error) {
      this.log('AUTH', 'Failed to navigate to login', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.ERROR,
        error: error instanceof Error ? error.message : 'Failed to navigate to login'
      }
    }
  }

  async authenticate(page: Page): Promise<NavigationResult> {
    this.log('AUTH', 'Starting authentication')
    try {
      // Fill in credentials
      this.log('AUTH', 'Filling credentials', { username: this.credentials.username })
      await page.fill('input[name="username"]', this.credentials.username)
      await page.fill('input[name="password"]', this.credentials.password)
      await page.fill('input[name="code"]', this.credentials.securityCode)
      
      // Submit form
      this.log('AUTH', 'Submitting login form')
      await page.click('button.btn.btn-success')
      
      // Wait for navigation
      this.log('AUTH', 'Waiting for navigation after login')
      await page.waitForLoadState('networkidle')
      
      // Check for login errors
      const errorElement = await page.$('div.error, .alert-danger, [class*="error"]')
      if (errorElement) {
        const errorText = await errorElement.textContent()
        this.log('AUTH', 'Login error detected', { error: errorText })
        return {
          success: false,
          nextStep: NavigationStep.LOGIN_PAGE,
          error: `Login failed: ${errorText || 'Invalid credentials'}`
        }
      }
      
      // Verify successful login by checking URL
      const currentUrl = page.url()
      if (currentUrl.includes('login')) {
        this.log('AUTH', 'Still on login page after submission')
        return {
          success: false,
          nextStep: NavigationStep.LOGIN_PAGE,
          error: 'Login failed - still on login page'
        }
      }
      
      this.log('AUTH', 'Authentication successful', { url: currentUrl })
      this.isAuthenticated = true
      
      return {
        success: true,
        nextStep: NavigationStep.DASHBOARD
      }
    } catch (error) {
      this.log('AUTH', 'Authentication failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      return {
        success: false,
        nextStep: NavigationStep.LOGIN_PAGE,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  async checkSession(page: Page): Promise<boolean> {
    const url = page.url()
    const isOnLoginPage = url.includes('login')
    
    if (isOnLoginPage) {
      this.log('AUTH', 'Session lost - on login page', { url })
      this.isAuthenticated = false
      return false
    }
    
    return this.isAuthenticated
  }

  getAuthStatus(): boolean {
    return this.isAuthenticated
  }

  resetAuthStatus(): void {
    this.isAuthenticated = false
  }
}