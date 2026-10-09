import {
  getPhotosMeta,
  getUniqueCameras,
  getUniqueFilms,
  getUniqueFocalLengths,
  getUniqueLenses,
  getUniqueRecipes,
  getPhotosInNeedOfUpdateCount,
} from '@/photo/query';
import AdminAppInsightsClient from './AdminAppInsightsClient';
import { getAllInsights, getGitHubMetaForCurrentApp } from '.';
import { APP_CONFIGURATION, USED_DEPRECATED_ENV_VARS } from '@/app/config';

export default async function AdminAppInsights() {
  const [
    { count: photosCount, dateRange },
    photosCountNeedSync,
    { count: photosCountPortrait },
    codeMeta,
    cameras,
    lenses,
    recipes,
    films,
    focalLengths,
  ] = await Promise.all([
    getPhotosMeta(),
    getPhotosInNeedOfUpdateCount(),
    getPhotosMeta({ maximumAspectRatio: 0.9 }),
    getGitHubMetaForCurrentApp(),
    getUniqueCameras(),
    getUniqueLenses(),
    getUniqueRecipes(),
    getUniqueFilms(),
    getUniqueFocalLengths(),
  ]);

  return (
    <AdminAppInsightsClient
      codeMeta={codeMeta}
      nextVersion={APP_CONFIGURATION.nextVersion}
      reactVersion={APP_CONFIGURATION.reactVersion}
      nodeVersion={APP_CONFIGURATION.nodeVersion}
      insights={getAllInsights({
        codeMeta,
        photosCount,
        photosCountNeedSync,
        photosCountPortrait,
      })}
      usedDeprecatedEnvVars={USED_DEPRECATED_ENV_VARS}
      photoStats={{
        photosCount,
        photosCountNeedSync,
        camerasCount: cameras.length,
        lensesCount: lenses.length,
        recipesCount: recipes.length,
        filmsCount: films.length,
        focalLengthsCount: focalLengths.length,
        dateRange,
      }}
    />
  );
}
