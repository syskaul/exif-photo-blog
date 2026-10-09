import { getStorageUploadUrlsNoStore } from '@/platforms/storage/cache';
import AppGrid from '@/components/AppGrid';
import { getAlbumsWithMetaCached } from '@/album/cache';
import AdminUploadsClient from '@/admin/AdminUploadsClient';
import { PRESERVE_ORIGINAL_UPLOADS } from '@/app/config';

export const maxDuration = 60;

export default async function AdminUploadsPage() {
  const urls = await getStorageUploadUrlsNoStore();

  const uniqueAlbums = urls.length > 0
    ? await getAlbumsWithMetaCached()
    : [];

  return (
    <AppGrid
      contentMain={
        <AdminUploadsClient {...{
          urls,
          uniqueAlbums,
          shouldResize: !PRESERVE_ORIGINAL_UPLOADS,
        }} />}
    />
  );
}
