import IconHidden from '@/components/icons/IconHidden';
import { PhotoFormData } from '../form';
import { SelectMenuOptionType } from '@/components/SelectMenuOption';
import { Photo } from '..';
import { AppTextState } from '@/i18n/state';

export type VisibilityValue = 'default' | 'exclude';

export const getVisibilityOptions = (
  appText: AppTextState,
): (SelectMenuOptionType<VisibilityValue> & { label: string })[] => [
  {
    value: 'default',
    accessoryStart: <IconHidden size={18} visible />,
    label: appText.admin.visibilityDefault,
    note: appText.admin.visibilityDefaultNote,
  },
  {
    value: 'exclude',
    accessoryStart: <IconHidden size={18} />,
    label: appText.admin.visibilityExclude,
    note: appText.admin.visibilityExcludeNote,
  },
];

export const getVisibilityLabel = (
  appText: AppTextState,
  value?: VisibilityValue | '',
) => getVisibilityOptions(appText)
  .find(({ value: v }) => v === value)
  ?.label;

export const getVisibilityValue = (
  formData: Partial<PhotoFormData>,
): VisibilityValue =>
  formData.excludeFromFeeds === 'true' ? 'exclude' : 'default';

export const updateFormDataWithVisibility = (
  formData: Partial<PhotoFormData>,
  value: VisibilityValue,
): Partial<PhotoFormData> => {
  return {
    ...formData,
    excludeFromFeeds: value === 'exclude' ? 'true' : 'false',
  };
};

export const didVisibilityChange = (
  original: Partial<PhotoFormData>,
  current: Partial<PhotoFormData>,
) => getVisibilityValue(original) !== getVisibilityValue(current);

export const getVisibilityFromPhoto = (photo: Photo): VisibilityValue =>
  photo.excludeFromFeeds ? 'exclude' : 'default';

export const doesPhotoHaveDefaultVisibility = (photo: Photo) =>
  getVisibilityFromPhoto(photo) === 'default';
