"use client";
import React, { FC, useState, useEffect } from "react";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { styles } from "@/app/styles/style";
import { ThemeSwitcher } from "@/app/utils/ThemeSwitcher";
import Link from "next/link";
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
const AiChat: FC<Props> = ({ videoName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [chat, setChat] = useState<ChatSession | null>(null);
  //   const [theme, setTheme] = useState("light");
  const [error, setError] = useState<string | null>(null);
  const MODEL_NAME = "gemini-1.0-pro-001";
  const API_KEY = "AIzaSyBTFD1gqjU7NPBnPX88RiFBC3kQSDVqy2c";
  const genAI = new GoogleGenerativeAI(API_KEY);

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
      } catch (error: any) {
        setError("Something Went Wrong!");
      }
    };
    initChat();
  }, []);
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
        const prompt:string = `QUESTIION - ${userInput} Answer the following question and  provide answer in context to ${videoName} only , If question is out of context or not related to programming then just Send Response as "Please ask  questions only related to ${videoName}".`
        const result = await chat.sendMessage(prompt);
        const botMessage: Message = {
          text: result.response.text(),
          role: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (error: any) {
      setError("Something is wrong");
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent adding new Line
      handleSendMessage();
    }
  };
  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <Link 
        href={"/"}
        className={`${styles.title} !text-2xl`}>ELearning AI BOT 🤖</Link>
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
                  : " rounded-lg font-Josefin p-2 text-lg   text-black dark:text-white bg-blue-200 dark:bg-blue-950 "
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
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
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
  );
};

export default AiChat;
