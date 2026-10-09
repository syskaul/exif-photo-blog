import AdminLibraryEditPage from '@/library/AdminLibraryEditPage';
import { getLibraryData } from '@/library/data';
import { PRESERVE_ORIGINAL_UPLOADS } from '@/app/config';
import { feedQueryOptions } from '@/feed';
import {
  getPhotosCached,
  getPhotosMetaCached,
} from '@/photo/cache';

const PHOTO_CHOOSER_QUERY_OPTIONS = feedQueryOptions({
  isGrid: true,
  excludeFromFeeds: false,
});

export default async function LibraryEditPage() {
  const [
    {
      library,
      photoAvatar,
    },
    photos,
    photosCount,
  ] = await Promise.all([
    getLibraryData()
      .catch(() => ({
        library: undefined,
        photoAvatar: undefined,
        photoHero: undefined,
      })),
    getPhotosCached(PHOTO_CHOOSER_QUERY_OPTIONS)
      .catch(() => []),
    getPhotosMetaCached(PHOTO_CHOOSER_QUERY_OPTIONS)
      .then(({ count }) => count)
      .catch(() => 0),
  ]);

  return (
    <AdminLibraryEditPage {...{
      library,
      photoAvatar,
      photos,
      photosCount,
      shouldResizeImages: !PRESERVE_ORIGINAL_UPLOADS,
    }} />
  );
}
