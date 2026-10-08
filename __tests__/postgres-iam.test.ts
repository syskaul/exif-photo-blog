import type { PoolConfig } from 'pg';

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
  })),
}));

jest.mock('@aws-sdk/rds-signer', () => ({
  Signer: jest.fn().mockImplementation(() => ({
    getAuthToken: jest.fn().mockResolvedValue('short-lived-token'),
  })),
}));

jest.mock('@vercel/functions', () => ({
  attachDatabasePool: jest.fn(),
}));

jest.mock('@vercel/oidc-aws-credentials-provider', () => ({
  awsCredentialsProvider: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('../src/app/config', () => ({
  HAS_DATABASE: (
    Boolean(process.env.POSTGRES_URL) ||
    process.env.POSTGRES_IAM_AUTH_ENABLED === '1'
  ),
  POSTGRES_IAM_AUTH_ENABLED:
    process.env.POSTGRES_IAM_AUTH_ENABLED === '1',
  POSTGRES_SSL_ENABLED: process.env.DISABLE_POSTGRES_SSL !== '1',
}));

jest.mock('../src/utility/url', () => ({
  removeParamsFromUrl: (url: string) => url.split('?')[0],
}));

const originalEnvironment = process.env;

const loadPostgresModule = () => {
  jest.resetModules();
  return {
    pg: jest.requireMock('pg') as { Pool: jest.Mock },
    signer: jest.requireMock('@aws-sdk/rds-signer') as {
      Signer: jest.Mock
    },
    oidc: jest.requireMock('@vercel/oidc-aws-credentials-provider') as {
      awsCredentialsProvider: jest.Mock
    },
    functions: jest.requireMock('@vercel/functions') as {
      attachDatabasePool: jest.Mock
    },
    postgres: require('../src/platforms/postgres'),
  };
};

describe('Postgres IAM authentication', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnvironment,
      POSTGRES_URL: '',
      POSTGRES_IAM_AUTH_ENABLED: '1',
      AWS_REGION: 'us-east-2',
      AWS_ROLE_ARN: 'arn:aws:iam::123456789012:role/vercel-postgres',
      PGHOST: 'photos.cluster.example.us-east-2.rds.amazonaws.com',
      PGPORT: '5432',
      PGUSER: 'photos_app',
      PGDATABASE: 'photos',
      DISABLE_POSTGRES_SSL: '1',
    };
  });

  afterEach(() => {
    process.env = originalEnvironment;
    jest.clearAllMocks();
  });

  it(
    'generates a fresh token for pool connections and enforces TLS',
    async () => {
      const { pg, signer, oidc, functions } = loadPostgresModule();
      const poolConfig = pg.Pool.mock.calls[0][0] as PoolConfig;

      expect(poolConfig).toEqual(expect.objectContaining({
        host: 'photos.cluster.example.us-east-2.rds.amazonaws.com',
        port: 5432,
        user: 'photos_app',
        database: 'photos',
        ssl: true,
      }));
      expect(await poolConfig.password?.()).toBe('short-lived-token');
      expect(signer.Signer).toHaveBeenCalledWith(expect.objectContaining({
        hostname: 'photos.cluster.example.us-east-2.rds.amazonaws.com',
        port: 5432,
        username: 'photos_app',
        region: 'us-east-2',
      }));
      expect(oidc.awsCredentialsProvider).toHaveBeenCalledWith({
        roleArn: 'arn:aws:iam::123456789012:role/vercel-postgres',
        clientConfig: { region: 'us-east-2' },
      });
      expect(functions.attachDatabasePool).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps password-based POSTGRES_URL connections unchanged', () => {
    process.env.POSTGRES_IAM_AUTH_ENABLED = '0';
    process.env.POSTGRES_URL =
      'postgres://photos_app:secret@db.example.com:5432/photos?sslmode=require';
    process.env.DISABLE_POSTGRES_SSL = '1';

    const { pg, signer, oidc, functions } = loadPostgresModule();
    const poolConfig = pg.Pool.mock.calls[0][0] as PoolConfig;

    expect(poolConfig.connectionString).toBe(
      'postgres://photos_app:secret@db.example.com:5432/photos',
    );
    expect(poolConfig.ssl).toBeUndefined();
    expect(signer.Signer).not.toHaveBeenCalled();
    expect(oidc.awsCredentialsProvider).not.toHaveBeenCalled();
    expect(functions.attachDatabasePool).toHaveBeenCalledTimes(1);
  });

  it('uses the AWS SDK default credential chain without a role ARN', () => {
    delete process.env.AWS_ROLE_ARN;

    const { pg, signer, oidc } = loadPostgresModule();
    const poolConfig = pg.Pool.mock.calls[0][0] as PoolConfig;

    expect(poolConfig.password).toEqual(expect.any(Function));
    expect(signer.Signer).toHaveBeenCalledWith(expect.objectContaining({
      region: 'us-east-2',
      hostname: 'photos.cluster.example.us-east-2.rds.amazonaws.com',
    }));
    expect(signer.Signer.mock.calls[0][0]).not.toHaveProperty('credentials');
    expect(oidc.awsCredentialsProvider).not.toHaveBeenCalled();
  });
});
