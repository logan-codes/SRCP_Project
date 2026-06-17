module.exports = {
  apps: [
    {
      name: 'sarc-backend',
      script: './server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enables clustering for horizontal scaling
      env: {
        NODE_ENV: 'production',
        // Optional: you can set connection_limit here if you prefer
        // DATABASE_URL: "postgresql://user:pass@localhost:5432/db?connection_limit=20"
      },
      env_development: {
        NODE_ENV: 'development',
      }
    }
  ]
};
