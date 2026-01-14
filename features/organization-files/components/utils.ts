import {
	DocumentSource,
	type GeneralFile,
	type GoogleDriveFile,
} from "#/types/notebook";

export const getIsGoogleDriveFile = (
	file: GeneralFile | GoogleDriveFile,
): file is GoogleDriveFile => {
	return (
		file.document_source === DocumentSource.GOOGLE_DRIVE ||
		("google_drive_url" in file && !!file.google_drive_url)
	);
};
