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

  //auto scroll messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  }, [messages])

  //navigate yser to profile page after call ends
  useEffect(() => {
    if (callEnded) {
      const redirectTimer = setTimeout(() => {
        router.push("/profile")
      }, 1500);
      return () => clearTimeout(redirectTimer)
    }
  }, [callEnded, router])


  //set up event listner
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
    const handleMessage = (message: any) => { }
    const handleError = (error: any) => {
      console.log("Vapi Error", error);
      setConnecting(false);
      setCallActive(false);
    }

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

  const toggleCall = async () => {
    if (callActive) {
      vapi.stop()
    } else {
      try {
        setConnecting(true)
        setMessages([]);
        setCallEnded(false)

        const fullName = user?.firstName
          ? `${user?.firstName} ${user?.lastName}`.trim()
          : "There";
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID, {
          variableValues: {
            full_name: fullName,

          }
        })

      } catch (error) {
        console.log("Vapi Error", error);
        setConnecting(false);
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-5xl">
        {/*Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>
              Generate Your
            </span>

          </h1>

        </div>

      </div>

    </div>
  )
}

export default GenerateProgramPage;