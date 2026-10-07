'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { clsx } from 'clsx/lite';
import type { I18N } from '@/i18n';

type ConsentChoice = 'accepted' | 'rejected';
type MixpanelClient = typeof import('mixpanel-browser').default;
export type MixpanelEventName =
  | 'photo_detail_viewed'
  | 'photo_share_action';

interface MixpanelContextValue {
  isReady: boolean
  track: (
    event: MixpanelEventName,
    properties: Record<string, string>,
  ) => void
  openPrivacySettings: () => void
}

const CONSENT_STORAGE_KEY = 'analytics-consent';
const CONSENT_CHANGE_EVENT = 'analytics-consent-change';

type ConsentSnapshot = ConsentChoice | 'storage-error' | null;

const getConsentSnapshot = (): ConsentSnapshot => {
  try {
    const savedChoice = localStorage.getItem(CONSENT_STORAGE_KEY);
    return savedChoice === 'accepted' || savedChoice === 'rejected'
      ? savedChoice
      : null;
  } catch {
    return 'storage-error';
  }
};

const getServerConsentSnapshot = (): ConsentSnapshot => null;
const subscribeToHydration = () => () => {};
const getHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

const MixpanelContext = createContext<MixpanelContextValue | undefined>(
  undefined,
);

export default function MixpanelConsentProvider({
  children,
  privacyText,
}: {
  children: ReactNode
  privacyText: I18N['privacy']
}) {
  const mixpanelRef = useRef<MixpanelClient | null>(null);
  const initializationRef = useRef<Promise<MixpanelClient> | null>(null);
  const [unsavedConsentChoice, setUnsavedConsentChoice] =
    useState<ConsentChoice | null>(null);
  const [readyChoice, setReadyChoice] = useState<ConsentChoice | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initializationFailed, setInitializationFailed] = useState(false);
  const savedConsentChoice = useSyncExternalStore(
    useCallback(onStoreChange => {
      const handleStoreChange = () => {
        setReadyChoice(null);
        onStoreChange();
      };
      window.addEventListener('storage', handleStoreChange);
      window.addEventListener(CONSENT_CHANGE_EVENT, handleStoreChange);
      return () => {
        window.removeEventListener('storage', handleStoreChange);
        window.removeEventListener(CONSENT_CHANGE_EVENT, handleStoreChange);
      };
    }, []),
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const consentChoice = unsavedConsentChoice ?? (
    savedConsentChoice === 'storage-error'
      ? null
      : savedConsentChoice
  );
  const isReady = consentChoice === 'accepted' && readyChoice === 'accepted';

  const initializeMixpanel = useCallback(() => {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token) {
      return Promise.reject(
        new Error('NEXT_PUBLIC_MIXPANEL_TOKEN is not configured.'),
      );
    }

    if (!initializationRef.current) {
      initializationRef.current = import('mixpanel-browser')
        .then(({ default: mixpanel }) => {
          mixpanel.init(token, {
            autocapture: false,
            ip: false,
            opt_out_tracking_by_default: true,
            persistence: 'localStorage',
            property_blacklist: [
              '$current_url',
              '$referrer',
              '$referring_domain',
              '$os',
              '$browser',
              '$browser_version',
              '$device',
              '$screen_height',
              '$screen_width',
              'current_page_title',
              'current_domain',
              'current_url_path',
              'current_url_protocol',
              'current_url_search',
            ],
            save_referrer: false,
            skip_first_touch_marketing: true,
            store_google: false,
            stop_utm_persistence: true,
            track_pageview: false,
          });
          mixpanelRef.current = mixpanel;
          return mixpanel;
        })
        .catch(error => {
          initializationRef.current = null;
          throw error;
        });
    }

    return initializationRef.current;
  }, []);

  useEffect(() => {
    if (consentChoice !== 'accepted') {
      mixpanelRef.current?.opt_out_tracking();
      return;
    }

    let isActive = true;
    initializeMixpanel()
      .then(mixpanel => {
        if (!isActive) { return; }
        mixpanel.opt_in_tracking();
        mixpanel.register({ platform: 'web' });
        setInitializationFailed(false);
        setReadyChoice('accepted');
      })
      .catch(error => {
        console.error(
          'Unable to initialize Mixpanel analytics.',
          error,
        );
        if (isActive) {
          setInitializationFailed(true);
          setReadyChoice(null);
          setIsSettingsOpen(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [consentChoice, initializeMixpanel]);

  const chooseConsent = useCallback((choice: ConsentChoice) => {
    setReadyChoice(null);
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, choice);
      setUnsavedConsentChoice(null);
      window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    } catch (error) {
      console.error(
        'Unable to save analytics consent to local storage.',
        error,
      );
      setUnsavedConsentChoice(choice);
    }
    setIsSettingsOpen(false);
  }, []);

  const openPrivacySettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closePrivacySettings = useCallback(() => {
    if (consentChoice) {
      setIsSettingsOpen(false);
    }
  }, [consentChoice]);

  const track = useCallback<MixpanelContextValue['track']>(
    (event, properties) => {
      if (consentChoice === 'accepted' && isReady) {
        mixpanelRef.current?.track(event, properties);
      }
    },
    [consentChoice, isReady],
  );
  const shouldShowSettings =
    isHydrated && (consentChoice === null || isSettingsOpen);
  const consentStorageFailed =
    savedConsentChoice === 'storage-error' ||
    (unsavedConsentChoice !== null &&
      savedConsentChoice !== unsavedConsentChoice);

  return (
    <MixpanelContext.Provider value={{
      isReady,
      track,
      openPrivacySettings,
    }}>
      {children}
      {shouldShowSettings &&
        <section
          className={clsx(
            'fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl',
            'rounded-xl border border-medium bg-white p-4 shadow-xl',
            'dark:bg-gray-950 sm:p-5',
          )}
          aria-labelledby="analytics-consent-title"
          aria-describedby="analytics-consent-description"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="grow space-y-1">
              <h2
                id="analytics-consent-title"
                className="font-semibold text-medium"
              >
                {privacyText.analyticsTitle}
              </h2>
              <p
                id="analytics-consent-description"
                className="text-sm text-dim"
              >
                {privacyText.analyticsDescription}
              </p>
              {consentStorageFailed &&
                <p
                  role="alert"
                  className="text-sm text-red-700 dark:text-red-300"
                >
                  {privacyText.analyticsStorageError}
                </p>}
              {initializationFailed &&
                <p
                  role="alert"
                  className="text-sm text-red-700 dark:text-red-300"
                >
                  {privacyText.analyticsInitializationError}
                </p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-medium px-3 py-2 text-sm"
                onClick={() => chooseConsent('rejected')}
              >
                {privacyText.rejectAnalytics}
              </button>
              <button
                type="button"
                className={clsx(
                  'rounded-md bg-gray-900 px-3 py-2 text-sm text-white',
                  'dark:bg-white dark:text-gray-900',
                )}
                onClick={() => chooseConsent('accepted')}
              >
                {privacyText.acceptAnalytics}
              </button>
              {consentChoice &&
                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-sm text-dim"
                  onClick={closePrivacySettings}
                >
                  {privacyText.closePrivacySettings}
                </button>}
            </div>
          </div>
        </section>}
      {isHydrated && consentStorageFailed && !shouldShowSettings &&
        <p
          className={clsx(
            'fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl',
            'rounded-lg bg-red-100 p-3 text-sm text-red-900 shadow-lg',
            'dark:bg-red-950 dark:text-red-100',
          )}
          role="alert"
        >
          {privacyText.analyticsStorageError}
        </p>}
    </MixpanelContext.Provider>
  );
}

export const useMixpanel = () => {
  const context = useContext(MixpanelContext);
  if (!context) {
    throw new Error('useMixpanel must be used within MixpanelConsentProvider.');
  }
  return context;
};
