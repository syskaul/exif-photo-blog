import { getUniqueTagsCached } from '@/photo/cache';
import { getAlbumsWithMetaCached } from '@/album/cache';
import AdminBatchEditPanelClient from './AdminBatchEditPanelClient';
import { HAS_DATABASE } from '@/app/config';

export default async function AdminBatchEditPanel({
  onBatchActionComplete,
}: {
  onBatchActionComplete?: () => Promise<void>
}) {
  if (!HAS_DATABASE) { return null; }

  const uniqueAlbums = await getAlbumsWithMetaCached().catch(() => []);
  const uniqueTags = await getUniqueTagsCached().catch(() => []);
  return (
    <AdminBatchEditPanelClient {...{
      uniqueAlbums,
      uniqueTags,
      onBatchActionComplete,
    }} />
  );
}
