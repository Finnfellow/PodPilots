import React, { useState, useRef } from 'react';

interface ImageUploadProps {
    currentImage?: string | null;
    onImageUpload: (file: File, previewUrl: string) => Promise<void>;
    type: 'avatar' | 'podcast';
    size?: 'sm' | 'md' | 'lg';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
                                                     currentImage,
                                                     onImageUpload,
                                                     type,
                                                     size = 'md'
                                                 }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return { width: '80px', height: '80px', fontSize: '0.75rem' };
            case 'md':
                return { width: '120px', height: '120px', fontSize: '0.875rem' };
            case 'lg':
                return { width: '160px', height: '160px', fontSize: '1rem' };
            default:
                return { width: '120px', height: '120px', fontSize: '0.875rem' };
        }
    };

    const sizeStyles = getSizeStyles();

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size must be less than 5MB');
            return;
        }

        setIsUploading(true);

        try {
            // Create preview URL
            const preview = URL.createObjectURL(file);
            setPreviewUrl(preview);

            // Call the upload handler
            await onImageUpload(file, preview);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
            setPreviewUrl(currentImage || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                    ...sizeStyles,
                    borderRadius: type === 'avatar' ? '50%' : '12px',
                    border: dragActive ? '3px dashed #4285F4' : '2px dashed #CED4DA',
                    backgroundColor: dragActive ? '#F8F9FF' : '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isUploading ? 0.7 : 1
                }}
            >
                {!previewUrl && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#6C757D',
                        textAlign: 'center',
                        padding: '1rem',
                        fontFamily: 'Satoshi, sans-serif',
                        fontSize: sizeStyles.fontSize
                    }}>
                        <span style={{ fontSize: '1.5em' }}>
                            {type === 'avatar' ? '👤' : '🎙️'}
                        </span>
                        <span style={{ fontWeight: '500' }}>
                            {type === 'avatar' ? 'Upload Avatar' : 'Upload Logo'}
                        </span>
                        <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                            Drag & drop or click
                        </span>
                    </div>
                )}

                {previewUrl && !isUploading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        fontFamily: 'Satoshi, sans-serif'
                    }}
                         className="upload-overlay"
                    >
                        Change Image
                    </div>
                )}

                {isUploading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#4285F4',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        fontFamily: 'Satoshi, sans-serif'
                    }}>
                        <div className="spinner">⟳</div>
                        <span>Uploading...</span>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <div style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#6C757D',
                fontFamily: 'Satoshi, sans-serif'
            }}>
                <p style={{ margin: '0 0 0.25rem 0' }}>
                    Supported: JPG, PNG, GIF (max 5MB)
                </p>
                <p style={{ margin: 0 }}>
                    Recommended: {type === 'avatar' ? '400x400px' : '1400x1400px'}
                </p>
            </div>

            <style>{`
                .upload-overlay {
                    opacity: 0 !important;
                }
                
                div:hover .upload-overlay {
                    opacity: 1 !important;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                    font-size: 1.2em;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ImageUpload;