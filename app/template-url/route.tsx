import {
  PROJECT_REPO_OWNER,
  PROJECT_REPO_NAME,
  SITE_DOMAIN_SHORT,
  TEMPLATE_DESCRIPTION,
  TEMPLATE_TITLE,
} from '@/app/config';
import { NextResponse } from 'next/server';

const REQUIRE_ENV_VARS = false;

export function GET() {
  const url = new URL('https://vercel.com/new/clone');

  url.searchParams.set('demo-title', TEMPLATE_TITLE);
  url.searchParams.set('demo-description', TEMPLATE_DESCRIPTION);
  url.searchParams.set('demo-url', `https://${SITE_DOMAIN_SHORT}`);
  url.searchParams.set('demo-description', TEMPLATE_DESCRIPTION);
  url.searchParams.set(
    'demo-image',
    `https://${SITE_DOMAIN_SHORT}/template-image-tight`,
  );
  url.searchParams.set('project-name', TEMPLATE_TITLE);
  url.searchParams.set('repository-name', PROJECT_REPO_NAME);
  url.searchParams.set(
    'repository-url',
    `https://github.com/${PROJECT_REPO_OWNER}/${PROJECT_REPO_NAME}`,
  );
  url.searchParams.set('from', 'templates');
  url.searchParams.set('skippable-integrations', '1');
  if (REQUIRE_ENV_VARS) {
    url.searchParams.set('env-description', 'Configure your photo blog meta');
    url.searchParams.set('env-link', 'BLANK');
    url.searchParams.set('env', [
      'NEXT_PUBLIC_META_TITLE',
    ].join(','));
  }
  url.searchParams.set('teamCreateStatus', 'hidden');
  url.searchParams.set('stores', JSON.stringify([
    { type: 'postgres' },
    { type: 'blob' },
  ]));

  return NextResponse.json(url.toString());
}
