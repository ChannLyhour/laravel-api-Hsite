import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface GenerateQRCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  logoUrl?: string;
}

export const GenerateQRCode: React.FC<GenerateQRCodeProps> = ({
  value,
  size = 200,
  fgColor = '#000000',
  bgColor = '#ffffff',
  logoUrl,
}) => {
  return (
    <QRCodeSVG
      id="store-qr-code-svg"
      value={value}
      size={size}
      fgColor={fgColor}
      bgColor={bgColor}
      level="H" // High error correction to allow central logo
      imageSettings={
        logoUrl
          ? {
              src: logoUrl,
              x: undefined,
              y: undefined,
              height: Math.floor(size * 0.22),
              width: Math.floor(size * 0.22),
              excavate: true,
            }
          : undefined
      }
      className="w-full h-full"
    />
  );
};
