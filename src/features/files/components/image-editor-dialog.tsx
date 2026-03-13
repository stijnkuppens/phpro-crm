'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';

type ImageEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  fileName: string;
  onSave: (blob: Blob) => Promise<void>;
};

const ASPECT_OPTIONS = [
  { label: 'Free', value: 'free' },
  { label: '1:1', value: '1' },
  { label: '4:3', value: '4/3' },
  { label: '16:9', value: '16/9' },
  { label: '3:2', value: '3/2' },
] as const;

function parseAspect(value: string): number | undefined {
  if (value === 'free') return undefined;
  if (value.includes('/')) {
    const [w, h] = value.split('/').map(Number);
    return w / h;
  }
  return Number(value);
}

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  outputWidth?: number,
  outputHeight?: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const srcX = crop.x * scaleX;
  const srcY = crop.y * scaleY;
  const srcW = crop.width * scaleX;
  const srcH = crop.height * scaleY;

  const cropAspect = srcW / srcH;
  let outW: number;
  let outH: number;

  if (outputWidth && outputHeight) {
    outW = outputWidth;
    outH = outputHeight;
  } else if (outputWidth) {
    outW = outputWidth;
    outH = Math.round(outputWidth / cropAspect);
  } else if (outputHeight) {
    outH = outputHeight;
    outW = Math.round(outputHeight * cropAspect);
  } else {
    outW = srcW;
    outH = srcH;
  }

  // Handle rotation: swap canvas dimensions for 90/270
  const isRotated = rotation % 180 !== 0;
  canvas.width = isRotated ? outH : outW;
  canvas.height = isRotated ? outW : outH;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(image, srcX, srcY, srcW, srcH, -outW / 2, -outH / 2, outW, outH);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/png',
    );
  });
}

export function ImageEditorDialog({
  open,
  onOpenChange,
  src,
  fileName,
  onSave,
}: ImageEditorDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspectValue, setAspectValue] = useState('free');
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [resizeW, setResizeW] = useState('');
  const [resizeH, setResizeH] = useState('');
  const [saving, setSaving] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [localSrc, setLocalSrc] = useState<string | null>(null);

  const aspect = parseAspect(aspectValue);

  // Fetch image as blob to avoid CORS-tainted canvas
  useEffect(() => {
    if (!open || !src) {
      setLocalSrc(null);
      return;
    }
    let revoked = false;
    fetch(src)
      .then((r) => r.blob())
      .then((blob) => {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        setLocalSrc(url);
      });
    return () => {
      revoked = true;
      setLocalSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [open, src]);

  // Reset state when dialog opens with new image
  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setAspectValue('free');
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setResizeW('');
      setResizeH('');
    }
  }, [open, src]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
      setNaturalSize({ w: naturalWidth, h: naturalHeight });

      // Start with a centered crop covering 80% of the image
      const initial = centerCrop(
        makeAspectCrop(
          { unit: '%', width: 80 },
          aspect ?? naturalWidth / naturalHeight,
          width,
          height,
        ),
        width,
        height,
      );
      setCrop(initial);
    },
    [aspect],
  );

  const handleAspectChange = useCallback(
    (value: string) => {
      if (!value) return;
      setAspectValue(value);
      const newAspect = parseAspect(value);
      if (newAspect && imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerCrop(
          makeAspectCrop({ unit: '%', width: 80 }, newAspect, width, height),
          width,
          height,
        );
        setCrop(newCrop);
      }
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;
    setSaving(true);
    try {
      const outW = resizeW ? Number(resizeW) : undefined;
      const outH = resizeH ? Number(resizeH) : undefined;
      const blob = await getCroppedBlob(
        imgRef.current,
        completedCrop,
        rotation,
        flipH,
        flipV,
        outW,
        outH,
      );
      await onSave(blob);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }, [completedCrop, rotation, flipH, flipV, resizeW, resizeH, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Image — {fileName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop area */}
          <div className="flex justify-center overflow-hidden rounded-md bg-muted">
            {localSrc ? (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
              >
                <img
                  ref={imgRef}
                  src={localSrc}
                  alt={fileName}
                  onLoad={onImageLoad}
                  className="max-h-[400px]"
                  style={{
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  }}
                />
              </ReactCrop>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Loading image…
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Aspect ratio */}
            <div className="space-y-1.5">
              <Label className="text-xs">Aspect Ratio</Label>
              <ToggleGroup
                value={[aspectValue]}
                onValueChange={(values) => {
                  const next = values.find((v) => v !== aspectValue);
                  if (next) handleAspectChange(next);
                }}
                size="sm"
              >
                {ASPECT_OPTIONS.map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Transform buttons */}
            <div className="space-y-1.5">
              <Label className="text-xs">Transform</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={flipH ? 'secondary' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFlipH((v) => !v)}
                  title="Flip horizontal"
                >
                  <FlipHorizontal className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={flipV ? 'secondary' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFlipV((v) => !v)}
                  title="Flip vertical"
                >
                  <FlipVertical className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Resize */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Resize (px) — original {naturalSize.w}×{naturalSize.h}
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  placeholder="W"
                  value={resizeW}
                  onChange={(e) => {
                    const w = e.target.value;
                    setResizeW(w);
                    if (w && completedCrop && completedCrop.width > 0) {
                      const ratio = completedCrop.height / completedCrop.width;
                      setResizeH(String(Math.round(Number(w) * ratio)));
                    } else {
                      setResizeH('');
                    }
                  }}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-muted-foreground">×</span>
                <Input
                  type="number"
                  placeholder="H"
                  value={resizeH}
                  onChange={(e) => {
                    const h = e.target.value;
                    setResizeH(h);
                    if (h && completedCrop && completedCrop.height > 0) {
                      const ratio = completedCrop.width / completedCrop.height;
                      setResizeW(String(Math.round(Number(h) * ratio)));
                    } else {
                      setResizeW('');
                    }
                  }}
                  className="h-8 w-20 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !completedCrop}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
