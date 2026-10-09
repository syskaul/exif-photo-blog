import { Photo } from '@/photo';
import { PhotoSetAttributes, PhotoSetCategory } from '@/category';
import type { SocialKey } from '@/social';
import {
  absolutePathForCameraImage,
  absolutePathForFilmImage,
  absolutePathForFocalLengthImage,
  absolutePathForLensImage,
  absolutePathForPhotoImage,
  absolutePathForQueryImage,
  absolutePathForRecipeImage,
  absolutePathForYearImage,
} from '@/app/path';

export type ShareModalProps = Omit<PhotoSetAttributes, 'photos'> & {
  photo?: Photo
  photos?: Photo[]
} & PhotoSetCategory;

export type ShareMethod =
  | 'copy_link'
  | 'native'
  | Exclude<SocialKey, 'qrcode'>;

export const getSharePathFromShareModalProps = ({
  photo,
  query,
  camera,
  lens,
  recipe,
  film,
  focal,
  year,
}: ShareModalProps) => {
  if (photo) {
    return absolutePathForPhotoImage(photo);
  } else if (query) {
    return absolutePathForQueryImage(query);
  } else if (camera) {
    return absolutePathForCameraImage(camera);
  } else if (lens) {
    return absolutePathForLensImage(lens);
  } else if (recipe) {
    return absolutePathForRecipeImage(recipe);
  } else if (film) {
    return absolutePathForFilmImage(film);
  } else if (focal) {
    return absolutePathForFocalLengthImage(focal);
  } else if (year) {
    return absolutePathForYearImage(year);
  }
};
