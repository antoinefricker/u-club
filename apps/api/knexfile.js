const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './src/migrations',
    extension: 'ts',
  },
};

export default config;
