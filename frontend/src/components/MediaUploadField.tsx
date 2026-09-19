import React, { useRef, useState } from "react";
import { AlertCircle, Image as ImageIcon, Loader2, Upload, Video, X } from "lucide-react";

export type MediaUploadKind = "image" | "video" | "mixed";

interface MediaUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  helperText: string;
  accept: string;
  maxBytes: number;
  uploadFile: (file: File) => Promise<{ url: string }>;
  mediaKind: MediaUploadKind;
  error?: string;
  onError?: (message?: string) => void;
  allowLocalPreview?: boolean;
  allowUrlInput?: boolean;
  urlPlaceholder?: string;
  emptyLabel?: string;
  previewAspectRatio?: string;
  showLabel?: boolean;
}

function isVideoUrl(value: string): boolean {
  return /^data:video\//i.test(value) || /\.mp4(?:$|[?#])/i.test(value);
}

function formatLimit(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 1 ? megabytes : bytes / 1024}${megabytes >= 1 ? " MB" : " KB"}`;
}

export function MediaUploadField({
  value,
  onChange,
  label,
  helperText,
  accept,
  maxBytes,
  uploadFile,
  mediaKind,
  error,
  onError,
  allowLocalPreview = false,
  allowUrlInput = false,
  urlPlaceholder = "Paste media URL",
  emptyLabel = "Upload media",
  previewAspectRatio = "16 / 9",
  showLabel = true,
}: MediaUploadFieldProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [internalError, setInternalError] = useState("");
  const displayError = error || internalError;
  const previewKind = mediaKind === "mixed" ? (isVideoUrl(value) ? "video" : "image") : mediaKind;

  const setUploadError = (message?: string) => {
    setInternalError(message || "");
    onError?.(message);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxBytes) {
      setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the ${formatLimit(maxBytes)} limit.`);
      event.target.value = "";
      return;
    }

    const isVideo = file.type.startsWith("video/") || file.name.toLowerCase().endsWith(".mp4");
    if (mediaKind === "image" && !file.type.startsWith("image/")) {
      setUploadError("Only image files are supported.");
      event.target.value = "";
      return;
    }
    if (mediaKind === "video" && (!isVideo || !file.name.toLowerCase().endsWith(".mp4"))) {
      setUploadError("Only MP4 videos are supported.");
      event.target.value = "";
      return;
    }
    if (mediaKind === "mixed" && !file.type.startsWith("image/") && !(isVideo && file.name.toLowerCase().endsWith(".mp4"))) {
      setUploadError("Only image files and MP4 videos are supported.");
      event.target.value = "";
      return;
    }

    setUploadError();
    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      if (!result.url) throw new Error("Upload did not return a media URL");
      onChange(result.url);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed";
      if (allowLocalPreview) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") onChange(reader.result);
        };
        reader.readAsDataURL(file);
      }
      setUploadError(allowLocalPreview ? `${message}; using local preview` : message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#fafafa", border: displayError ? "1px solid #ef4444" : "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
      {showLabel && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{label}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{helperText}</div>
        </div>
      )}

      {isUploading ? (
        <div style={{ padding: "32px 16px", textAlign: "center", background: "#fff", border: "1px dashed var(--portal-purple)", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <Loader2 size={24} className="animate-spin" color="#5f40a1" />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#5f40a1" }}>Uploading to Cloud Storage...</span>
        </div>
      ) : value ? (
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
          <div style={{ width: "160px", aspectRatio: previewAspectRatio, borderRadius: "6px", overflow: "hidden", border: "1px solid #d1d5db", background: "#000", flexShrink: 0 }}>
            {previewKind === "video" ? (
              <video src={value} controls muted loop style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <img src={value} alt={`${label} preview`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{previewKind === "video" ? "MP4 video ready" : "Image ready"}</div>
            <div style={{ fontSize: "11px", color: "var(--portal-muted)", wordBreak: "break-all", marginTop: "4px" }}>
              {value.startsWith("data:") ? "Local preview" : value}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button type="button" onClick={() => inputRef.current?.click()} style={{ padding: "6px 10px", fontSize: "12px", background: "#fff", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Upload size={12} /> Replace
              </button>
              <button type="button" onClick={() => onChange("")} style={{ padding: "6px 10px", fontSize: "12px", background: "#fff", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} style={{ width: "100%", border: "2px dashed #d1d5db", borderRadius: "8px", padding: "28px 16px", textAlign: "center", cursor: "pointer", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          {mediaKind === "video" ? <Video size={22} color="#5f40a1" /> : mediaKind === "image" ? <ImageIcon size={22} color="#5f40a1" /> : <Upload size={22} color="#5f40a1" />}
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{emptyLabel}</span>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>{helperText}</span>
        </button>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={handleUpload} style={{ display: "none" }} />

      {allowUrlInput && (
        <input
          type="url"
          placeholder={urlPlaceholder}
          value={value.startsWith("data:") ? "" : value}
          onChange={(event) => {
            onChange(event.target.value);
            if (displayError) setUploadError();
          }}
          style={{ width: "100%", padding: "7px 10px", border: "1px solid #dcd7e0", borderRadius: "6px", fontSize: "12px" }}
        />
      )}

      {displayError && (
        <div role="alert" style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ef4444", fontSize: "11px" }}>
          <AlertCircle size={12} /> {displayError}
        </div>
      )}
    </div>
  );
}