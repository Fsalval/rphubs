// src/components/ui/image-upload.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImage, resizeImage, validateImageFile } from '@/lib/imageUpload';
import { auth } from '@/lib/firebase';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  variant?: 'avatar' | 'banner' | 'default';
  placeholder?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder = 'characters',
  maxWidth = 800,
  maxHeight = 600,
  variant = 'default',
  placeholder = 'Subir imagen',
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // Validar tipo de archivo
      if (!validateImageFile(file)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG, GIF o WebP.');
      }

      // Redimensionar imagen si es necesario
      const resizedFile = await resizeImage(file, maxWidth, maxHeight);
      
      // Subir imagen
      const userId = auth.currentUser?.uid;
      const imageUrl = await uploadImage(resizedFile, folder, userId);
      
      onChange(imageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir la imagen';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const renderContent = () => {
    if (variant === 'avatar') {
      return (
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={value} />
            <AvatarFallback>
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleClick}
              disabled={disabled || uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {value ? 'Cambiar foto' : 'Subir foto'}
                </>
              )}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (variant === 'banner') {
      return (
        <div className="space-y-4">
          {value ? (
            <div className="relative">
              <div 
                className="h-32 w-full rounded-lg bg-cover bg-center border-2 border-dashed border-muted-foreground"
                style={{ backgroundImage: `url(${value})` }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="absolute top-2 right-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="h-32 w-full rounded-lg border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
              onClick={handleClick}
            >
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{placeholder}</p>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={disabled || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {value ? 'Cambiar banner' : 'Subir banner'}
              </>
            )}
          </Button>
        </div>
      );
    }

    // Variant por defecto
    return (
      <Card>
        <CardContent className="p-6">
          {value ? (
            <div className="space-y-4">
              <div className="relative">
                <Image 
                  src={value} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleClick}
                disabled={disabled || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Cambiar imagen
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={handleClick}
            >
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">{placeholder}</p>
              <p className="text-sm text-muted-foreground">Haz clic para seleccionar una imagen</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-2">
      {renderContent()}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Formatos soportados: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB.
      </p>
    </div>
  );
}
