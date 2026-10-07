'use client';

import { useEffect, useRef } from 'react';
import { useMixpanel } from './MixpanelConsentProvider';

export default function PhotoDetailAnalytics({
  photoId,
  photoTitle,
  viewContext,
}: {
  photoId: string
  photoTitle: string
  viewContext: string
}) {
  const { isReady, track } = useMixpanel();
  const lastTrackedView = useRef<string | undefined>(undefined);

  useEffect(() => {
    const viewKey = `${photoId}:${viewContext}`;
    if (!isReady || lastTrackedView.current === viewKey) { return; }

    lastTrackedView.current = viewKey;
    track('photo_detail_viewed', {
      photo_id: photoId,
      photo_title: photoTitle,
      view_context: viewContext,
    });
  }, [isReady, photoId, photoTitle, track, viewContext]);

  return null;
}
