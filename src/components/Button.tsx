import React from 'react';

export interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
                                           children,
                                           variant = 'primary',
                                           size = 'md',
                                           disabled = false,
                                           loading = false,
                                           fullWidth = false,
                                           onClick,
                                           type = 'button',
                                           className = '',
                                       }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: '#000000',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                };
            case 'secondary':
                return {
                    backgroundColor: 'white',
                    color: '#495057',
                    border: '1.5px solid #CED4DA',
                    boxShadow: 'none',
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    color: '#000000',
                    border: '1.5px solid #000000',
                    boxShadow: 'none',
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    color: '#495057',
                    border: 'none',
                    boxShadow: 'none',
                };
            default:
                return {
                    backgroundColor: '#000000',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                };
            case 'md':
                return {
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                };
            case 'lg':
                return {
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    borderRadius: '8px',
                };
            default:
                return {
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                };
        }
    };

    const getHoverStyles = () => {
        switch (variant) {
            case 'primary':
                return '#333333';
            case 'secondary':
                return '#F8F9FA';
            case 'outline':
                return '#F8F9FA';
            case 'ghost':
                return '#F8F9FA';
            default:
                return '#333333';
        }
    };

    const baseStyles: React.CSSProperties = {
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: '600',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled || loading ? 0.6 : 1,
        textDecoration: 'none',
        userSelect: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
    };

    const handleClick = () => {
        if (!disabled && !loading && onClick) {
            onClick();
        }
    };

    return (
        <>
            <button
                type={type}
                onClick={handleClick}
                disabled={disabled || loading}
                className={`pod-pilot-button ${className}`}
                style={baseStyles}
            >
                {loading && (
                    <span className="loading-spinner">
            ⟳
          </span>
                )}
                {children}
            </button>

            <style>{`
        .pod-pilot-button:hover:not(:disabled) {
          background-color: ${getHoverStyles()} !important;
          transform: translateY(-1px);
        }

        .pod-pilot-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .pod-pilot-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }

        .pod-pilot-button.outline:hover:not(:disabled) {
          background-color: #000000 !important;
          color: white !important;
        }

        .pod-pilot-button.ghost:hover:not(:disabled) {
          background-color: #F8F9FA !important;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          font-size: 1.2em;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
};

export default Button;