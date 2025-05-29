import { QRCodeSVG } from 'qrcode.react';

interface PassportQRCodeProps {
  passportHash: string;
  issuer: string;
  issuedAt: number;
  isRevoked: boolean;
  pType: string;
}

export default function PassportQRCode({ 
  passportHash, 
  issuer, 
  issuedAt, 
  isRevoked,
  pType 
}: PassportQRCodeProps) {
  // Create a secure data object with all passport information
  const passportData = {
    hash: passportHash,
    issuer: issuer,
    issuedAt: issuedAt,
    status: isRevoked ? 'revoked' : 'active',
    type: pType,
    // Add a timestamp to prevent QR code caching
    timestamp: Date.now()
  };

  // Convert to JSON string
  const qrValue = JSON.stringify(passportData);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="p-4 bg-white rounded-lg">
        <QRCodeSVG
          value={qrValue}
          size={200}
          level="H" // Highest error correction level
          includeMargin={true}
          imageSettings={{
            src: "/logo2.svg",
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>
      <div className="text-center">
        <p className="text-sm text-slate-400">Scan to verify passport</p>
        <p className="text-xs text-slate-500 mt-1">Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
} 