import { useState } from 'react';
import PassportQRCode from './PassportQRCode';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PassportDisplayProps {
  passportHash: string;
  issuer: string;
  issuedAt: number;
  isRevoked: boolean;
  pType: string;
}

export default function PassportDisplay({
  passportHash,
  issuer,
  issuedAt,
  isRevoked,
  pType
}: PassportDisplayProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Digital Passport', 105, 20, { align: 'center' });
      
      // Add passport details
      doc.setFontSize(12);
      const details = [
        ['Passport Hash:', passportHash],
        ['Issuer:', issuer],
        ['Type:', pType],
        ['Issued At:', new Date(issuedAt * 1000).toLocaleString()],
        ['Status:', isRevoked ? 'Revoked' : 'Active']
      ];
      
      doc.autoTable({
        startY: 30,
        head: [['Field', 'Value']],
        body: details,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      });

      // Add QR code
      const qrElement = document.querySelector('.passport-qr') as HTMLElement;
      if (qrElement) {
        const qrDataUrl = await new Promise<string>((resolve) => {
          const canvas = qrElement.querySelector('canvas');
          if (canvas) {
            resolve(canvas.toDataURL('image/png'));
          }
        });
        
        doc.addImage(qrDataUrl, 'PNG', 70, 120, 70, 70);
      }

      // Add footer
      doc.setFontSize(8);
      doc.text('This is a digitally signed document. Verify authenticity by scanning the QR code.', 105, 200, { align: 'center' });
      
      doc.save('digital-passport.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-8 border border-white/10">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-slate-300">Passport Details</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Hash:</span>
                <span className="text-white font-mono">{passportHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issuer:</span>
                <span className="text-white">{issuer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-white">{pType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issued At:</span>
                <span className="text-white">{new Date(issuedAt * 1000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-medium ${isRevoked ? 'text-red-400' : 'text-green-400'}`}>
                  {isRevoked ? 'Revoked' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className={`
              w-full px-4 py-2 rounded-lg font-medium text-white
              ${isGeneratingPDF 
                ? 'bg-blue-500/50 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
              transition-colors duration-200
            `}
          >
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>

        <div className="flex justify-center items-center">
          <div className="passport-qr">
            <PassportQRCode
              passportHash={passportHash}
              issuer={issuer}
              issuedAt={issuedAt}
              isRevoked={isRevoked}
              pType={pType}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 