import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import mixpanel from 'mixpanel-browser';
import MixpanelConsentProvider, {
  useMixpanel,
} from '@/analytics/MixpanelConsentProvider';
import PhotoDetailAnalytics from '@/analytics/PhotoDetailAnalytics';

jest.mock('mixpanel-browser', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    opt_in_tracking: jest.fn(),
    opt_out_tracking: jest.fn(),
    register: jest.fn(),
    track: jest.fn(),
  },
}));

function AnalyticsProbe() {
  const { isReady, openPrivacySettings, track } = useMixpanel();
  return (
    <>
      <span>{isReady ? 'ready' : 'not ready'}</span>
      <button
        type="button"
        onClick={() => track('photo_detail_viewed', {
          photo_id: 'photo-1',
          photo_title: 'Test photo',
          view_context: 'photo',
        })}
      >
        Track photo view
      </button>
      <button type="button" onClick={openPrivacySettings}>
        Open privacy settings
      </button>
    </>
  );
}

const privacyText = {
  analyticsTitle: 'Analytics preferences',
  analyticsDescription: 'Usage analytics requires consent.',
  acceptAnalytics: 'Accept analytics',
  rejectAnalytics: 'Reject',
  closePrivacySettings: 'Close',
  privacySettings: 'Privacy settings',
  analyticsStorageError: 'Consent could not be saved.',
  analyticsInitializationError: 'Analytics could not start.',
};

const renderProvider = () =>
  render(
    <MixpanelConsentProvider privacyText={privacyText}>
      <AnalyticsProbe />
    </MixpanelConsentProvider>,
  );

const originalToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

beforeEach(() => {
  process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-project-token';
  localStorage.clear();
  jest.clearAllMocks();
});

afterAll(() => {
  if (originalToken === undefined) {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  } else {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = originalToken;
  }
});

it(
  'does not track before consent, then records opted-in events',
  async () => {
    renderProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Track photo view' }));
    expect(mixpanel.init).not.toHaveBeenCalled();
    expect(mixpanel.track).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    await waitFor(() => {
      expect(screen.getByText('ready')).toBeTruthy();
    });

    expect(mixpanel.init).toHaveBeenCalledWith(
      'test-project-token',
      expect.objectContaining({
        autocapture: false,
        ip: false,
        opt_out_tracking_by_default: true,
        save_referrer: false,
        skip_first_touch_marketing: true,
        store_google: false,
        stop_utm_persistence: true,
        track_pageview: false,
        property_blacklist: expect.arrayContaining([
          '$current_url',
          '$referrer',
          '$referring_domain',
        ]),
      }),
    );
    expect(mixpanel.opt_in_tracking).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Track photo view' }));
    expect(mixpanel.track).toHaveBeenCalledWith(
      'photo_detail_viewed',
      {
        photo_id: 'photo-1',
        photo_title: 'Test photo',
        view_context: 'photo',
      },
    );

    fireEvent.click(screen.getByRole('button', {
      name: 'Open privacy settings',
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => {
      expect(mixpanel.opt_out_tracking).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Track photo view' }));
    expect(mixpanel.track).toHaveBeenCalledTimes(1);
  },
);

it(
  'tracks a photo-detail view once the visitor accepts analytics',
  async () => {
    render(
      <MixpanelConsentProvider privacyText={privacyText}>
        <PhotoDetailAnalytics
          photoId="photo-2"
          photoTitle="Another photo"
          viewContext="album"
        />
      </MixpanelConsentProvider>,
    );

    expect(mixpanel.track).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    await waitFor(() => {
      expect(mixpanel.track).toHaveBeenCalledTimes(1);
    });

    expect(mixpanel.track).toHaveBeenCalledWith('photo_detail_viewed', {
      photo_id: 'photo-2',
      photo_title: 'Another photo',
      view_context: 'album',
    });
  },
);
