import { Archive, File, FileCode, FileText, ImageIcon, Music, Video } from "lucide-react";

interface FileTypeIconProps {
  mimetype: string | undefined;
  className?: string;
}

export function FileTypeIcon({ mimetype, className }: FileTypeIconProps) {
  const props = { className };

  if (!mimetype) return <File {...props} />;
  if (mimetype.startsWith("image/")) return <ImageIcon {...props} />;
  if (mimetype === "application/pdf") return <FileText {...props} />;
  if (mimetype.startsWith("video/")) return <Video {...props} />;
  if (mimetype.startsWith("audio/")) return <Music {...props} />;
  if (["application/zip", "application/x-tar", "application/gzip"].includes(mimetype)) return <Archive {...props} />;
  if (mimetype.startsWith("text/")) return <FileCode {...props} />;

  return <File {...props} />;
}
