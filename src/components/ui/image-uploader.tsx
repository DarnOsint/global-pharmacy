'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { processProductImage } from '@/lib/image-utils';
import { ImagePlus, X } from 'lucide-react';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  previewSize?: string;
}

export function ImageUploader({ value, onChange, label = 'Product Photo', previewSize = 'h-40' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const dataUrl = await processProductImage(file);
      onChange(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process the image.');
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {value ? (
        <div className="flex items-start gap-3">
          <img src={value} alt="Product" className={`${previewSize} w-40 object-cover rounded-lg border border-border bg-muted`} />
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => inputRef.current?.click()} disabled={processing}>
              <ImagePlus className="w-4 h-4 mr-1.5" />
              {processing ? 'Processing...' : 'Replace Photo'}
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => onChange(null)}>
              <X className="w-4 h-4 mr-1.5" />
              Remove Photo
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/50 transition-colors py-6 text-sm text-muted-foreground"
        >
          <ImagePlus className="w-7 h-7 mb-2" />
          {processing ? 'Processing image...' : 'Click to upload a photo'}
          <span className="text-xs text-muted-foreground mt-1">JPG or PNG — resized automatically for offline use</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}