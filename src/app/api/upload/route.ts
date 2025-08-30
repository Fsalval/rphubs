import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Maneja la subida (puedes dejarlo vacío por ahora)
  return NextResponse.json({ message: 'Upload API is working' });
}
