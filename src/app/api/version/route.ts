import { APP_VERSION } from '@/app/version';
import { NextResponse } from 'next/server';

export async function GET() {
  // Setze Cache-Header auf "no-store", damit dieser Endpunkt nie gecacht wird
  return NextResponse.json(
    { version: APP_VERSION },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
