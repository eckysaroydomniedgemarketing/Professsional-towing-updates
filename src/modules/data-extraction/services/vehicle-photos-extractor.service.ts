import { Page } from 'playwright';

export interface VehiclePhoto {
  photoName: string;
  rdnPhotoUrl?: string;
  isPresent: boolean;
}

export interface VehiclePhotosResult {
  success: boolean;
  tabFound: boolean;
  photos: VehiclePhoto[];
  message: string;
}

export class VehiclePhotosExtractorService {
  constructor(private page: Page) {}

  async navigateToPhotosTab(): Promise<boolean> {
    try {
      // Check if Photos/Docs tab exists
      const tabExists = await this.page.locator('#tab_14').count() > 0;
      if (!tabExists) {
        console.log('Photos/Docs tab not found');
        return false;
      }

      // Click on Photos/Docs tab
      const photosTab = await this.page.locator('#tab_14 a').first();
      await photosTab.click();
      
      // Wait for content to load
      await this.page.waitForTimeout(3000);
      
      return true;
    } catch (error) {
      console.error('Error navigating to Photos/Docs tab:', error);
      return false;
    }
  }

  async extractPhotoData(): Promise<VehiclePhoto[]> {
    try {
      const photos: VehiclePhoto[] = [];
      
      // Look for photo elements in various possible containers
      // Try to find uploaded files list
      const photoElements = await this.page.locator('[id*="uploaded"]').all();
      
      if (photoElements.length === 0) {
        // Try alternative selectors for photos
        const alternativePhotos = await this.page.locator('div:has-text(".jpg"), div:has-text(".png"), div:has-text(".jpeg")').all();
        
        for (const element of alternativePhotos) {
          const text = await element.textContent();
          if (text && (text.includes('.jpg') || text.includes('.png') || text.includes('.jpeg'))) {
            photos.push({
              photoName: text.trim(),
              isPresent: true
            });
          }
        }
      } else {
        // Extract from found elements
        for (const element of photoElements) {
          const photoText = await element.textContent();
          if (photoText) {
            const cleanName = photoText.trim().replace(/\s+\(.*?\)/, ''); // Remove size info if present
            photos.push({
              photoName: cleanName,
              isPresent: true
            });
          }
        }
      }

      // Try to extract photo URLs if available
      const imageLinks = await this.page.locator('a[href*="/photos/"], a[href*="/images/"]').all();
      for (const link of imageLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        if (href && text) {
          const existingPhoto = photos.find(p => text.includes(p.photoName));
          if (existingPhoto) {
            existingPhoto.rdnPhotoUrl = href;
          } else {
            photos.push({
              photoName: text.trim(),
              rdnPhotoUrl: href,
              isPresent: true
            });
          }
        }
      }

      return photos;
    } catch (error) {
      console.error('Error extracting photo data:', error);
      return [];
    }
  }

  async processVehiclePhotos(caseId: string): Promise<VehiclePhotosResult> {
    try {
      // Navigate to Photos/Docs tab
      const navigationSuccess = await this.navigateToPhotosTab();
      
      if (!navigationSuccess) {
        return {
          success: false,
          tabFound: false,
          photos: [],
          message: 'Failed to navigate to Photos/Docs tab'
        };
      }

      // Extract photo data
      const photos = await this.extractPhotoData();
      
      if (photos.length === 0) {
        return {
          success: true,
          tabFound: true,
          photos: [],
          message: 'No photos found in Photos/Docs tab'
        };
      }

      console.log(`Extracted ${photos.length} photos for case ${caseId}`);
      
      return {
        success: true,
        tabFound: true,
        photos,
        message: `Successfully extracted ${photos.length} photos`
      };
    } catch (error) {
      console.error('Error processing vehicle photos:', error);
      return {
        success: false,
        tabFound: false,
        photos: [],
        message: `Error: ${error}`
      };
    }
  }
}