import { useState, useRef, useCallback } from 'react';
// FIX: The `LiveSession` type is not exported by the library. Replaced with `any`.
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import type { Transcript } from '../types';

/**
 * Converts a Float32Array of audio samples to a 16-bit PCM Int16Array.
 * Clamps values to the [-1, 1] range before conversion.
 * @param buffer The input Float32Array.
 * @returns The converted Int16Array.
 */
const pcmFloat32ToInt16 = (buffer: Float32Array): Int16Array => {
    const l = buffer.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Clamp the value to the range [-1, 1] before converting
        const s = Math.max(-1, Math.min(1, buffer[i]));
        // Convert to 16-bit integer, handling positive and negative values correctly
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
};

const useGeminiLive = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [error, setError] = useState<string | null>(null);

    // FIX: The `LiveSession` type is not exported. Using `any` for the session promise.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const cleanup = useCallback(() => {
        setIsSessionActive(false);
        setIsConnecting(false);

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        
        sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
        sessionPromiseRef.current = null;

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const stopSession = useCallback(() => {
        cleanup();
    }, [cleanup]);
    
    const startSession = useCallback(async () => {
        setError(null);
        setIsConnecting(true);
        setTranscripts([]);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY environment variable not set.");
            }
             if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Your browser does not support audio recording.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // FIX: Property 'webkitAudioContext' does not exist on type 'Window'. Cast to any to use vendor prefix for older browser compatibility.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsSessionActive(true);
                        
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const int16Data = pcmFloat32ToInt16(inputData);
                            const pcmBlob = {
                                data: encode(new Uint8Array(int16Data.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                       if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        // FIX: When a turn is complete, update transcripts in a single state update to avoid race conditions with React's batching.
                        // This prevents losing the user's transcript when both user and assistant transcripts are added.
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                        
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        
                            if (fullInput || fullOutput) {
                                setTranscripts(prev => {
                                    const newTranscripts: Transcript[] = [];
                                    if (fullInput) {
                                        newTranscripts.push({ speaker: 'user', text: fullInput });
                                    }
                                    if (fullOutput) {
                                        newTranscripts.push({ speaker: 'assistant', text: fullOutput });
                                    }
                                    return [...prev, ...newTranscripts];
                                });
                            }
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('接続中にエラーが発生しました。');
                        cleanup();
                    },
                    onclose: () => {
                        cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: 'You are a friendly and helpful medication partner for elderly users. Your name is Nondene. Speak in clear, simple, and gentle Japanese. Keep your responses concise. You are not a medical professional and should always advise users to consult their doctor or pharmacist for medical advice.',
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                },
            });

        } catch (e) {
            console.error('Failed to start session:', e);
            const errorMessage = e instanceof Error ? e.message : '不明なエラーが発生しました。';
            setError(`セッションを開始できませんでした: ${errorMessage}`);
            cleanup();
        }
    }, [cleanup]);

    return { isSessionActive, isConnecting, transcripts, startSession, stopSession, error };
};

export default useGeminiLive;