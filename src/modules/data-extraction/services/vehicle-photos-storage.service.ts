import { createClient } from '@supabase/supabase-js';
import { VehiclePhoto } from './vehicle-photos-extractor.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class VehiclePhotosStorageService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async storeVehiclePhotos(caseId: string, photos: VehiclePhoto[]): Promise<boolean> {
    try {
      if (photos.length === 0) {
        console.log('No photos to store');
        return true;
      }

      // Prepare data for insertion
      const dataToInsert = photos.map(photo => ({
        case_id: caseId,
        photo_name: photo.photoName,
        rdn_photo_url: photo.rdnPhotoUrl || null,
        is_present: photo.isPresent,
        upload_date: new Date().toISOString()
      }));

      // Delete existing photos for this case to avoid duplicates
      await this.deleteVehiclePhotos(caseId);

      // Insert new photo records
      const { data, error } = await this.supabase
        .from('case_vehicle_photos')
        .insert(dataToInsert);

      if (error) {
        console.error('Error storing vehicle photos:', error);
        return false;
      }

      console.log(`Stored ${photos.length} photos for case ${caseId}`);
      return true;
    } catch (error) {
      console.error('Error in storeVehiclePhotos:', error);
      return false;
    }
  }

  async uploadPhotoToStorage(caseId: string, photoName: string, photoBlob: Blob): Promise<string | null> {
    try {
      const fileName = `${caseId}/${photoName}`;
      
      // Upload to Supabase storage
      const { data, error } = await this.supabase.storage
        .from('vehicle-photos')
        .upload(fileName, photoBlob, {
          contentType: photoBlob.type,
          upsert: true
        });

      if (error) {
        console.error('Error uploading photo to storage:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadPhotoToStorage:', error);
      return null;
    }
  }

  async updatePhotoWithStorageUrl(caseId: string, photoName: string, storageUrl: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('case_vehicle_photos')
        .update({ 
          storage_bucket_url: storageUrl,
          mime_type: this.getMimeType(photoName)
        })
        .eq('case_id', caseId)
        .eq('photo_name', photoName);

      if (error) {
        console.error('Error updating photo with storage URL:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePhotoWithStorageUrl:', error);
      return false;
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