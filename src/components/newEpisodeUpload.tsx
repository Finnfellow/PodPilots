import React, { useState, useRef } from 'react';

interface AudioFile {
    file: File;
    preview: string;
    duration?: string;
    size: string;
    uploadProgress: number;
    status: 'uploading' | 'completed' | 'error';
    id: string;
}

interface EpisodeData {
    title: string;
    description: string;
    tags: string[];
    publishDate: string;
    status: 'draft' | 'scheduled' | 'published';
}

const NewEpisodeUpload: React.FC = () => {
    const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [episodeData, setEpisodeData] = useState<EpisodeData>({
        title: '',
        description: '',
        tags: [],
        publishDate: '',
        status: 'draft'
    });
    const [tagInput, setTagInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getAudioDuration = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
                const minutes = Math.floor(audio.duration / 60);
                const seconds = Math.floor(audio.duration % 60);
                resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                URL.revokeObjectURL(audio.src);
            };
            audio.onerror = () => {
                resolve('Unknown');
                URL.revokeObjectURL(audio.src);
            };
            audio.src = URL.createObjectURL(file);
        });
    };

    const simulateUpload = (fileId: string): Promise<void> => {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setAudioFiles(prev => prev.map(f =>
                        f.id === fileId
                            ? { ...f, uploadProgress: 100, status: 'completed' }
                            : f
                    ));
                    resolve();
                } else {
                    setAudioFiles(prev => prev.map(f =>
                        f.id === fileId
                            ? { ...f, uploadProgress: Math.floor(progress) }
                            : f
                    ));
                }
            }, 200);
        });
    };

    const handleFiles = async (files: FileList) => {
        const validFiles = Array.from(files).filter(file => {
            const isAudio = file.type.startsWith('audio/');
            const isValidSize = file.size <= 500 * 1024 * 1024; // 500MB limit

            if (!isAudio) {
                alert(`${file.name} is not an audio file`);
                return false;
            }
            if (!isValidSize) {
                alert(`${file.name} is too large. Maximum size is 500MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        for (const file of validFiles) {
            const id = Math.random().toString(36).substr(2, 9);
            const preview = URL.createObjectURL(file);
            const duration = await getAudioDuration(file);

            const audioFile: AudioFile = {
                file,
                preview,
                duration,
                size: formatFileSize(file.size),
                uploadProgress: 0,
                status: 'uploading',
                id
            };

            setAudioFiles(prev => [...prev, audioFile]);

            // Start upload simulation
            simulateUpload(id);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
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
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (id: string) => {
        setAudioFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter(f => f.id !== id);
        });
    };

    const retryUpload = (id: string) => {
        setAudioFiles(prev => prev.map(f =>
            f.id === id
                ? { ...f, uploadProgress: 0, status: 'uploading' }
                : f
        ));
        simulateUpload(id);
    };

    const updateEpisodeData = (field: keyof EpisodeData, value: any) => {
        setEpisodeData(prev => ({ ...prev, [field]: value }));
    };

    const addTag = () => {
        if (tagInput.trim() && !episodeData.tags.includes(tagInput.trim())) {
            updateEpisodeData('tags', [...episodeData.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        updateEpisodeData('tags', episodeData.tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = (status: 'draft' | 'scheduled' | 'published') => {
        if (!episodeData.title.trim()) {
            alert('Please enter an episode title');
            return;
        }

        if (audioFiles.length === 0 || !audioFiles.some(f => f.status === 'completed')) {
            alert('Please upload at least one audio file');
            return;
        }

        const episode = {
            ...episodeData,
            status,
            audioFiles: audioFiles.filter(f => f.status === 'completed'),
            createdAt: new Date().toISOString()
        };

        console.log('Saving episode:', episode);
        alert(`Episode ${status === 'draft' ? 'saved as draft' : status === 'scheduled' ? 'scheduled' : 'published'} successfully!`);
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#F8F9FA',
            fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '1000px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2rem'
                }}>
                    <div>
                        <h1 style={{
                            fontFamily: 'Satoshi, sans-serif',
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: '#212529',
                            margin: '0 0 0.5rem 0'
                        }}>
                            Upload New Episode
                        </h1>
                        <p style={{
                            color: '#6C757D',
                            margin: 0,
                            fontSize: '1rem'
                        }}>
                            Add your audio content and episode details
                        </p>
                    </div>
                    <button
                        onClick={() => window.history.back()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'white',
                            color: '#495057',
                            border: '1px solid #CED4DA',
                            borderRadius: '8px',
                            fontFamily: 'Satoshi, sans-serif',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 400px',
                    gap: '2rem'
                }}>
                    {/* Main Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Audio Upload Section */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            border: '1px solid #E8E8E8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <h2 style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#212529',
                                margin: '0 0 1rem 0'
                            }}>
                                Upload Audio Files
                            </h2>

                            {/* Drop Zone */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: dragActive ? '3px dashed #4285F4' : '2px dashed #CED4DA',
                                    borderRadius: '12px',
                                    padding: '3rem 2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: dragActive ? '#F8F9FF' : '#FAFAFA',
                                    transition: 'all 0.3s ease',
                                    marginBottom: '2rem'
                                }}
                            >
                                <div style={{
                                    fontSize: '3rem',
                                    marginBottom: '1rem'
                                }}>
                                    🎵
                                </div>
                                <h3 style={{
                                    fontFamily: 'Satoshi, sans-serif',
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: '#212529',
                                    margin: '0 0 0.5rem 0'
                                }}>
                                    Drag & drop your audio files here
                                </h3>
                                <p style={{
                                    color: '#6C757D',
                                    margin: '0 0 1rem 0',
                                    fontSize: '1rem'
                                }}>
                                    or click to browse your computer
                                </p>
                                <div style={{
                                    fontSize: '0.875rem',
                                    color: '#495057',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '2rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <span>✓ MP3, WAV, M4A, FLAC</span>
                                    <span>✓ Max 500MB per file</span>
                                    <span>✓ Multiple files supported</span>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                multiple
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />

                            {/* Uploaded Files */}
                            {audioFiles.length > 0 && (
                                <div>
                                    <h3 style={{
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: '#212529',
                                        margin: '0 0 1rem 0'
                                    }}>
                                        Uploaded Files ({audioFiles.length})
                                    </h3>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem'
                                    }}>
                                        {audioFiles.map((audioFile) => (
                                            <div
                                                key={audioFile.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '1rem',
                                                    backgroundColor: '#F8F9FA',
                                                    borderRadius: '8px',
                                                    border: '1px solid #E8E8E8'
                                                }}
                                            >
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#4285F4',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: '1rem',
                                                    fontSize: '1.25rem'
                                                }}>
                                                    🎵
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontFamily: 'Satoshi, sans-serif',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600',
                                                        color: '#212529',
                                                        marginBottom: '0.25rem'
                                                    }}>
                                                        {audioFile.file.name}
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '1rem',
                                                        fontSize: '0.8rem',
                                                        color: '#6C757D',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        <span>📏 {audioFile.duration}</span>
                                                        <span>💾 {audioFile.size}</span>
                                                        <span style={{
                                                            color: audioFile.status === 'completed' ? '#1A8C67' :
                                                                audioFile.status === 'error' ? '#DC3545' : '#4285F4'
                                                        }}>
                                                            {audioFile.status === 'uploading' && '⏳ Uploading...'}
                                                            {audioFile.status === 'completed' && '✅ Completed'}
                                                            {audioFile.status === 'error' && '❌ Error'}
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    {audioFile.status === 'uploading' && (
                                                        <div style={{
                                                            width: '100%',
                                                            height: '6px',
                                                            backgroundColor: '#E8E8E8',
                                                            borderRadius: '3px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${audioFile.uploadProgress}%`,
                                                                height: '100%',
                                                                backgroundColor: '#4285F4',
                                                                transition: 'width 0.3s ease'
                                                            }} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    {audioFile.status === 'error' && (
                                                        <button
                                                            onClick={() => retryUpload(audioFile.id)}
                                                            style={{
                                                                padding: '0.5rem',
                                                                backgroundColor: '#4285F4',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem'
                                                            }}
                                                        >
                                                            Retry
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => removeFile(audioFile.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#DC3545',
                                                            cursor: 'pointer',
                                                            fontSize: '1.2rem',
                                                            padding: '0.25rem'
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Episode Details */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            border: '1px solid #E8E8E8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <h2 style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#212529',
                                margin: '0 0 1.5rem 0'
                            }}>
                                Episode Details
                            </h2>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: '#495057',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Episode Title *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter episode title"
                                        value={episodeData.title}
                                        onChange={(e) => updateEpisodeData('title', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid #E8E8E8',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontFamily: 'Satoshi, sans-serif',
                                            backgroundColor: '#FAFAFA',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: '#495057',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Description
                                    </label>
                                    <textarea
                                        placeholder="Write a description for your episode..."
                                        value={episodeData.description}
                                        onChange={(e) => updateEpisodeData('description', e.target.value)}
                                        rows={4}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid #E8E8E8',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontFamily: 'Satoshi, sans-serif',
                                            backgroundColor: '#FAFAFA',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: '#495057',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Tags
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Add tags (press Enter)"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addTag();
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem 1rem',
                                                border: '1px solid #E8E8E8',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                fontFamily: 'Satoshi, sans-serif',
                                                backgroundColor: '#FAFAFA'
                                            }}
                                        />
                                        <button
                                            onClick={addTag}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                backgroundColor: '#4285F4',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontFamily: 'Satoshi, sans-serif',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {episodeData.tags.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.5rem'
                                        }}>
                                            {episodeData.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#4285F4',
                                                        color: 'white',
                                                        borderRadius: '12px',
                                                        fontSize: '0.8rem',
                                                        fontFamily: 'Satoshi, sans-serif'
                                                    }}
                                                >
                                                    {tag}
                                                    <button
                                                        onClick={() => removeTag(tag)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '1rem',
                                                            padding: 0
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                    }}>
                        {/* Publishing Options */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            border: '1px solid #E8E8E8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <h3 style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#212529',
                                margin: '0 0 1rem 0'
                            }}>
                                Publishing
                            </h3>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: '#495057',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Status
                                    </label>
                                    <select
                                        value={episodeData.status}
                                        onChange={(e) => updateEpisodeData('status', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid #E8E8E8',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontFamily: 'Satoshi, sans-serif',
                                            backgroundColor: '#FAFAFA'
                                        }}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>

                                {(episodeData.status === 'scheduled' || episodeData.status === 'published') && (
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontFamily: 'Satoshi, sans-serif',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            color: '#495057',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Publish Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={episodeData.publishDate}
                                            onChange={(e) => updateEpisodeData('publishDate', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: '1px solid #E8E8E8',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                fontFamily: 'Satoshi, sans-serif',
                                                backgroundColor: '#FAFAFA'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            border: '1px solid #E8E8E8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <h3 style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#212529',
                                margin: '0 0 1rem 0'
                            }}>
                                Actions
                            </h3>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                            }}>
                                <button
                                    onClick={() => handleSave('draft')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'white',
                                        color: '#495057',
                                        border: '1px solid #CED4DA',
                                        borderRadius: '8px',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Save as Draft
                                </button>

                                {episodeData.status === 'scheduled' && (
                                    <button
                                        onClick={() => handleSave('scheduled')}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#4285F4',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontFamily: 'Satoshi, sans-serif',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Schedule Episode
                                    </button>
                                )}

                                <button
                                    onClick={() => handleSave('published')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#1A8C67',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Publish Now
                                </button>
                            </div>
                        </div>

                        {/* Upload Progress Summary */}
                        {audioFiles.length > 0 && (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                border: '1px solid #E8E8E8',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                            }}>
                                <h3 style={{
                                    fontFamily: 'Satoshi, sans-serif',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: '#212529',
                                    margin: '0 0 1rem 0'
                                }}>
                                    Upload Summary
                                </h3>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem',
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        <span style={{ color: '#6C757D' }}>Total Files:</span>
                                        <span style={{ fontWeight: '500', color: '#212529' }}>{audioFiles.length}</span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem',
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        <span style={{ color: '#6C757D' }}>Completed:</span>
                                        <span style={{ fontWeight: '500', color: '#1A8C67' }}>
                                            {audioFiles.filter(f => f.status === 'completed').length}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem',
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        <span style={{ color: '#6C757D' }}>Uploading:</span>
                                        <span style={{ fontWeight: '500', color: '#4285F4' }}>
                                            {audioFiles.filter(f => f.status === 'uploading').length}
                                        </span>
                                    </div>

                                    {audioFiles.some(f => f.status === 'error') && (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.875rem',
                                            fontFamily: 'Satoshi, sans-serif'
                                        }}>
                                            <span style={{ color: '#6C757D' }}>Errors:</span>
                                            <span style={{ fontWeight: '500', color: '#DC3545' }}>
                                                {audioFiles.filter(f => f.status === 'error').length}
                                            </span>
                                        </div>
                                    )}

                                    <div style={{
                                        borderTop: '1px solid #E8E8E8',
                                        paddingTop: '0.75rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.875rem',
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        <span style={{ color: '#6C757D' }}>Total Size:</span>
                                        <span style={{ fontWeight: '600', color: '#212529' }}>
                                            {formatFileSize(audioFiles.reduce((total, f) => total + f.file.size, 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        <div style={{
                            backgroundColor: '#F8F9FF',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            border: '1px solid #E8F0FE'
                        }}>
                            <h3 style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#4285F4',
                                margin: '0 0 1rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                💡 Tips for Better Episodes
                            </h3>

                            <ul style={{
                                margin: 0,
                                paddingLeft: '1.25rem',
                                color: '#495057',
                                fontSize: '0.875rem',
                                fontFamily: 'Satoshi, sans-serif',
                                lineHeight: 1.5
                            }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    Use high-quality audio (44.1kHz, 16-bit minimum)
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    Write compelling titles and descriptions
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    Add relevant tags to improve discoverability
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    Consider scheduling releases for consistent timing
                                </li>
                                <li>
                                    Upload cover art for better visual appeal
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                input:focus, textarea:focus, select:focus {
                    outline: none;
                    border-color: #4285F4 !important;
                    background: white !important;
                    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1) !important;
                }

                button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                button:active {
                    transform: translateY(0);
                }

                @media (max-width: 768px) {
                    .grid-container {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default NewEpisodeUpload;