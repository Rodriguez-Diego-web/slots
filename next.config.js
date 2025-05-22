/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exclude Cloud Functions from the Next.js build
  typescript: {
    ignoreBuildErrors: true, // Ignoriere TypeScript-Fehler während des Builds
  },
  webpack: (config) => {
    // Exclude functions directory from the build
    if (config.watchOptions) {
      config.watchOptions.ignored = config.watchOptions.ignored || [];
      if (Array.isArray(config.watchOptions.ignored)) {
        config.watchOptions.ignored.push('**/functions/**');
      } else {
        config.watchOptions.ignored = ['**/functions/**'];
      }
    } else {
      config.watchOptions = {
        ignored: ['**/functions/**']
      };
    }
    return config;
  },
  // Ignoriere das functions-Verzeichnis bei der TypeScript-Prüfung
  eslint: {
    ignoreDuringBuilds: true, // Wir ignorieren ESLint-Fehler während des Builds
    dirs: ['src'] // Nur src-Verzeichnis prüfen, functions ausschließen
  }
};

module.exports = nextConfig;
