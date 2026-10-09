'use client';

import { ComponentProps, useMemo, useRef } from 'react';
import {
  getPathComponents,
  PARAM_REDIRECT,
  pathForAdminPhotoEdit,
} from '@/app/path';
import {
  deletePhotoAction,
  replacePhotoStorageAction,
  setPhotoVisibilityAction,
  storeColorDataForPhotoAction,
  syncPhotoAction,
} from '@/photo/actions';
import {
  Photo,
  deleteConfirmationTextForPhoto,
  downloadFileNameForPhoto,
  titleForPhoto,
} from '@/photo';
import { usePathname, useRouter } from 'next/navigation';
import MoreMenu, { MoreMenuSection } from '@/components/more/MoreMenu';
import { renderMenuItemCheck } from '@/components/more/MoreMenuItem';
import { useAppState } from '@/app/AppState';
import { RevalidatePhoto } from '@/photo/InfinitePhotoScroll';
import { MdOutlineFileDownload } from 'react-icons/md';
import { IoMdColorFilter } from 'react-icons/io';
import { FaArrowRight } from 'react-icons/fa6';
import IconGrSync from '@/components/icons/IconGrSync';
import { toastSuccess } from '@/toast';
import ColorDot from '@/photo/color/ColorDot';
import { getKeyColorFromPhoto } from '@/photo/color/client';
import InsightsIndicatorDot from './insights/InsightsIndicatorDot';
import IconEdit from '@/components/icons/IconEdit';
import { photoNeedsToBeUpdated } from '@/photo/update';
import { KEY_COMMANDS } from '@/photo/key-commands';
import { useAppText } from '@/i18n/state/client';
import IconTrash from '@/components/icons/IconTrash';
import IconUpload from '@/components/icons/IconUpload';
import { uploadPhotoFromClient } from '@/photo/storage';
import ImageInput from '@/components/ImageInput';
import { PRESERVE_ORIGINAL_UPLOADS } from '@/app/config';
import IconWarning from '@/components/icons/IconWarning';
import {
  getVisibilityFromPhoto,
  getVisibilityOptions,
} from '@/photo/visibility';

export default function AdminPhotoMenu({
  photo,
  revalidatePhoto,
  showKeyCommands,
  alwaysVisible,
  ...props
}: Omit<ComponentProps<typeof MoreMenu>, 'sections' | 'ariaLabel'> & {
  photo: Photo
  revalidatePhoto?: RevalidatePhoto
  showKeyCommands?: boolean
  alwaysVisible?: boolean
}) {
  const { isUserSignedIn, registerAdminUpdate } = useAppState();

  const appText = useAppText();

  const inputRef = useRef<HTMLInputElement>(null);
  const onUploadFinishRef = useRef<() => void>(null);

  const router = useRouter();

  const path = usePathname();
  const pathComponents = getPathComponents(path);
  const isOnPhotoDetail = pathComponents.photoId === photo.id;
  const shouldRedirectDelete = isOnPhotoDetail;
  const visibility = getVisibilityFromPhoto(photo);

  const sectionMain = useMemo(() => {
    const items: MoreMenuSection['items'] = [{
      label: appText.admin.edit,
      icon: <IconEdit />,
      href: pathForAdminPhotoEdit(photo.id) +
        `?${PARAM_REDIRECT}=${encodeURIComponent(path)}`,
      ...showKeyCommands && { keyCommand: KEY_COMMANDS.edit },
    }];
    items.push({
      label: appText.admin.download,
      icon: <MdOutlineFileDownload
        size={18}
        className="translate-x-[-1.5px]"
      />,
      href: photo.url,
      hrefDownloadName: downloadFileNameForPhoto(photo),
      ...showKeyCommands && { keyCommand: KEY_COMMANDS.download },
    });
    const visibilityOptions = getVisibilityOptions(appText);
    items.push({
      label: appText.admin.setVisibility,
      icon: <span className="block translate-x-[-1px]">{visibilityOptions
        .find(({ value }) => value === visibility)
        ?.accessoryStart}</span>,
      items: visibilityOptions.map(({ value, label, accessoryStart }) => ({
        label,
        // Selected visibility is marked with a check, unselected show its icon
        icon: value === visibility
          ? renderMenuItemCheck(true)
          : accessoryStart,
        action: () => setPhotoVisibilityAction(
          photo.id,
          value,
        )
          .then(() => {
            // Photos leaving a feed shift every subsequent page
            revalidatePhoto?.(photo.id, true);
            // Update photos rendered on the server, which SWR doesn't own
            router.refresh();
          }),
      })),
    });
    const keyColor = getKeyColorFromPhoto(photo);
    items.push({
      label: appText.admin.sync,
      labelComplex: <span className="inline-flex items-center gap-2">
        <span>{appText.admin.sync}</span>
        {photoNeedsToBeUpdated(photo) &&
          <InsightsIndicatorDot
            colorOverride="blue"
            className="ml-1 translate-y-[1.5px]"
            size="small"
          />}
      </span>,
      icon: <IconGrSync
        className="translate-x-[-1px] translate-y-[0.5px]"
      />,
      items: [{
        label: appText.admin.syncAutomatic,
        icon: <IconGrSync
          className="translate-x-[-1px] translate-y-[0.5px]"
        />,
        action: () => syncPhotoAction(photo.id)
          .then(() => revalidatePhoto?.(photo.id)),
      }, {
        label: appText.admin.syncUpdateColor,
        icon: keyColor
          ? <ColorDot
            color={keyColor}
            includeTooltip={false}
            size="medium"
            className="translate-x-[-1px] translate-y-[1px]"
          />
          : <IoMdColorFilter
            size={16}
            className="translate-x-[-1px]  translate-y-[1px]"
          />,
        action: () => storeColorDataForPhotoAction(photo.id, { force: true })
          .then(result => {
            revalidatePhoto?.(photo.id);
            if (result) {
              toastSuccess(
                <span className="inline-flex items-center gap-1.5">
                  {appText.admin.syncUpdateColorSuccess}
                  <ColorDot
                    color={result.oldColor}
                    includeTooltip={false}
                  />
                  <FaArrowRight size={10} className="text-dim" />
                  <ColorDot
                    color={result.newColor}
                    includeTooltip={false}
                  />
                </span>,
              );
            }
          }),
      }, {
        label: appText.admin.syncOverwrite,
        icon: <IconWarning className="translate-x-[-1.5px]" />,
        className: 'text-warning *:hover:text-warning *:active:text-warning',
        color: 'yellow',
        action: () => {
          if(window.confirm(appText.admin.syncOverwriteConfirm)) {
            return syncPhotoAction(photo.id, { syncMode: 'only-missing' })
              .then(() => revalidatePhoto?.(photo.id));
          }
        },
      }],
    });
    items.push({
      label: appText.admin.reupload,
      icon: <IconUpload
        size={16}
        className="translate-x-[-1px] translate-y-px"
      />,
      action: () => new Promise(resolve => {
        onUploadFinishRef.current = resolve;
        if (inputRef.current) {
          inputRef.current.value = '';
          inputRef.current.click();
          inputRef.current.oncancel = () => resolve(false);
        } else {
          resolve();
        }
      }),
    });

    return { items };
  }, [
    path,
    appText,
    photo,
    showKeyCommands,
    visibility,
    revalidatePhoto,
    router,
  ]);

  const sectionDelete: MoreMenuSection = useMemo(() => ({
    items: [{
      label: appText.admin.delete,
      icon: <IconTrash
        className="translate-x-[-1px]"
      />,
      className: 'text-error *:hover:text-error *:active:text-error',
      color: 'red',
      action: () => {
        if (confirm(deleteConfirmationTextForPhoto(photo, appText))) {
          return deletePhotoAction(
            photo.id,
            photo.url,
            shouldRedirectDelete,
          ).then(() => {
            revalidatePhoto?.(photo.id, true);
            registerAdminUpdate?.();
          });
        }
      },
      ...showKeyCommands && {
        keyCommandModifier: KEY_COMMANDS.delete[0],
        keyCommand: KEY_COMMANDS.delete[1],
      },
    }],
  }), [
    appText,
    photo,
    showKeyCommands,
    revalidatePhoto,
    shouldRedirectDelete,
    registerAdminUpdate,
  ]);

  const sections = useMemo(() =>
    [sectionMain, sectionDelete]
  , [sectionMain, sectionDelete]);

  return (
    isUserSignedIn || alwaysVisible
      ? <>
        <MoreMenu {...{
          ...props,
          sections,
          ariaLabel: `Admin menu for '${titleForPhoto(photo)}' photo`,
        }}/>
        <ImageInput
          ref={inputRef}
          id={`admin-photo-file-${photo.id}`}
          multiple={false}
          hidden
          onBlobReady={async ({ blob, extension }) =>
            uploadPhotoFromClient(blob, extension)
              .then(updatedStorageUrl =>
                replacePhotoStorageAction(photo.id, updatedStorageUrl))
              .then(() => revalidatePhoto?.(photo.id))
              .finally(onUploadFinishRef.current)}
          shouldResize={!PRESERVE_ORIGINAL_UPLOADS}
        />
      </>
      : null
  );
}
