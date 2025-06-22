import React, { useRef, useState, useEffect } from 'react';

interface ImageUploadProps {
    currentImage?: string;
    onImageUpload: (file: File) => Promise<void>;
    type: 'avatar' | 'podcast';
    size?: 'sm' | 'md' | 'lg';
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageUpload, type, size }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | undefined>(currentImage);

    const sizePx = {
        sm: 80,
        md: 120,
        lg: 160,
    }[size || 'md'];

    useEffect(() => {
        setPreviewImage(currentImage);
    }, [currentImage]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError(null); // Clear previous error
            // Show immediate preview using temporary URL
            const tempUrl = URL.createObjectURL(file);
            setPreviewImage(tempUrl);

            setLoading(true);
            try {
                await onImageUpload(file);
            } catch (uploadError: any) {
                setError(uploadError?.message || 'Upload failed');
                setPreviewImage(currentImage); // Revert preview on error
            } finally {
                setLoading(false);
                URL.revokeObjectURL(tempUrl); // Clean up memory
            }
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <img
                src={previewImage || '/placeholder.png'}
                alt={`${type} preview`}
                style={{
                    width: sizePx,
                    height: sizePx,
                    borderRadius: type === 'avatar' ? '50%' : '8px',
                    objectFit: 'cover',
                    border: '1px solid #ccc',
                }}
            />
            <div>
                <button
                    onClick={triggerFileSelect}
                    style={{ marginTop: '0.5rem' }}
                    disabled={loading}
                    aria-label={`Upload ${type} image`}
                >
                    {loading ? 'Uploading...' : `Upload ${type}`}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                />
            </div>
            {error && (
                <p style={{ color: 'red', marginTop: '0.5rem' }} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default ImageUpload;
