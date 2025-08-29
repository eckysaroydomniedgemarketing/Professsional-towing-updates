import { Page } from 'playwright';

export interface PhotoDownloadResult {
  success: boolean;
  photoName: string;
  photoBlob?: Blob;
  error?: string;
}

export class VehiclePhotosDownloaderService {
  constructor(private page: Page) {}

  async downloadPhoto(photoUrl: string, photoName: string): Promise<PhotoDownloadResult> {
    try {
      // Ensure we have a full URL
      const fullUrl = this.buildFullUrl(photoUrl);
      
      console.log(`Downloading photo: ${photoName} from ${fullUrl}`);
      
      // Use page context to download image with existing session/cookies
      const response = await this.page.evaluate(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            credentials: 'include', // Include cookies
            headers: {
              'Accept': 'image/*'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const buffer = await response.arrayBuffer();
          return {
            success: true,
            data: Array.from(new Uint8Array(buffer)),
            contentType: response.headers.get('content-type') || 'image/jpeg'
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Download failed'
          };
        }
      }, fullUrl);
      
      if (!response.success) {
        console.error(`Failed to download ${photoName}: ${response.error}`);
        return {
          success: false,
          photoName,
          error: response.error
        };
      }
      
      // Convert array back to Blob (handle both browser and Node.js environments)
      const uint8Array = new Uint8Array(response.data);
      let photoBlob: Blob;
      
      // Check if we're in a browser environment with native Blob support
      if (typeof Blob !== 'undefined') {
        photoBlob = new Blob([uint8Array], { type: response.contentType });
      } else {
        // Fallback for Node.js-like environments
        photoBlob = {
          size: uint8Array.length,
          type: response.contentType,
          arrayBuffer: async () => uint8Array.buffer,
          slice: () => photoBlob,
          stream: () => new ReadableStream(),
          text: async () => new TextDecoder().decode(uint8Array)
        } as Blob;
      }
      
      console.log(`Successfully downloaded ${photoName} (${photoBlob.size} bytes)`);
      
      return {
        success: true,
        photoName,
        photoBlob
      };
    } catch (error) {
      console.error(`Error downloading photo ${photoName}:`, error);
      return {
        success: false,
        photoName,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async downloadMultiplePhotos(
    photos: Array<{ photoName: string; rdnPhotoUrl: string }>
  ): Promise<PhotoDownloadResult[]> {
    const results: PhotoDownloadResult[] = [];
    
    // Download photos sequentially for MVP (avoid overwhelming server)
    for (const photo of photos) {
      if (!photo.rdnPhotoUrl) {
        results.push({
          success: false,
          photoName: photo.photoName,
          error: 'No URL provided'
        });
        continue;
      }
      
      const result = await this.downloadPhoto(photo.rdnPhotoUrl, photo.photoName);
      results.push(result);
      
      // Small delay between downloads to be respectful to the server
      await this.page.waitForTimeout(500);
    }
    
    return results;
  }

  private buildFullUrl(photoUrl: string): string {
    // If already a full URL, return as is
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      return photoUrl;
    }
    
    // Get the current page URL to extract base URL
    const currentUrl = this.page.url();
    const urlObj = new URL(currentUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    
    // Handle relative URLs
    if (photoUrl.startsWith('/')) {
      return `${baseUrl}${photoUrl}`;
    }
    
    return `${baseUrl}/${photoUrl}`;
  }
}