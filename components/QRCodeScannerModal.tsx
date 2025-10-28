import React, { useEffect, useRef } from 'react';

declare const Html5QrcodeScanner: any;

interface QRCodeScannerModalProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (scannerRef.current) {
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.8);
            return {
                width: qrboxSize,
                height: qrboxSize,
            };
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // 0 for camera
      },
      /* verbose= */ false
    );

    const onScanSuccessCb = (decodedText: string, decodedResult: any) => {
      onScanSuccess(decodedText);
    };

    const onScanFailure = (error: string) => {
      // console.warn(`QR code scan error: ${error}`);
      // Failures are ignored to allow continuous scanning
    };

    scanner.render(onScanSuccessCb, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: any) => {
          console.error("Failed to clear scanner on cleanup", error);
        });
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg m-4 transform transition-all" 
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="scanner-modal-title" className="text-2xl font-bold text-gray-800 mb-4 pb-4 border-b border-gray-300">
          処方箋のQRコードを読み取る
        </h2>
        <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100" id="reader"></div>
        <div className="flex justify-end pt-6">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 text-lg font-bold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerModal;