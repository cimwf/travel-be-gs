import COS from 'cos-js-sdk-v5';
import { callCloudFunction } from './cloudbase';

export interface OfficialMedia {
  key: string;
  url: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
}

interface UploadSession {
  success: boolean;
  error?: string;
  sessionId: string;
  bucket: string;
  region: string;
  baseUrl: string;
  uploadItems: Array<{ index: number; cosKey: string }>;
  credentials: {
    tmpSecretId: string;
    tmpSecretKey: string;
    sessionToken: string;
    startTime: number;
    expiredTime: number;
  };
}

const getImageSize = (file: File) => new Promise<{ width: number; height: number }>((resolve) => {
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => {
    resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
    URL.revokeObjectURL(url);
  };
  image.onerror = () => {
    resolve({ width: 0, height: 0 });
    URL.revokeObjectURL(url);
  };
  image.src = url;
});

export async function uploadOfficialImages(adminId: string, purpose: 'avatar' | 'post', files: File[]) {
  if (!files.length) return { sessionId: '', media: [] as OfficialMedia[] };
  const session = await callCloudFunction<UploadSession>('admin/officialUploadSession', {
    adminId,
    purpose,
    files: files.map((file) => ({ size: file.size, mimeType: file.type })),
  });
  if (!session.success) throw new Error(session.error || '创建 COS 上传会话失败');

  const cos = new COS({
    SecretId: session.credentials.tmpSecretId,
    SecretKey: session.credentials.tmpSecretKey,
    SecurityToken: session.credentials.sessionToken,
    StartTime: session.credentials.startTime,
    ExpiredTime: session.credentials.expiredTime,
  });

  const media = await Promise.all(files.map(async (file, index) => {
    const item = session.uploadItems.find((candidate) => candidate.index === index);
    if (!item) throw new Error('COS 上传地址缺失');
    await new Promise<void>((resolve, reject) => {
      cos.putObject({
        Bucket: session.bucket,
        Region: session.region,
        Key: item.cosKey,
        Body: file,
        ContentType: file.type,
      }, (error) => error ? reject(error) : resolve());
    });
    const dimensions = await getImageSize(file);
    return {
      key: item.cosKey,
      url: `${session.baseUrl.replace(/\/$/, '')}/${item.cosKey}`,
      width: dimensions.width,
      height: dimensions.height,
      size: file.size,
      mimeType: file.type,
    };
  }));
  return { sessionId: session.sessionId, media };
}
