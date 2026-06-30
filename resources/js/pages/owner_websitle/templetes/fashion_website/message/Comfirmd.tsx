import React, { useEffect, useState } from 'react';
import { FiLogOut, FiX } from 'react-icons/fi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogoutConfirmProps {
    /** Called when the user confirms they want to sign out */
    onConfirm: () => void;
    /** Called when the user cancels / closes the dialog */
    onCancel: () => void;
    /** Optional display name shown in the dialog */
    userName?: string;
    /** Store / brand name */
    storeName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LogoutConfirm: React.FC<LogoutConfirmProps> = ({
    onConfirm,
    onCancel,
    userName,
    storeName = 'AURA',
}) => {
    const [visible, setVisible] = useState(false);

    // Animate in
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const handleCancel = () => {
        setVisible(false);
        setTimeout(onCancel, 300);
    };

    const handleConfirm = () => {
        setVisible(false);
        setTimeout(onConfirm, 300);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                background: 'rgba(28,28,28,0.45)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.3s ease',
            }}
            onClick={handleCancel}
        >
            {/* Card */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#ffffff',
                    borderRadius: '6px',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
                    width: '100%',
                    maxWidth: '340px',
                    overflow: 'hidden',
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
                    transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
                }}
            >
                {/* Red top accent stripe */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #E61E25, #c5151b)' }} />

                <div style={{ padding: '1.75rem 1.75rem 1.5rem' }}>

                    {/* Close button */}
                    <button
                        onClick={handleCancel}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#a8a29e',
                            transition: 'background 0.2s, color 0.2s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f4';
                            (e.currentTarget as HTMLButtonElement).style.color = '#1c1c1c';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                            (e.currentTarget as HTMLButtonElement).style.color = '#a8a29e';
                        }}
                    >
                        <FiX style={{ width: '14px', height: '14px', strokeWidth: 2.5 }} />
                    </button>

                    {/* Icon circle */}
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.1rem',
                        }}
                    >
                        <FiLogOut
                            style={{
                                width: '22px',
                                height: '22px',
                                color: '#E61E25',
                                strokeWidth: 2.25,
                                transform: 'scaleX(-1)', // arrow points outward
                            }}
                        />
                    </div>

                    {/* Store badge */}
                    <p
                        style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: '#a8a29e',
                            marginBottom: '4px',
                        }}
                    >
                        {storeName}
                    </p>

                    {/* Headline */}
                    <h2
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            color: '#1c1c1c',
                            letterSpacing: '-0.02em',
                            marginBottom: '6px',
                            lineHeight: 1.25,
                        }}
                    >
                        Sign out{userName ? `, ${userName.split(' ')[0]}` : ''}?
                    </h2>

                    {/* Body */}
                    <p
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#78716c',
                            lineHeight: 1.65,
                            marginBottom: '1.5rem',
                        }}
                    >
                        Your cart and wishlist will be saved. You can sign back in anytime.
                    </p>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Cancel */}
                        <button
                            onClick={handleCancel}
                            style={{
                                flex: 1,
                                padding: '11px 0',
                                border: '1.5px solid #e7e5e4',
                                borderRadius: '4px',
                                background: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#1c1c1c',
                                cursor: 'pointer',
                                transition: 'background 0.2s, border-color 0.2s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f4';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
                            }}
                        >
                            Stay
                        </button>

                        {/* Confirm logout */}
                        <button
                            onClick={handleConfirm}
                            style={{
                                flex: 1,
                                padding: '11px 0',
                                border: 'none',
                                borderRadius: '4px',
                                background: '#1c1c1c',
                                fontSize: '11px',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#E61E25';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#1c1c1c';
                            }}
                        >
                            <FiLogOut style={{ width: '12px', height: '12px', strokeWidth: 2.5, transform: 'scaleX(-1)' }} />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
