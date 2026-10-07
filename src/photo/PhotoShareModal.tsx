import PhotoOGTile from '@/photo/PhotoOGTile';
import { absolutePathForPhoto } from '@/app/path';
import { Photo, titleForPhoto } from '.';
import { PhotoSetCategory } from '../category';
import ShareModal from '@/share/ShareModal';
import { useCallback } from 'react';
import { ShareMethod } from '@/share';
import { useMixpanel } from '@/analytics/MixpanelConsentProvider';

export default function PhotoShareModal(
  props: { photo: Photo } & PhotoSetCategory,
) {
  const { track } = useMixpanel();
  const onShareAction = useCallback((shareMethod: ShareMethod) => {
    track('photo_share_action', {
      photo_id: props.photo.id,
      photo_title: props.photo.title ?? '',
      share_method: shareMethod,
    });
  }, [props.photo, track]);

  return (
    <ShareModal
      pathShare={absolutePathForPhoto(props, true)}
      navigatorTitle={titleForPhoto(props.photo)}
      socialText="Check out this photo"
      onShareAction={onShareAction}
    >
      <PhotoOGTile {...props} />
    </ShareModal>
  );
}
