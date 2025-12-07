"use client";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { vapi } from "@/lib/vapi";

const GenerateProgramPage = () => {
  const [callActive, setCallActive] = useState(false);
  const [conncecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [callEnded, setCallEnded] = useState(false);

  const { user } = useUser()
  const router = useRouter()

  const messageContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleCallStart = () => {
      console.log("Call started")
      setConnecting(true)
      setCallActive(true)
      setCallEnded(false)
    }
    const handleCallEnd = () => {
      console.log("Call ended")
      setConnecting(false)
      setCallActive(false)
      setIsSpeaking(false)
      setCallEnded(true)
    }
    const handleSpeechStart = () => {
      console.log("AI started Speaking")
      setIsSpeaking(true)
    }
    const handleSpeechEnd = () => {
      console.log("AI stopped Speaking")
      setIsSpeaking(false)
    }
    const handleMessage = () => { }
    const handleError = () => { }

    vapi.on("call-start", handleCallStart)
    vapi.on("call-end", handleCallEnd)
    vapi.on("speech-start", handleSpeechStart)
    vapi.on("speech-end", handleSpeechEnd)
    vapi.on("message", handleMessage)
    vapi.on("error", handleError)

    return () => {
      vapi.off("call-start", handleCallStart)
      vapi.off("call-end", handleCallEnd)
      vapi.off("speech-start", handleSpeechStart)
      vapi.off("speech-end", handleSpeechEnd)
      vapi.off("message", handleMessage)
      vapi.off("error", handleError)
    }
  }, [])

  return (
    <div>GenerateProgramPage</div>
  )
}

export default GenerateProgramPage;