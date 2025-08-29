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
      
      // Look for image thumbnails with onclick handlers (common pattern in RDN)
      const imageThumbnails = await this.page.locator('img.ImageThumbnail').all();
      
      for (const thumbnail of imageThumbnails) {
        try {
          // Get the image source URL
          const src = await thumbnail.getAttribute('src');
          if (!src) continue;
          
          // Extract photo name from URL or parent element
          const parentLink = await thumbnail.evaluateHandle(el => el.closest('a'));
          const onclickAttr = await parentLink.evaluate((el: any) => el?.getAttribute('onclick'));
          
          let photoName = 'photo_' + Date.now();
          let rdnPhotoUrl = src;
          
          // Parse onclick to get better photo info
          if (onclickAttr && onclickAttr.includes('displayFullImage')) {
            const match = onclickAttr.match(/displayFullImage\('([^']+)',\s*\d+,\s*'([^']+)'\)/);
            if (match) {
              rdnPhotoUrl = match[1];
              // Extract filename from URL
              const urlParts = rdnPhotoUrl.split('/');
              photoName = urlParts[urlParts.length - 1] || photoName;
            }
          }
          
          // Alternative: extract from src URL
          if (photoName.startsWith('photo_') && src.includes('/name/')) {
            const nameMatch = src.match(/\/name\/([^\/]+)/);
            if (nameMatch) {
              photoName = nameMatch[1];
            }
          }
          
          photos.push({
            photoName,
            rdnPhotoUrl,
            isPresent: true
          });
        } catch (err) {
          console.log('Error processing thumbnail:', err);
        }
      }
      
      // Fallback: Look for links with photo URLs
      if (photos.length === 0) {
        const photoLinks = await this.page.locator('a[onclick*="displayFullImage"], img[src*="/rdn.php/photo/"]').all();
        
        for (const element of photoLinks) {
          try {
            let photoUrl = '';
            let photoName = '';
            
            if (await element.evaluate(el => el.tagName === 'IMG')) {
              photoUrl = await element.getAttribute('src') || '';
            } else {
              const onclick = await element.getAttribute('onclick') || '';
              const match = onclick.match(/displayFullImage\('([^']+)'/);
              if (match) {
                photoUrl = match[1];
              }
            }
            
            if (photoUrl) {
              // Extract name from URL
              const urlParts = photoUrl.split('/');
              photoName = urlParts[urlParts.length - 1] || `photo_${photos.length + 1}`;
              
              photos.push({
                photoName,
                rdnPhotoUrl: photoUrl,
                isPresent: true
              });
            }
          } catch (err) {
            console.log('Error processing photo link:', err);
          }
        }
      }

      console.log(`Extracted ${photos.length} photo URLs from Photos/Docs tab`);
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