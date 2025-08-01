import { RDNPortalService } from './src/modules/module-1-rdn-portal/services/rdn-portal-service'

async function testModule1() {
  const credentials = {
    username: 'Aayat',
    password: 'ProTow4711!',
    securityCode: '3107'
  }
  
  const service = new RDNPortalService(credentials)
  
  try {
    console.log('Starting Module 1 test...')
    const result = await service.executeFullWorkflow()
    console.log('Workflow result:', result)
    
    if (result.success) {
      console.log('✅ Module 1 workflow completed successfully!')
      const currentUrl = await service.getCurrentUrl()
      console.log('Final URL:', currentUrl)
    } else {
      console.log('❌ Module 1 workflow failed:', result.error)
    }
    
    const state = await service.getState()
    console.log('\nFinal state:', state)
    
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    // Keep browser open for inspection
    console.log('\nBrowser will remain open for manual inspection.')
    console.log('Press Ctrl+C to close and exit.')
    
    // Keep the process alive
    await new Promise(() => {})
  }
}

testModule1()