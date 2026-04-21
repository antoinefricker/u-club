import camelcaseKeys from 'camelcase-keys';
import { snakeCase } from 'change-case';
import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  wrapIdentifier: (value, origImpl) =>
    origImpl(value === '*' ? value : snakeCase(value)),
  postProcessResponse: (result) => {
    if (Array.isArray(result)) {
      return result.map((row) =>
        row && typeof row === 'object'
          ? camelcaseKeys(row as Record<string, unknown>, { deep: true })
          : row,
      );
    }
    if (result && typeof result === 'object') {
      return camelcaseKeys(result as Record<string, unknown>, { deep: true });
    }
    return result;
  },
});

export default db;
