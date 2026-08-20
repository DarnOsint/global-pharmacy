'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ScanLine, Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [useManual, setUseManual] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) { stopCamera(); return; }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch {
        setError('Camera not available. Use manual input.');
        setUseManual(true);
      }
    };

    startCamera();
    return () => stopCamera();
  }, [isOpen, stopCamera]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
      onClose();
    }
  };

  return (
    <Modal open={isOpen} onClose={() => { stopCamera(); onClose(); }} title="Scan Barcode">
      <div className="space-y-4">
        {!useManual && (
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-1/2 border-2 border-white/50 rounded-lg">
                <div className="w-full h-0.5 bg-red-500 animate-pulse mt-[50%]" />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-yellow-600">{error}</p>}

        <div className="flex gap-2">
          <input
            placeholder="Enter barcode manually..."
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            className="flex-1 h-10 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleManualSubmit}>Lookup</Button>
        </div>

        <div className="flex gap-2 justify-between">
          <Button variant="outline" onClick={() => setUseManual(!useManual)}>
            {useManual ? <><Camera className="w-4 h-4 mr-2" /> Use Camera</> : <><ScanLine className="w-4 h-4 mr-2" /> Manual Input</>}
          </Button>
          <Button variant="outline" onClick={() => { stopCamera(); onClose(); }}><X className="w-4 h-4 mr-2" /> Close</Button>
        </div>
      </div>
    </Modal>
  );
}
