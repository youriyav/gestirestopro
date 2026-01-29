export interface Image {
  id: string;
  url: string;
  filename?: string | null;
  mimeType?: string | null;
  size?: number | null;
  bucket: string;
  objectKey: string;
}