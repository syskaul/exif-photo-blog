import { Photo, PhotoDateRangePostgres } from '@/photo';
import PhotoHeader from '@/photo/PhotoHeader';
import {
  AI_CONTENT_GENERATION_ENABLED,
} from '@/app/config';
import { getAppText } from '@/i18n/state/server';
import { Album, albumHasMeta, descriptionForAlbumPhotos } from '.';
import { safelyParseFormattedHtml } from '@/utility/html';
import PhotoAlbum from './PhotoAlbum';
import MaskedScroll from '@/components/MaskedScroll';
import PlaceEntity from '@/place/PlaceEntity';

export default async function AlbumHeader({
  album,
  photos,
  selectedPhoto,
  indexNumber,
  count,
  dateRange,
  showAlbumMeta,
}: {
  album: Album
  photos: Photo[]
  selectedPhoto?: Photo
  indexNumber?: number
  count?: number
  dateRange?: PhotoDateRangePostgres
  showAlbumMeta?: boolean
}) {
  const appText = await getAppText();

  return (
    <PhotoHeader
      album={album}
      entity={<PhotoAlbum
        album={album}
        contrast="high"
        hoverType="none"
        showAdminMenu
      />}
      entityDescription={descriptionForAlbumPhotos(
        photos,
        appText,
        undefined,
        count,
      )}
      photos={photos}
      selectedPhoto={selectedPhoto}
      indexNumber={indexNumber}
      count={count}
      dateRange={dateRange}
      richContent={showAlbumMeta && albumHasMeta(album)
        ? <div className="space-y-2">
          {album.subhead &&
            <div className="text-medium mb-6 uppercase font-medium">
              {album.subhead}
            </div>}
          {album.location &&
            <MaskedScroll
              className="whitespace-nowrap space-x-1.5"
              direction="horizontal"
            >
              {album.location &&
                <PlaceEntity
                  place={album.location}
                  className="translate-x-[-2px] mr-1.5!"
                />}
            </MaskedScroll>}
          {album.description &&
            <div
              className="text-medium [&>a]:underline"
              dangerouslySetInnerHTML={{
                __html: safelyParseFormattedHtml(album.description),
              }}
            />}
        </div>
        : undefined}
      hasAiContentGeneration={AI_CONTENT_GENERATION_ENABLED}
      includeShareButton
    />
  );
}
