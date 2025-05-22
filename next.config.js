/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Exclude Cloud Functions from the Next.js build
  typescript: {
    // ignoreBuildErrors: true, // Diese Option würde alle TypeScript-Fehler ignorieren, aber wir wollen nur die Firebase Functions ausschließen
  },
  webpack: (config, { isServer }) => {
    // Exclude functions directory from the build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [...(config.watchOptions?.ignored || []), '**/functions/**']
    };
    return config;
  },
  // Ignoriere das functions-Verzeichnis bei der TypeScript-Prüfung
  eslint: {
    ignoreDuringBuilds: true, // Wir ignorieren ESLint-Fehler während des Builds
    dirs: ['src'] // Nur src-Verzeichnis prüfen, functions ausschließen
  }
};

module.exports = nextConfig;
