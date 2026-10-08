import { Signer } from '@aws-sdk/rds-signer';
import { attachDatabasePool } from '@vercel/functions';
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider';
import {
  HAS_DATABASE,
  POSTGRES_IAM_AUTH_ENABLED,
  POSTGRES_SSL_ENABLED,
} from '@/app/config';
import { removeParamsFromUrl } from '@/utility/url';
import { Pool, QueryResult, QueryResultRow } from 'pg';

const requiredEnvironmentVariable = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const postgresIamPort = () => {
  const port = Number(process.env.PGPORT || 5432);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PGPORT must be a valid port number');
  }
  return port;
};

const getPoolConfiguration = () => {
  if (POSTGRES_IAM_AUTH_ENABLED) {
    const region = requiredEnvironmentVariable('AWS_REGION');
    const roleArn = process.env.AWS_ROLE_ARN;
    const hostname = requiredEnvironmentVariable('PGHOST');
    const username = requiredEnvironmentVariable('PGUSER');
    const port = postgresIamPort();
    const signer = new Signer({
      hostname,
      port,
      username,
      region,
      ...roleArn && {
        credentials: awsCredentialsProvider({
          roleArn,
          clientConfig: { region },
        }),
      },
    });

    return {
      host: hostname,
      port,
      user: username,
      database: process.env.PGDATABASE || 'postgres',
      password: () => signer.getAuthToken(),
      ssl: true,
    };
  }

  return {
    ...process.env.POSTGRES_URL && {
      connectionString: removeParamsFromUrl(
        process.env.POSTGRES_URL,
        ['sslmode'],
      ),
    },
    ...POSTGRES_SSL_ENABLED && { ssl: true },
  };
};

const pool = new Pool(getPoolConfiguration());

if (HAS_DATABASE) {
  attachDatabasePool(pool);
}

export type Primitive = string | number | boolean | undefined | null;

export const query = async <T extends QueryResultRow = any>(
  queryString: string,
  values: Primitive[] = [],
) => {
  const client = await pool.connect();
  let response: QueryResult<T>;
  try {
    response = await client.query<T>(queryString, values);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
  return response;
};

export const sql = <T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) => {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) {
    throw new Error('Invalid template literal argument');
  }

  let result = strings[0] ?? '';

  for (let i = 1; i < strings.length; i++) {
    result += `$${i}${strings[i] ?? ''}`;
  }

  return query<T>(result, values);
};

const isTemplateStringsArray = (
  strings: unknown,
): strings is TemplateStringsArray => {
  return (
    Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw)
  );
};

export const testDatabaseConnection = async () =>
  query('SELECt COUNT(*) FROM pg_stat_user_tables');
