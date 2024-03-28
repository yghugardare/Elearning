"use client";
import React, { useState } from "react";
import { styles } from "@/app/styles/style";
import Image from "next/image";
import AiChat from "@/app/components/AI/AiChat";

const Page = () => {
  
  const [videoName, setVideoName] = useState("");
  const [flag, setFlag] = useState(false);

  function handleSubmit() {
    // alert(videoName);
    setFlag(true);
  }
  return flag ? (
    <AiChat videoName={videoName}/>
  ) : (
    <div className="w-[100vw] h-screen flex justify-center items-center flex-col gap-y-10 ">
      <h1 className={`${styles.title}`}>Welcome to ELearning AI Bot</h1>
      <Image width={250} height={200} src={"/assests/AIBot.jpg"} alt={"BOT"} />
      <form
        onSubmit={handleSubmit}
        className="md:h-[30%] h-[30%] w-[60%] md:w-[40%] bg-[#30426E] p-4 flex flex-col justify-center md:p-10 rounded-lg"
      >
        <label className={`${styles.label} !text-xl`} htmlFor="video">
          Enter Name of the video
        </label>
        <input
          type="text"
          name=""
          value={videoName}
          onChange={(e) => setVideoName(e.target.value)}
          id="video"
          placeholder="Video Name"
          className={` ${styles.input}`}
        />
        <div className="w-full mt-5">
          <input
            type="submit"
            value="Go To AI"
            className={`${styles.button}`}
          />
        </div>
      </form>
    </div>
  );
};

export default Page;
