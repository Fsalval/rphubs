// src/lib/cloudinary.ts
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  // Usar un preset unsigned o 'ml_default' que viene por defecto
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    console.error('Cloudinary error:', errorData);
    throw new Error(`Error al subir imagen a Cloudinary: ${errorData.error?.message || 'Error desconocido'}`);
  }

  const data = await res.json();
  return data.secure_url; // URL pública de la imagen
};