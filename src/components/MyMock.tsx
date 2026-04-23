import { useCallback, useRef, useState } from 'react';
import { Upload, ImageOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { fileToStoredDataURL } from '../lib/imageCompress';

const IMG_KEY = 'draft-dashboard:my-mock:image:v1';
const NOTES_KEY = 'draft-dashboard:my-mock:notes:v1';

export function MyMock() {
  const [image, setImage, clearImage] = useLocalStorage<string | null>(IMG_KEY, null);
  const [notes, setNotes] = useLocalStorage<string>(NOTES_KEY, '');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('That file does not look like an image.');
      return;
    }
    try {
      const dataURL = await fileToStoredDataURL(file);
      setImage(dataURL);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('quota')) {
        setError('Browser storage is full. Try a smaller screenshot or clear the current image first.');
      } else {
        setError(`Failed to save image: ${msg}`);
      }
    }
  }, [setImage]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="hdr text-2xl">My Mock</h2>
          <p className="text-mute text-sm mt-1">Drop a screenshot of your mock-draft simulator run. Image + notes persist locally.</p>
        </div>
        {image && (
          <div className="flex items-center gap-2">
            <button onClick={() => inputRef.current?.click()} className="btn">
              <RefreshCw size={14} /> Replace
            </button>
            <button onClick={() => { clearImage(); setError(null); }} className="btn-danger">
              <ImageOff size={14} /> Clear
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="panel border-danger/60 bg-danger/10 p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className="text-danger" />
          <span>{error}</span>
        </div>
      )}

      {!image ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={[
            'panel flex flex-col items-center justify-center text-center py-20 cursor-pointer border-dashed',
            dragging ? 'border-accent bg-accent/5' : 'border-edge hover:border-accent/60',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
          <Upload size={36} className="text-mute mb-3" strokeWidth={1.5} />
          <div className="hdr text-lg mb-1">Drop a Screenshot</div>
          <p className="text-mute text-sm">or click to browse — PNG / JPG / WebP</p>
          <p className="mono text-[11px] text-mute mt-3">Files &gt; 1MB are resized to 1600px wide before storage</p>
        </label>
      ) : (
        <div className="panel">
          <div className="border-b border-edge px-4 py-2 flex items-center justify-between">
            <span className="hdr text-sm tracking-widest">Mock Screenshot</span>
            <span className="mono text-[11px] text-mute">{estimateKB(image)} KB</span>
          </div>
          <img src={image} alt="Mock draft screenshot" className="w-full h-auto block" />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </div>
      )}

      <div className="panel">
        <div className="border-b border-edge px-4 py-2">
          <span className="hdr text-sm tracking-widest">Notes</span>
          <span className="mono text-[11px] text-mute ml-2">autosaves</span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="What did the sim give you? What trades did you make? Observations, second-guesses, pivots…"
          className="w-full bg-card p-4 text-ink outline-none resize-y placeholder-mute"
        />
      </div>
    </div>
  );
}

function estimateKB(dataURL: string) {
  // data:<mime>;base64,<payload> — payload bytes ≈ 3/4 of base64 length
  const comma = dataURL.indexOf(',');
  const payload = comma === -1 ? dataURL : dataURL.slice(comma + 1);
  const bytes = Math.floor(payload.length * 0.75);
  return Math.round(bytes / 1024);
}
