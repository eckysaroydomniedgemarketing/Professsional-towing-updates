import { Page, Frame } from 'playwright'

export async function waitForIframe(
  page: Page, 
  iframeName: string, 
  timeout: number = 10000
): Promise<Frame | null> {
  try {
    await page.waitForSelector(`iframe[name="${iframeName}"]`, { timeout })
    const frame = page.frame({ name: iframeName })
    
    if (frame) {
      await frame.waitForLoadState('domcontentloaded')
    }
    
    return frame
  } catch (error) {
    console.error(`Failed to find iframe "${iframeName}":`, error)
    return null
  }
}

export async function getIframeOrThrow(
  page: Page,
  iframeName: string,
  timeout: number = 10000
): Promise<Frame> {
  const frame = await waitForIframe(page, iframeName, timeout)
  
  if (!frame) {
    throw new Error(`iframe "${iframeName}" not found or not loaded within ${timeout}ms`)
  }
  
  return frame
}

export async function clickInIframe(
  page: Page,
  iframeName: string,
  selector: string,
  options?: { timeout?: number }
): Promise<void> {
  const frame = await getIframeOrThrow(page, iframeName, options?.timeout)
  
  const element = await frame.waitForSelector(selector, { 
    timeout: options?.timeout || 5000,
    state: 'visible'
  })
  
  if (!element) {
    throw new Error(`Element "${selector}" not found in iframe "${iframeName}"`)
  }
  
  await element.click()
}

export async function selectInIframe(
  page: Page,
  iframeName: string,
  selector: string,
  value: string,
  options?: { timeout?: number }
): Promise<void> {
  const frame = await getIframeOrThrow(page, iframeName, options?.timeout)
  
  await frame.waitForSelector(selector, { 
    timeout: options?.timeout || 5000,
    state: 'visible'
  })
  
  await frame.selectOption(selector, value)
}

export async function findElementInIframe(
  page: Page,
  iframeName: string,
  selector: string,
  options?: { timeout?: number }
): Promise<boolean> {
  try {
    const frame = await waitForIframe(page, iframeName, options?.timeout)
    if (!frame) return false
    
    const element = await frame.$(selector)
    return !!element
  } catch {
    return false
  }
}