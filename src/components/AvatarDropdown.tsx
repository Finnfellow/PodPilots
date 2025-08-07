import React, { useRef, useState, useEffect } from 'react';

interface AvatarDropdownProps {
    avatarUrl?: string | null;
    displayName?: string;
    onLogout: () => void;
}

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({ avatarUrl, displayName, onLogout }) => {
    const [open, setOpen] = useState(false); // visible or not
    const [shouldRender, setShouldRender] = useState(false); // mount control
    const avatarRef = useRef<HTMLDivElement>(null);

    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
                setOpen(false);
                setTimeout(() => setShouldRender(false), 200);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={avatarRef} style={{ position: 'relative' }}>
            <div
                onClick={() => {
                    if (open) {
                        setOpen(false); // start close animation
                        setTimeout(() => setShouldRender(false), 200); // delay unmount
                    } else {
                        setShouldRender(true); // mount
                        setOpen(true);         // start open animation
                    }
                }}
                style={{
                    cursor: 'pointer',
                    backgroundColor: avatarUrl ? 'transparent' : '#000',
                    backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    userSelect: 'none',
                }}
            >
                {!avatarUrl && (displayName ? getInitials(displayName) : 'U')}
            </div>

            {shouldRender && (
                <div className={`avatar-dropdown ${open ? 'dropdown-enter' : 'dropdown-exit'}`}>

                    <button
                        onClick={onLogout}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#333',
                            padding: '0.5rem 1rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            width: '100%',
                            fontFamily: 'Satoshi, sans-serif'
                        }}
                    >
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
};

export default AvatarDropdown;
