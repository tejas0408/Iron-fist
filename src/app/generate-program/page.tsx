"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { VoiceAssistant } from "@/lib/voice-assistant";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GenerateProgramPage = () => {
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [callEnded, setCallEnded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const { user } = useUser();
  const router = useRouter();

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<VoiceAssistant | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Check browser support
  useEffect(() => {
    setBrowserSupported(VoiceAssistant.isSupported());
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Navigate user to profile page after call ends
  useEffect(() => {
    if (callEnded) {
      const redirectTimer = setTimeout(() => {
        router.push("/profile");
      }, 1500);
      return () => clearTimeout(redirectTimer);
    }
  }, [callEnded, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceRef.current) {
        voiceRef.current.stop();
      }
    };
  }, []);

  const sendToAI = useCallback(
    async (userText: string) => {
      // Add user message to chat
      const updatedMessages: ChatMessage[] = [
        ...messagesRef.current,
        { role: "user", content: userText },
      ];
      setMessages(updatedMessages);
      setIsProcessing(true);

      // Pause listening while processing
      voiceRef.current?.pauseListening();

      try {
        const fullName = user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : "There";

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            userName: fullName,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.error("Chat API error details:", errBody);
          throw new Error(errBody.details || "Chat API failed");
        }

        const data = await res.json();
        const { response, isComplete, userData } = data;

        // Add AI response to chat
        const newMessages: ChatMessage[] = [
          ...updatedMessages,
          { role: "assistant", content: response },
        ];
        setMessages(newMessages);
        setIsProcessing(false);

        // Speak the AI response
        if (voiceRef.current && response) {
          await voiceRef.current.speak(response);
        }

        // If data collection is complete, generate the program
        if (isComplete && userData) {
          setIsProcessing(true);
          voiceRef.current?.stop();

          try {
            const programRes = await fetch("/api/generate-program", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id,
                ...userData,
              }),
            });

            if (!programRes.ok) throw new Error("Program generation failed");

            setCallActive(false);
            setCallEnded(true);
          } catch (err) {
            console.error("Generate program error:", err);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content:
                  "Sorry, there was an error generating your program. Please try again.",
              },
            ]);
          }
          setIsProcessing(false);
        } else {
          // Resume listening for next user input
          voiceRef.current?.resumeListening();
        }
      } catch (err) {
        console.error("Chat error:", err);
        setIsProcessing(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I had trouble processing that. Could you say that again?",
          },
        ]);
        // Resume listening after error
        voiceRef.current?.resumeListening();
      }
    },
    [user]
  );

  const toggleCall = useCallback(async () => {
    if (callActive) {
      // End the call
      if (voiceRef.current) {
        voiceRef.current.stop();
        voiceRef.current = null;
      }
      setCallActive(false);
      setIsSpeaking(false);
      setIsListening(false);
    } else {
      // Start the call
      setConnecting(true);
      setMessages([]);
      setCallEnded(false);

      const voice = new VoiceAssistant();
      voiceRef.current = voice;

      voice.on("onListeningStart", () => setIsListening(true));
      voice.on("onListeningStop", () => setIsListening(false));
      voice.on("onSpeakingStart", () => setIsSpeaking(true));
      voice.on("onSpeakingEnd", () => setIsSpeaking(false));
      voice.on("onError", (error) => {
        console.error("Voice error:", error);
      });
      voice.on("onTranscript", (transcript) => {
        sendToAI(transcript);
      });

      // Get initial greeting from AI
      try {
        const fullName = user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : "There";

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [],
            userName: fullName,
          }),
        });

        if (!res.ok) throw new Error("Failed to get greeting");

        const data = await res.json();
        const greeting = data.response;

        setMessages([{ role: "assistant", content: greeting }]);
        setCallActive(true);
        setConnecting(false);

        // Speak the greeting, then start listening
        await voice.speak(greeting);
        voice.start();
      } catch (err) {
        console.error("Start call error:", err);
        setConnecting(false);
      }
    }
  }, [callActive, user, sendToAI]);

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-5xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Have a voice conversation with our AI assistant to create your
            personalized fitness program.
          </p>

          {/* Browser support warning */}
          {!browserSupported && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              ⚠️ Your browser doesn&apos;t support voice recognition. Please use
              Chrome or Edge for the best experience.
            </div>
          )}
        </div>

        {/* Video Call Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* AI Assistant Card */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              <div
                className={`absolute inset-0 ${isSpeaking ? "opacity-30" : "opacity-0"
                  } transition-opacity duration-300`}
              >
                {/* Voice wave animation when speaking */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`mx-1 h-16 w-1 bg-primary rounded-full ${isSpeaking ? "animate-sound-wave" : ""
                        }`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: isSpeaking
                          ? `${Math.random() * 50 + 20}%`
                          : "5%",
                      }}
                    />
                  ))}
                </div>
              </div>
              {/* AI IMAGE */}
              <div className="relative size-32 mb-4">
                <div
                  className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${isSpeaking ? "animate-pulse" : ""
                    }`}
                />
                <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                  <Image
                    width={500}
                    height={500}
                    src="/Generated Image September 28, 2025 - 5_47PM.png"
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Fit Voice AI
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your Personalized Fitness Coach
              </p>

              {/* Speaking/Listening Indicator */}
              <div
                className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border ${isSpeaking
                  ? "border-primary"
                  : isListening
                    ? "border-green-500"
                    : ""
                  }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isSpeaking
                    ? "bg-primary animate-pulse"
                    : isListening
                      ? "bg-green-500 animate-pulse"
                      : isProcessing
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-muted"
                    }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isSpeaking
                    ? "Speaking..."
                    : isListening
                      ? "Listening..."
                      : isProcessing
                        ? "Thinking..."
                        : callActive
                          ? "Ready"
                          : callEnded
                            ? "Redirecting to profile..."
                            : "Waiting..."}
                </span>
              </div>
            </div>
          </Card>

          {/* User Card */}
          <Card className="bg-card/90 backdrop-blur-sm border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              <div className="relative size-32 mb-4">
                {user?.imageUrl && (
                  <Image
                    fill
                    src={user.imageUrl}
                    alt="User"
                    className="size-full object-cover rounded-full"
                  />
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">You</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user
                  ? (user.firstName + " " + (user.lastName || "")).trim()
                  : "Guest"}
              </p>

              {/* User Ready Text */}
              <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border">
                <div
                  className={`w-2 h-2 rounded-full ${isListening ? "bg-green-500 animate-pulse" : "bg-muted"
                    }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isListening ? "Mic Active" : "Ready"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* MESSAGE CONTAINER */}
        {messages.length > 0 && (
          <div
            ref={messageContainerRef}
            className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 h-64 overflow-y-auto transition-all duration-300 scroll-smooth"
          >
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                    {msg.role === "assistant" ? "Fit Voice AI" : "You"}:
                  </div>
                  <p className="text-foreground">{msg.content}</p>
                </div>
              ))}

              {isProcessing && (
                <div className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                    Fit Voice AI:
                  </div>
                  <p className="text-muted-foreground italic">Thinking...</p>
                </div>
              )}

              {callEnded && (
                <div className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-primary mb-1">
                    System:
                  </div>
                  <p className="text-foreground">
                    Your fitness program has been created! Redirecting to your
                    profile...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CALL CONTROLS */}
        <div className="w-full flex justify-center gap-4">
          <Button
            className={`w-40 text-xl rounded-3xl ${callActive
              ? "bg-destructive hover:bg-destructive/90"
              : callEnded
                ? "bg-green-600 hover:bg-green-700"
                : "bg-primary hover:bg-primary/90"
              } text-white relative`}
            onClick={toggleCall}
            disabled={connecting || callEnded || !browserSupported}
          >
            {connecting && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>
            )}

            <span>
              {callActive
                ? "End Call"
                : connecting
                  ? "Connecting..."
                  : callEnded
                    ? "View Profile"
                    : "Start Call"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramPage;