import {
  getPhotosMetaCached,
  getPhotosMostRecentUpdateCached,
  getUniqueRecipesCached,
} from '@/photo/cache';
import {
  PATH_ADMIN_ALBUMS,
  PATH_ADMIN_PHOTOS,
  PATH_ADMIN_RECIPES,
  PATH_ADMIN_UPLOADS,
} from '@/app/path';
import AdminNavClient from './AdminNavClient';
import { getAppText } from '@/i18n/state/server';
import { HAS_DATABASE } from '@/app/config';

export default async function AdminNav() {
  let countPhotos = 0;
  let countRecipes = 0;
  let mostRecentPhotoUpdateTime;

  if (HAS_DATABASE) {
    [
      countPhotos,
      countRecipes,
      mostRecentPhotoUpdateTime,
    ] = await Promise.all([
      getPhotosMetaCached()
        .then(({ count }) => count)
        .catch(() => 0),
      getUniqueRecipesCached().then(recipes => recipes.length)
        .catch(() => 0),
      getPhotosMostRecentUpdateCached().catch(() => undefined),
    ]);
  }

  const appText = await getAppText();

  const includeInsights = countPhotos > 0;

  // Photos
  const items = [{
    label: appText.photo.photoPlural,
    href: PATH_ADMIN_PHOTOS,
  }];

  // Uploads
  items.push({
    label: appText.admin.uploadPlural,
    href: PATH_ADMIN_UPLOADS,
  });

  // Albums
  items.push({
    label: appText.category.albumPlural,
    href: PATH_ADMIN_ALBUMS,
  });

  // Recipes
  if (countRecipes > 0) { items.push({
    label: appText.category.recipePlural,
    href: PATH_ADMIN_RECIPES,
  }); }

  return (
    <AdminNavClient {...{
      items,
      mostRecentPhotoUpdateTime,
      includeInsights,
    }} />
  );
}
