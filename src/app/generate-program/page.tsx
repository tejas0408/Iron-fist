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
    vapi.on("call-start", handleCallStart)
    vapi.on("call-end", handleCallEnd)
    vapi.on("speech-start", handleSpeechStart)
    vapi.on("speech-end", handleSpeechEnd)
    vapi.on("message", handleMessage)
    vapi.on("error", handleError)


  }, [])

  return (
    <div>GenerateProgramPage</div>
  )
}

export default GenerateProgramPage;