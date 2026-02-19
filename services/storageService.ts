
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from 'firebase/storage';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validates the file type and size.
 * @param file The file to validate.
 * @returns An error message string if invalid, otherwise null.
 */
const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return `Invalid file type (${file.type}). Please upload a JPEG, PNG, or WebP image.`;
    }
    if (file.size > MAX_FILE_SIZE) {
        return 'File is too large. Maximum size is 5MB.';
    }
    return null;
};

/**
 * Uploads an image file to Firebase Storage for the chat.
 *
 * @param file The image file to upload.
 * @param userUID The UID of the authenticated user.
 * @param onProgress A callback function to track upload progress (0-100).
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadChatImage = (
    file: File,
    userUID: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const validationError = validateFile(file);
        if (validationError) {
            return reject(new Error(validationError));
        }

        const filePath = `chat-uploads/${userUID}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error("Firebase Storage upload failed:", error);
                reject(new Error('Upload failed. Please try again.'));
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('Upload successful to Firebase. URL:', downloadURL);
                    resolve(downloadURL);
                } catch (error) {
                    console.error("Failed to get download URL:", error);
                    reject(new Error('Could not retrieve file URL after upload.'));
                }
            }
        );
    });
};
