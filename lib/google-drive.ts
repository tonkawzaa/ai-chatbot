import { google } from 'googleapis';
import type { GoogleDriveFile } from './types';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

/**
 * Initialize Google Drive client
 */
export function getGoogleDriveClient() {
  // Check if using service account or OAuth
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const serviceAccountKey = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString()
    );
    
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    return google.drive({ version: 'v3', auth });
  } else {
    // OAuth credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
  }
}

/**
 * List all files in the specified Google Drive folder
 */
export async function listFilesInFolder(folderId?: string): Promise<GoogleDriveFile[]> {
  const drive = getGoogleDriveClient();
  const targetFolderId = folderId || FOLDER_ID;

  try {
    const response = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      pageSize: 100,
    });

    return (response.data.files || []) as GoogleDriveFile[];
  } catch (error) {
    console.error('Error listing files from Google Drive:', error);
    throw new Error('Failed to fetch files from Google Drive');
  }
}

/**
 * Download file content from Google Drive
 */
export async function downloadFileContent(fileId: string): Promise<string | Buffer> {
  const drive = getGoogleDriveClient();

  try {
    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error);
    throw new Error(`Failed to download file ${fileId}`);
  }
}

/**
 * Export Google Docs/Sheets/Slides to readable format
 */
export async function exportGoogleDocAsText(fileId: string, mimeType: string): Promise<string> {
  const drive = getGoogleDriveClient();

  // Map Google Workspace MIME types to export formats
  const exportMimeType = mimeType.includes('document')
    ? 'text/plain'
    : mimeType.includes('spreadsheet')
    ? 'text/csv'
    : mimeType.includes('presentation')
    ? 'text/plain'
    : 'text/plain';

  try {
    const response = await drive.files.export(
      {
        fileId,
        mimeType: exportMimeType,
      },
      { responseType: 'text' }
    );

    return response.data as string;
  } catch (error) {
    console.error(`Error exporting Google Doc ${fileId}:`, error);
    throw new Error(`Failed to export Google Doc ${fileId}`);
  }
}
