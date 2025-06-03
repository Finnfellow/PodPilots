import React, { useState } from 'react';

export interface InputProps {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    label?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    className?: string;
    name?: string;
    id?: string;
    autoComplete?: string;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

const Input: React.FC<InputProps> = ({
                                         type = 'text',
                                         placeholder,
                                         value,
                                         defaultValue,
                                         onChange,
                                         onBlur,
                                         onFocus,
                                         disabled = false,
                                         required = false,
                                         error,
                                         label,
                                         helperText,
                                         size = 'md',
                                         fullWidth = false,
                                         className = '',
                                         name,
                                         id,
                                         autoComplete,
                                         maxLength,
                                         minLength,
                                         pattern,
                                         icon,
                                         iconPosition = 'left',
                                     }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    padding: '0.625rem 1rem',
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                };
            case 'md':
                return {
                    padding: '1rem 1.25rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                };
            case 'lg':
                return {
                    padding: '1.25rem 1.5rem',
                    fontSize: '1rem',
                    borderRadius: '8px',
                };
            default:
                return {
                    padding: '1rem 1.25rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                };
        }
    };

    const getBorderColor = () => {
        if (error) return '#DC3545';
        if (isFocused) return '#4285F4';
        return '#E8E8E8';
    };

    const getBackgroundColor = () => {
        if (disabled) return '#F8F9FA';
        if (isFocused) return 'white';
        return '#FAFAFA';
    };

    const baseInputStyles: React.CSSProperties = {
        width: fullWidth ? '100%' : 'auto',
        border: `1px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        color: disabled ? '#6C757D' : '#212529',
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: '400',
        transition: 'all 0.2s ease',
        outline: 'none',
        boxSizing: 'border-box',
        ...getSizeStyles(),
    };

    const containerStyles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: fullWidth ? '100%' : 'auto',
    };

    const labelStyles: React.CSSProperties = {
        fontFamily: 'Satoshi, sans-serif',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#495057',
        marginBottom: '0.25rem',
    };

    const helperTextStyles: React.CSSProperties = {
        fontFamily: 'Satoshi, sans-serif',
        fontSize: '0.8rem',
        color: error ? '#DC3545' : '#6C757D',
        marginTop: '0.25rem',
    };

    const inputWrapperStyles: React.CSSProperties = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: fullWidth ? '100%' : 'auto',
    };

    const iconStyles: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#6C757D',
        fontSize: '1rem',
        pointerEvents: 'none',
        zIndex: 1,
        ...(iconPosition === 'left' ? { left: '1rem' } : { right: '1rem' }),
    };

    const passwordToggleStyles: React.CSSProperties = {
        position: 'absolute',
        right: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        color: '#6C757D',
        fontSize: '1rem',
        userSelect: 'none',
        zIndex: 2,
    };

    const adjustedInputStyles = {
        ...baseInputStyles,
        ...(icon && iconPosition === 'left' ? { paddingLeft: '2.5rem' } : {}),
        ...(icon && iconPosition === 'right' ? { paddingRight: '2.5rem' } : {}),
        ...(type === 'password' ? { paddingRight: '2.5rem' } : {}),
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (onFocus) onFocus();
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (onBlur) onBlur();
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const inputId = id || name;

    return (
        <>
            <div style={containerStyles} className={`pod-pilot-input-container ${className}`}>
                {label && (
                    <label htmlFor={inputId} style={labelStyles}>
                        {label}
                        {required && <span style={{ color: '#DC3545', marginLeft: '0.25rem' }}>*</span>}
                    </label>
                )}

                <div style={inputWrapperStyles}>
                    {icon && iconPosition === 'left' && (
                        <span style={iconStyles}>
              {icon}
            </span>
                    )}

                    <input
                        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                        id={inputId}
                        name={name}
                        placeholder={placeholder}
                        value={value}
                        defaultValue={defaultValue}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        required={required}
                        autoComplete={autoComplete}
                        maxLength={maxLength}
                        minLength={minLength}
                        pattern={pattern}
                        style={adjustedInputStyles}
                        className="pod-pilot-input"
                    />

                    {type === 'password' && (
                        <span style={passwordToggleStyles} onClick={togglePasswordVisibility}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
                    )}

                    {icon && iconPosition === 'right' && type !== 'password' && (
                        <span style={iconStyles}>
              {icon}
            </span>
                    )}
                </div>

                {(error || helperText) && (
                    <span style={helperTextStyles}>
            {error || helperText}
          </span>
                )}
            </div>

            <style>{`
        .pod-pilot-input:focus {
          border-color: #4285F4;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
        }

        .pod-pilot-input::placeholder {
          color: #6C757D;
          font-weight: 400;
        }

        .pod-pilot-input:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .pod-pilot-input:disabled::placeholder {
          color: #ADB5BD;
        }

        /* Remove autofill yellow background */
        .pod-pilot-input:-webkit-autofill,
        .pod-pilot-input:-webkit-autofill:hover,
        .pod-pilot-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #212529 !important;
        }

        /* Hide password reveal button in Edge/IE */
        .pod-pilot-input::-ms-reveal,
        .pod-pilot-input::-ms-clear {
          display: none;
        }

        /* Hide number input spinners */
        .pod-pilot-input[type="number"]::-webkit-outer-spin-button,
        .pod-pilot-input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .pod-pilot-input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
        </>
    );
};

export default Input;