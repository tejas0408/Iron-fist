/**
 * Browser-native voice assistant using Web Speech API
 * Replaces Vapi with free, built-in browser speech recognition & synthesis
 */

// Web Speech API type declarations (not in default TS lib)
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

type VoiceEventCallback = () => void;
type TranscriptCallback = (transcript: string) => void;
type ErrorCallback = (error: string) => void;

interface VoiceAssistantEvents {
    onListeningStart?: VoiceEventCallback;
    onListeningStop?: VoiceEventCallback;
    onSpeakingStart?: VoiceEventCallback;
    onSpeakingEnd?: VoiceEventCallback;
    onTranscript?: TranscriptCallback;
    onError?: ErrorCallback;
}

export class VoiceAssistant {
    private recognition: SpeechRecognition | null = null;
    private synthesis: SpeechSynthesis | null = null;
    private events: VoiceAssistantEvents = {};
    private _isListening = false;
    private _isSpeaking = false;
    private shouldBeListening = false;

    constructor() {
        if (typeof window !== "undefined") {
            this.synthesis = window.speechSynthesis;
        }
    }

    /** Check if the browser supports speech recognition */
    static isSupported(): boolean {
        if (typeof window === "undefined") return false;
        return !!(
            window.SpeechRecognition ||
            (window as any).webkitSpeechRecognition
        );
    }

    /** Register event callbacks */
    on<K extends keyof VoiceAssistantEvents>(
        event: K,
        callback: VoiceAssistantEvents[K]
    ) {
        this.events[event] = callback;
    }

    /** Start listening for speech — Chrome will show its own mic permission prompt */
    start() {
        if (!VoiceAssistant.isSupported()) {
            this.events.onError?.(
                "Speech recognition is not supported in this browser. Please use Chrome or Edge."
            );
            return;
        }

        this.createRecognition();
        this.shouldBeListening = true;
        this.startRecognition();
    }

    private createRecognition() {
        const SpeechRecognitionClass =
            window.SpeechRecognition || (window as any).webkitSpeechRecognition;

        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;       // Keep listening until explicitly stopped
        this.recognition.interimResults = false;   // Only fire on final results
        this.recognition.lang = "en-US";
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this._isListening = true;
            console.log("[VoiceAssistant] Recognition started — listening...");
            this.events.onListeningStart?.();
        };

        this.recognition.onaudiostart = () => {
            console.log("[VoiceAssistant] Audio input detected from microphone");
        };

        this.recognition.onsoundstart = () => {
            console.log("[VoiceAssistant] Sound detected");
        };

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            // Process only new results (from resultIndex onwards)
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const transcript = event.results[i][0].transcript.trim();
                    console.log("[VoiceAssistant] Transcript:", transcript);
                    if (transcript) {
                        this.events.onTranscript?.(transcript);
                    }
                }
            }
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.log("[VoiceAssistant] Recognition error:", event.error);
            // These errors are expected and non-fatal — recognition will auto-restart via onend
            if (event.error === "aborted" || event.error === "no-speech") return;

            if (event.error === "not-allowed") {
                this.shouldBeListening = false;
                this.events.onError?.(
                    "Microphone access was blocked. Please allow microphone access in your browser settings."
                );
                return;
            }

            if (event.error === "audio-capture") {
                this.shouldBeListening = false; // Stop retrying — mic is unavailable
                this.events.onError?.(
                    "Could not access your microphone. Please check that: (1) your mic is not being used by another app, (2) microphone is enabled in Windows Settings > Privacy > Microphone, and (3) Chrome has microphone permission. Then try again."
                );
                return;
            }

            this.events.onError?.(`Speech recognition error: ${event.error}`);
        };

        this.recognition.onend = () => {
            console.log("[VoiceAssistant] Recognition ended, shouldBeListening:", this.shouldBeListening);
            this._isListening = false;
            this.events.onListeningStop?.();

            // Auto-restart if we're supposed to still be listening
            // This handles the case where continuous mode ends unexpectedly
            if (this.shouldBeListening) {
                console.log("[VoiceAssistant] Auto-restarting recognition...");
                setTimeout(() => {
                    if (this.shouldBeListening) {
                        this.createRecognition();
                        this.startRecognition();
                    }
                }, 300);
            }
        };
    }

    private startRecognition() {
        try {
            this.recognition?.start();
            console.log("[VoiceAssistant] Called recognition.start()");
        } catch {
            // Recognition might already be started
            console.log("[VoiceAssistant] Recognition start failed (might already be running)");
        }
    }

    /** Stop listening and speaking */
    stop() {
        console.log("[VoiceAssistant] Stopping...");
        this.shouldBeListening = false;

        if (this.recognition) {
            this.recognition.onend = null;
            this.recognition.onerror = null;
            try {
                this.recognition.abort();
            } catch {
                // Ignore
            }
            this.recognition = null;
        }

        if (this.synthesis) {
            this.synthesis.cancel();
        }

        this._isListening = false;
        this._isSpeaking = false;
    }

    /** Pause listening temporarily (e.g. while AI is speaking) */
    pauseListening() {
        console.log("[VoiceAssistant] Pausing listening...");
        this.shouldBeListening = false;
        if (this.recognition) {
            this.recognition.onend = null; // Prevent auto-restart
            try {
                this.recognition.abort();
            } catch {
                // Ignore
            }
            this.recognition = null;
        }
        this._isListening = false;
    }

    /** Resume listening after a pause */
    resumeListening() {
        console.log("[VoiceAssistant] Resuming listening...");
        this.shouldBeListening = true;
        this.createRecognition();
        this.startRecognition();
    }

    /** Speak text aloud using the browser's speech synthesis */
    speak(text: string): Promise<void> {
        return new Promise((resolve) => {
            if (!this.synthesis) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            utterance.lang = "en-US";

            // Try to pick a natural-sounding voice
            const voices = this.synthesis.getVoices();
            const preferred = voices.find(
                (v) =>
                    v.name.includes("Google") ||
                    v.name.includes("Natural") ||
                    v.name.includes("Samantha")
            );
            if (preferred) {
                utterance.voice = preferred;
            }

            utterance.onstart = () => {
                this._isSpeaking = true;
                this.events.onSpeakingStart?.();
            };

            utterance.onend = () => {
                this._isSpeaking = false;
                this.events.onSpeakingEnd?.();
                resolve();
            };

            utterance.onerror = () => {
                this._isSpeaking = false;
                this.events.onSpeakingEnd?.();
                resolve();
            };

            this.synthesis.speak(utterance);
        });
    }

    get speaking(): boolean {
        return this._isSpeaking;
    }

    get listening(): boolean {
        return this._isListening;
    }
}
