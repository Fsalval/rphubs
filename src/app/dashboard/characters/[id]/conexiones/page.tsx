'use client';



import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConexionesRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/characters/${id}/ficha/conexiones`);
}
