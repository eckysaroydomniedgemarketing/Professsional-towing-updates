import { createClient } from '@supabase/supabase-js';
import { VehiclePhoto } from './vehicle-photos-extractor.service';
import { VehiclePhotosDownloaderService } from './vehicle-photos-downloader.service';
import { Page } from 'playwright';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Use service role key for storage operations if available (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export class VehiclePhotosStorageService {
  private supabase;
  private storageSupabase;
  private downloaderService?: VehiclePhotosDownloaderService;

  constructor(page?: Page) {
    // Regular client for database operations
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Use service role key for storage if available, otherwise use anon key
    this.storageSupabase = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : this.supabase;
    
    if (page) {
      this.downloaderService = new VehiclePhotosDownloaderService(page);
    }
  }

  async storeVehiclePhotos(caseId: string, photos: VehiclePhoto[]): Promise<boolean> {
    try {
      if (photos.length === 0) {
        console.log('No photos to store');
        return true;
      }

      // Delete existing photos for this case to avoid duplicates
      await this.deleteVehiclePhotos(caseId);

      // Process each photo: download and upload to storage
      for (const photo of photos) {
        try {
          let storageUrl = null;
          
          // If we have a downloader service and RDN URL, download and upload the photo
          if (this.downloaderService && photo.rdnPhotoUrl) {
            console.log(`Processing photo: ${photo.photoName}`);
            
            // Download the photo from RDN
            const downloadResult = await this.downloaderService.downloadPhoto(
              photo.rdnPhotoUrl, 
              photo.photoName
            );
            
            if (downloadResult.success && downloadResult.photoBlob) {
              // Upload to Supabase storage
              storageUrl = await this.uploadPhotoToStorage(
                caseId, 
                photo.photoName, 
                downloadResult.photoBlob
              );
              
              if (storageUrl) {
                console.log(`Successfully uploaded ${photo.photoName} to storage`);
              } else {
                console.log(`Failed to upload ${photo.photoName} to storage`);
              }
            } else {
              console.log(`Failed to download ${photo.photoName}: ${downloadResult.error}`);
            }
          }
          
          // Insert photo record with storage URL if available
          const { error } = await this.supabase
            .from('case_vehicle_photos')
            .insert({
              case_id: caseId,
              photo_name: photo.photoName,
              rdn_photo_url: photo.rdnPhotoUrl || null,
              storage_bucket_url: storageUrl,
              is_present: photo.isPresent,
              upload_date: new Date().toISOString(),
              mime_type: storageUrl ? this.getMimeType(photo.photoName) : null
            });
          
          if (error) {
            // Check if it's a foreign key constraint error
            if (error.code === '23503' && error.message?.includes('case_updates')) {
              console.error(`Case ${caseId} doesn't exist in case_updates table. Skipping photo storage.`);
              // Try to create the case_updates record with a default status
              const { error: insertError } = await this.supabase
                .from('case_updates')
                .insert({ case_id: caseId, status: 'pending' })
                .select()
                .single();
              
              if (!insertError) {
                // Retry photo record insertion
                const { error: retryError } = await this.supabase
                  .from('case_vehicle_photos')
                  .insert({
                    case_id: caseId,
                    photo_name: photo.photoName,
                    rdn_photo_url: photo.rdnPhotoUrl || null,
                    storage_bucket_url: storageUrl,
                    is_present: photo.isPresent,
                    upload_date: new Date().toISOString(),
                    mime_type: storageUrl ? this.getMimeType(photo.photoName) : null
                  });
                
                if (retryError) {
                  console.error(`Retry failed for ${photo.photoName}:`, retryError);
                } else {
                  console.log(`Successfully stored photo record for ${photo.photoName} after creating case_updates entry`);
                }
              }
            } else {
              console.error(`Error storing photo record for ${photo.photoName}:`, error);
            }
          }
        } catch (photoError) {
          console.error(`Error processing photo ${photo.photoName}:`, photoError);
          // Continue with next photo even if one fails
        }
      }

      console.log(`Processed ${photos.length} photos for case ${caseId}`);
      return true;
    } catch (error) {
      console.error('Error in storeVehiclePhotos:', error);
      return false;
    }
  }

  async uploadPhotoToStorage(caseId: string, photoName: string, photoBlob: Blob): Promise<string | null> {
    try {
      const fileName = `${caseId}/${photoName}`;
      
      // Convert Blob to ArrayBuffer for Supabase
      let uploadData: ArrayBuffer | Blob = photoBlob;
      
      // If it's our custom Blob-like object, use the arrayBuffer
      if (!photoBlob.constructor.name.includes('Blob') && photoBlob.arrayBuffer) {
        uploadData = await photoBlob.arrayBuffer();
      }
      
      // Upload to Supabase storage using the storage-specific client (with service role if available)
      const { data, error } = await this.storageSupabase.storage
        .from('vehicle-photos')
        .upload(fileName, uploadData, {
          contentType: photoBlob.type || 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Error uploading photo to storage:', error);
        // Log more details for debugging
        console.error('Upload details:', {
          bucket: 'vehicle-photos',
          fileName,
          contentType: photoBlob.type || 'image/jpeg',
          hasServiceKey: !!supabaseServiceKey
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = this.storageSupabase.storage
        .from('vehicle-photos')
        .getPublicUrl(fileName);

      console.log(`Photo uploaded successfully: ${fileName}`);
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadPhotoToStorage:', error);
      return null;
    }
  }


  async getVehiclePhotos(caseId: string) {
    try {
      const { data, error } = await this.supabase
        .from('case_vehicle_photos')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching vehicle photos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVehiclePhotos:', error);
      return [];
    }
  }

  async deleteVehiclePhotos(caseId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('case_vehicle_photos')
        .delete()
        .eq('case_id', caseId);

      if (error) {
        console.error('Error deleting vehicle photos:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteVehiclePhotos:', error);
      return false;
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }
}