import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CUXSNACK Slot Machine',
    short_name: 'CUXSNACK Slot',
    description: 'Drehe die Walzen und gewinne tolle Snack-Preise bei CUXSNACK!',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#FFA500',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
