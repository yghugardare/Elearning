"use client";
import React, { FC, useState, useEffect } from "react";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { styles } from "@/app/styles/style";
import { ThemeSwitcher } from "@/app/utils/ThemeSwitcher";
import Link from "next/link";
import { useGetTranscriptMutation } from "@/redux/features/courses/coursesApi";
import { useParams } from "next/navigation";
import Loader from "../Loader/Loader";
type Props = {
  videoName: string;
};
interface Message {
  text: string;
  role: "user" | "bot";
  timestamp: Date;
}
interface ChatSession {
  sendMessage: (message: string) => Promise<any>; // Adjust the return type according to the actual API
}
interface Data {
  transcript?: string;
  success: boolean;
  courseName: string;
}
interface Result {
  data?: Data;
  error?: FetchBaseQueryError | any;
}
const AiChat: FC<Props> = ({ videoName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [transcript, setTranscript] = useState<string | undefined>("");
  const [courseName, setCourseName] = useState<string | undefined>("");
  const [err, setErr] = useState<string | null>(null);
  const MODEL_NAME = "gemini-1.0-pro-001";
  const API_KEY = "AIzaSyBTFD1gqjU7NPBnPX88RiFBC3kQSDVqy2c";
  const genAI = new GoogleGenerativeAI(API_KEY);
  const courseId = useParams();
  const [getTranscript, { data, isLoading, error }] =
    useGetTranscriptMutation();

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  useEffect(() => {
    const initChat = async () => {
      try {
        const newChat: any = await genAI
          .getGenerativeModel({ model: MODEL_NAME })
          .startChat({
            generationConfig,
            safetySettings,
            history: [...messages].map((msg: Message) => ({
              parts: [{ text: msg.text }],
              role: msg.role === "bot" ? "model" : msg.role,
            })),
          });
        setChat(newChat);
      } catch (err: any) {
        setErr("Something Went Wrong!");
      }
    };
    initChat();
  }, [transcript, courseName]);
  const handleSendMessage = async () => {
    try {
      const userMessage: Message = {
        text: userInput,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setUserInput("");
      if (chat) {
        let trs: string = transcript
          ? `Use following Transcript if required NOT Compulsory - "${transcript}" and`
          : "and";
        const prompt: string = `QUESTIION - ${userInput} Answer the following question and  provide answer in context to concepts associated with ${videoName} or  ${courseName} only , 
        ${trs} 
        If question is out of context or not related to programming then just Send Response as "Please ask  questions only related to ${videoName}".`;
        const result = await chat.sendMessage(prompt);
        const botMessage: Message = {
          text: result.response.text(),
          role: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (err: any) {
      setErr("Something is wrong");
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent adding new Line
      handleSendMessage();
    }
  };
  const handleGetTranscript = async () => {
    // alert(courseId.id);
    // console.log(courseId?.id)
    try {
      const result: Result = await getTranscript({
        id: courseId?.id,
        videoName,
      });
      // Handle the transcript data (result.data)
      // console.log("Transcript and Course Name:",result?.data?.transcript);
      if (result) {
        let trs: string | undefined = result?.data?.transcript;
        // console.log(trs);
        setTranscript(trs);
        // console.log(transcript, "tr");

        let cname: string | undefined = result?.data?.courseName;
        setCourseName(cname);
      }
      if (chat && courseName) {
        let noTRS: string = `mention "No transcript available for course!, But still here is a short summary on ${videoName}" and provide 3-4 line summary for ${videoName}`;
        let yesTRS: string = `Summarize the following transcript - ${transcript} in context to ${courseName} `;
        const prompt: string = transcript ? yesTRS : noTRS;
        const result = await chat.sendMessage(prompt);
        const botMessage: Message = {
          text: result.response.text(),
          role: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
        alert("Try Again");
      }
    } catch (err) {
      console.error("Error fetching transcript:", err);
    }
  };
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="flex flex-col h-screen p-4">
          <button
            className="p-2 bg-red-500 self-center rounded-full text-white hover:bg-red-400"
            onClick={handleGetTranscript}
          >
            Summarize
          </button>
          <div className="flex justify-between items-center mb-4">
            <Link href={"/"} className={`${styles.title} !text-2xl`}>
              ELearning AI BOT 🤖
            </Link>
            <div className="flex space-x-2">
              <ThemeSwitcher />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto rounded-md p-2">
            {[...messages].map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={` ${
                    msg.role === "user"
                      ? `${styles.input}`
                      : " rounded-lg font-Josefin p-2 text-xl text-black dark:text-white bg-blue-200 dark:bg-blue-950 "
                  }`}
                >
                  {msg.text}
                </span>
                {/* <input type="text"
            readOnly
            className={`${styles.input}`}
            value={msg.text}
            /> */}
                <p className={`text-xs ${styles.label} mt-1`}>
                  {msg.role === "bot" ? "Bot" : "You"} -{" "}
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
            {err && <div className="text-red-500 text-sm mb-4">{err}</div>}
            <div className="flex items-center mt-4">
              <input
                type="text"
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`${styles.input} !rounded-l-md !flex-1 !p-2 !border-b !border-t !border-l focus:outline-none focus:border-blue-500 `}
              />
              <button
                onClick={handleSendMessage}
                className={`p-2 cursor-pointer bg-[#2190ff] text-white rounded-r-md ml-1 mt-1  hover:bg-opacity-80 focus:outline-none`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChat;
