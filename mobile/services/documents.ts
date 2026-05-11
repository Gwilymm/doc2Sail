import { API_BASE_URL, getToken, refreshJwt } from './api';

export const DOCUMENT_CATEGORIES = [
  'AC',
  'IC',
  'Modifications',
  'Gestion de course',
  'Jury',
  'Résultats',
] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
] as const;

export const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024;

type UploadDocumentInput = {
  regattaId: string;
  uri: string;
  name: string;
  type: string;
  webFile?: unknown;
  size?: number | null;
  title: string;
  category: string;
  description?: string;
  onProgress?: (progress: number) => void;
};

export function isAllowedDocumentType(mimeType?: string | null): boolean {
  return !!mimeType && ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType as typeof ALLOWED_DOCUMENT_MIME_TYPES[number]);
}

export async function uploadDocument(input: UploadDocumentInput): Promise<void> {
  const token = await getToken();
  const formData = new FormData();
  const uploadFile = input.webFile ?? {
    uri: input.uri,
    name: input.name,
    type: input.type,
  };

  formData.append('file', uploadFile as any);
  formData.append('regattaId', input.regattaId);
  formData.append('name', input.title);
  formData.append('category', input.category);
  if (input.description?.trim()) {
    formData.append('description', input.description.trim());
  }

  const send = (authToken: string | null, canRetry: boolean) => new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/api/documents`);
    xhr.setRequestHeader('Accept', 'application/ld+json');
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && input.onProgress) {
        input.onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress?.(1);
        resolve();
        return;
      }

      if (xhr.status === 401 && canRetry) {
        const refreshedToken = await refreshJwt();
        if (refreshedToken) {
          try {
            await send(refreshedToken, false);
            resolve();
          } catch (e) {
            reject(e);
          }
          return;
        }
      }

      try {
        const payload = JSON.parse(xhr.responseText);
        reject(new Error(payload.error ?? payload.detail ?? 'Upload impossible'));
      } catch {
        reject(new Error('Upload impossible'));
      }
    };

    xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload"));
    xhr.ontimeout = () => reject(new Error('Upload expiré'));
    xhr.timeout = 120000;
    xhr.send(formData);
  });

  await send(token, true);
}
