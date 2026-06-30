import React, { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthSuccessOverlayProps {
    /** 'login' | 'register' — drives copy */
    mode: 'login' | 'register';
    /** Display name of the signed-in user (optional) */
    userName?: string;
    /** Store/brand name */
    storeName?: string;
    /** Milliseconds before auto-close  (default 2400) */
    duration?: number;
    /** Called when overlay finishes (after duration) */
    onDone?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AuthSuccessOverlay: React.FC<AuthSuccessOverlayProps> = ({
    mode,
    userName,
    storeName = 'AURA',
    duration = 2400,
    onDone,
}) => {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const [checkDone, setCheckDone] = useState(false);

    // Animate entrance
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    // Check-mark draw delay
    useEffect(() => {
        const t = setTimeout(() => setCheckDone(true), 250);
        return () => clearTimeout(t);
    }, []);

    // Progress bar fill
    useEffect(() => {
        const step = 16; // ~60fps
        const increment = (step / duration) * 100;
        const id = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(id);
                    return 100;
                }
                return prev + increment;
            });
        }, step);
        return () => clearInterval(id);
    }, [duration]);

    // Auto-close
    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDone?.(), 350); // wait for fade-out
        }, duration);
        return () => clearTimeout(t);
    }, [duration, onDone]);

    const headline =
        mode === 'register'
            ? `Welcome${userName ? `, ${userName.split(' ')[0]}` : ''}! 🎉`
            : `Welcome back${userName ? `, ${userName.split(' ')[0]}` : ''}!`;

    const sub =
        mode === 'register'
            ? 'Your account has been created successfully.'
            : 'You have signed in successfully.';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(28,28,28,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.35s ease',
                padding: '1rem',
            }}
        >
            {/* Card */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: '6px',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
                    width: '100%',
                    maxWidth: '340px',
                    overflow: 'hidden',
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
                    transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                }}
            >
                {/* Progress bar at top */}
                <div style={{ height: '3px', background: '#f1f0ef', position: 'relative' }}>
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${progress}%`,
                            background: '#1C1C1C',
                            transition: 'width 0.016s linear',
                            borderRadius: '0 2px 2px 0',
                        }}
                    />
                </div>

                <div style={{ padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
                    {/* Animated checkmark circle */}
                    <div
                        style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            background: checkDone ? '#1C1C1C' : 'transparent',
                            border: checkDone ? '2px solid #1C1C1C' : '2px solid #d6d3d1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            transition: 'background 0.3s ease, border-color 0.3s ease',
                        }}
                    >
                        <svg
                            viewBox="0 0 52 52"
                            width="34"
                            height="34"
                            style={{ display: 'block', overflow: 'visible' }}
                        >
                            <circle
                                cx="26"
                                cy="26"
                                r="24"
                                fill="none"
                                stroke="transparent"
                                strokeWidth="0"
                            />
                            <polyline
                                points="14,27 22,35 38,18"
                                fill="none"
                                stroke={checkDone ? '#fff' : '#d6d3d1'}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    strokeDasharray: 40,
                                    strokeDashoffset: checkDone ? 0 : 40,
                                    transition: 'stroke-dashoffset 0.4s cubic-bezier(0.22,1,0.36,1) 0.15s, stroke 0.3s ease',
                                }}
                            />
                        </svg>
                    </div>

                    {/* Store badge */}
                    <p
                        style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: '#a8a29e',
                            marginBottom: '6px',
                        }}
                    >
                        {storeName}
                    </p>

                    {/* Headline */}
                    <h2
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 900,
                            color: '#1c1c1c',
                            letterSpacing: '-0.02em',
                            marginBottom: '6px',
                            lineHeight: 1.2,
                        }}
                    >
                        {headline}
                    </h2>

                    {/* Sub */}
                    <p
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#78716c',
                            lineHeight: 1.6,
                            marginBottom: '1.5rem',
                        }}
                    >
                        {sub}
                    </p>

                    {/* Dots pulsing loader */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#1c1c1c',
                                    animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                }}
                            />
                        ))}
                    </div>
                    <p
                        style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#a8a29e',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginTop: '10px',
                        }}
                    >
                        Refreshing…
                    </p>
                </div>
            </div>

            {/* Keyframes injected inline */}
            <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// LogoutLoadingOverlay
// Shown after the user confirms logout — animates out then fires onDone
// ─────────────────────────────────────────────────────────────────────────────

interface LogoutLoadingOverlayProps {
    /** Store / brand name */
    storeName?: string;
    /** Milliseconds before auto-close (default 1600) */
    duration?: number;
    /** Called when the overlay finishes */
    onDone?: () => void;
}

export const LogoutLoadingOverlay: React.FC<LogoutLoadingOverlayProps> = ({
    storeName = 'AURA',
    duration = 1600,
    onDone,
}) => {
    const [visible, setVisible] = useState(false);

    // Animate entrance
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    // Auto-close after duration
    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDone?.(), 320);
        }, duration);
        return () => clearTimeout(t);
    }, [duration, onDone]);

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
                background: 'rgba(28,28,28,0.6)',
                backdropFilter: 'blur(7px)',
                WebkitBackdropFilter: 'blur(7px)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.32s ease',
            }}
        >
            {/* Card */}
            <div
                style={{
                    background: '#1c1c1c',
                    borderRadius: '8px',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                    width: '100%',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.96)',
                    transition: 'transform 0.38s cubic-bezier(0.22,1,0.36,1)',
                    textAlign: 'center',
                    padding: '2.5rem 2rem 2.25rem',
                }}
            >
                {/* Spinning ring */}
                <div
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.12)',
                        borderTopColor: '#ffffff',
                        animation: 'logoutSpin 0.75s linear infinite',
                        margin: '0 auto 1.4rem',
                    }}
                />

                {/* Store badge */}
                <p
                    style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.35)',
                        marginBottom: '6px',
                    }}
                >
                    {storeName}
                </p>

                {/* Headline */}
                <h2
                    style={{
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                        marginBottom: '6px',
                        lineHeight: 1.25,
                    }}
                >
                    Signing out…
                </h2>

                {/* Sub */}
                <p
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.45)',
                        lineHeight: 1.6,
                        marginBottom: 0,
                    }}
                >
                    See you next time!
                </p>
            </div>

            {/* Keyframes */}
            <style>{`
                @keyframes logoutSpin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

