

import React, { useRef, useEffect } from 'react';
import useGeminiLive from '../hooks/useGeminiLive';
import type { Transcript } from '../types';

const AssistantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4S8 3.79 8 6v4c0 2.21 1.79 4 4 4zm-1.8-4.5c.22-.57.75-1 1.4-1.15.1-.02.19-.05.29-.05s.19.03.29.05c.65.15 1.18.58 1.4 1.15.08.18.12.38.12.58 0 .66-.54 1.2-1.2 1.2s-1.2-.54-1.2-1.2c0-.2.04-.4.12-.58zM20 12h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6H4c0 4.08 3.05 7.44 7 7.93V22h2v-2.07c3.95-.49 7-3.85 7-7.93z"/>
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);


const MicrophoneIcon: React.FC<{isSessionActive: boolean}> = ({ isSessionActive }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-colors ${isSessionActive ? 'text-red-500' : 'text-white'}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
  </svg>
);


const AIAssistant: React.FC = () => {
  const { isSessionActive, isConnecting, transcripts, startSession, stopSession, error } = useGeminiLive();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Effect to auto-start session if microphone permission is already granted
  useEffect(() => {
    const checkPermissionsAndStart = async () => {
      if (navigator.permissions?.query) {
        try {
          // Use 'microphone' as PermissionName
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permissionStatus.state === 'granted') {
            startSession();
          }
          // If state is 'prompt', wait for user to click.
          // If state is 'denied', user must change settings manually.
        } catch (err) {
          console.error("Could not query microphone permissions:", err);
        }
      }
    };

    checkPermissionsAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSession]); // Depend on the stable startSession function

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const renderTranscript = (transcript: Transcript, index: number) => {
    const isUser = transcript.speaker === 'user';
    return (
      <div key={index} className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
        {!isUser && <div className="flex-shrink-0"><AssistantIcon /></div>}
        <div className={`max-w-xl p-4 rounded-2xl text-lg ${isUser ? 'bg-blue-100 text-blue-900 rounded-br-none' : 'bg-teal-100 text-teal-900 rounded-bl-none'}`}>
          <p>{transcript.text}</p>
        </div>
         {isUser && <div className="flex-shrink-0"><UserIcon /></div>}
      </div>
    );
  };
  
  const handleToggleSession = () => {
      if (isSessionActive) {
          stopSession();
      } else {
          startSession();
      }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg flex flex-col h-full max-h-[80vh] min-h-[500px]">
      <h2 className="text-2xl font-bold text-gray-700 border-b-2 border-teal-500 pb-2 mb-4">
        AIパートナーと話す
      </h2>
      <div className="flex-grow bg-gray-100 rounded-lg p-4 overflow-y-auto mb-4">
         {transcripts.length === 0 && !isConnecting && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xl">下のボタンを押して会話を始めましょう</p>
            <p className="mt-2 text-base">お薬のこと、今日の体調など、なんでも話しかけてください。</p>
          </div>
        )}
        <div className="space-y-4">
          {transcripts.map(renderTranscript)}
           <div ref={transcriptEndRef} />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center pt-4 border-t">
        <button
          onClick={handleToggleSession}
          disabled={isConnecting}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg transform active:scale-90 focus:outline-none focus:ring-4 ${isConnecting ? 'bg-yellow-500 cursor-not-allowed' : isSessionActive ? 'bg-red-200 focus:ring-red-300' : 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-300'}`}
        >
          <MicrophoneIcon isSessionActive={isSessionActive} />
           {isSessionActive && <span className="absolute w-full h-full bg-red-400 rounded-full animate-ping opacity-75"></span>}
        </button>
        <p className="mt-4 text-lg text-gray-600 h-6">
          {isConnecting ? '接続中...' : isSessionActive ? 'マイクオン' : '会話を開始'}
        </p>
         {error && <p className="mt-2 text-base text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default AIAssistant;