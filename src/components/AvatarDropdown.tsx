// AvatarDropdown.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type AvatarDropdownProps = {
    avatarUrl?: string | null;
    displayName: string;
    onLogout: () => void;
};

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({ avatarUrl, displayName, onLogout }) => {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="btn btn-light"
                style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 999 }}
            >
                <img
                    src={avatarUrl || '/default-avatar.png'}
                    alt={displayName}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontWeight: 600 }}>{displayName}</span>
            </button>

            {open && (
                <div className="avatar-dropdown dropdown-enter" onMouseLeave={() => setOpen(false)}>
                    <Link
                        to="/settings"
                        onClick={() => setOpen(false)}
                        className="btn btn-link"
                        style={{ textDecoration: 'none', width: '100%', textAlign: 'left', padding: '6px 8px' }}
                    >
                        ⚙️ Settings
                    </Link>

                    <button
                        type="button"
                        className="btn btn-link"
                        style={{ textDecoration: 'none', width: '100%', textAlign: 'left', padding: '6px 8px', color: '#b42318' }}
                        onClick={() => {
                            onLogout();
                            setOpen(false);
                        }}
                    >
                        🚪 Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default AvatarDropdown;
