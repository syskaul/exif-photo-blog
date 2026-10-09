import { PhotoQueryOptions } from '@/db';
import { VisibilityValue } from '@/photo/visibility';
import { createContext, Dispatch, SetStateAction, use } from 'react';

export type SelectPhotosState = {
  canCurrentPageSelectPhotos?: boolean
  isSelectingPhotos?: boolean
  isSelectingAllPhotos?: boolean
  startSelectingPhotos?: () => void
  stopSelectingPhotos?: () => void
  shouldShowSelectAll?: boolean
  toggleIsSelectingAllPhotos?: () => void
  selectedPhotoIds?: string[]
  selectAllPhotoOptions?: PhotoQueryOptions
  selectAllCount?: number
  togglePhotoSelection?: (photoId: string) => void
  isPerformingSelectEdit?: boolean
  setIsPerformingSelectEdit?: Dispatch<SetStateAction<boolean>>
  albumTitles?: string
  setAlbumTitles?: Dispatch<SetStateAction<string | undefined>>
  visibility?: VisibilityValue | ''
  setVisibility?: Dispatch<SetStateAction<VisibilityValue | '' | undefined>>
};

export const SelectPhotosContext = createContext<SelectPhotosState>({});

export const useSelectPhotosState = () => use(SelectPhotosContext);
