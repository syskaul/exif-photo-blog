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
  return (
    <AdminBatchEditPanelClient {...{
      uniqueAlbums,
      onBatchActionComplete,
    }} />
  );
}
