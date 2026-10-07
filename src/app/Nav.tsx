import { getPhotosCached } from '@/photo/cache';
import NavClient from './NavClient';
import { HAS_DATABASE, NAV_CAPTION, NAV_TITLE } from './config';

export default async function Nav() {
  const photos = HAS_DATABASE
    ? await getPhotosCached({ limit: 1 }).catch(() => [])
    : [];
  return <NavClient
    navTitle={NAV_TITLE}
    navCaption={NAV_CAPTION}
    isInEmptyState={photos.length === 0}
  />; 
}
