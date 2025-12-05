"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const GenerateProgramPage = () => {
  const [callActive, setCallActive] = useState(false);
  const [conncecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [callEnded, setCallEnded] = useState(false);

  const { user } = useUser()
  const router = useRouter()

  return (
    <div>GenerateProgramPage</div>
  )
}

export default GenerateProgramPage;