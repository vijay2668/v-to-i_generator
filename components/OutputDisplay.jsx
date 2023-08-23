"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import JSZip from "jszip";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { BiImageAdd } from "react-icons/bi";

const OutputDisplay = () => {
  const [frameIndex, setFrameIndex] = useState(1);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const frameCount = 145;

  const zip = new JSZip();

  const currentFrame = (index) => {
    const baseUrl =
      "https://www.apple.com/105/media/us/airpods-pro/2019/1299e2f5_9206_4470_b28e_08307a42f19b/anim/sequence/large/01-hero-lightpass/";
    return progress === 100
      ? generatedImages[index]?.currentSrc
      : `${baseUrl}${String(index).padStart(4, "0")}.jpg`;
  };

  const preloadImages = () => {
    for (let i = 1; i < frameCount; i++) {
      if (generatedImages.length <= 1) {
        const img = new Image();
        img.src = currentFrame(i);
      }
    }
  };

  useEffect(() => {
    preloadImages();
  }, [progress === 100 && generatedImages]);

  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScrollTop =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / maxScrollTop;
    const newIndex = Math.min(
      frameCount - 1,
      Math.ceil(scrollFraction * frameCount)
    );
    setFrameIndex(newIndex + 1);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const generateImages = async () => {
    if (!file) return;

    setDisabled(true);

    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);

    video.addEventListener("loadeddata", async () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const totalFrames = Math.floor(video.duration * 25);
      let completedFrames = 0;

      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = i / 25;
        await new Promise((resolve) => setTimeout(resolve, 100));

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const image = new Image();
        image.src = canvas.toDataURL("image/png");
        setGeneratedImages((prevImages) => [...prevImages, image]);

        completedFrames++;
        const progressPercentage = Math.floor(
          (completedFrames / totalFrames) * 100
        );

        setProgress(progressPercentage);
      }
    });
  };

  async function downloadAllImages() {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 10));

    try {
      generatedImages?.forEach((image, index) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);

        const imgData = canvas.toDataURL("image/png").split(",")[1];
        const paddedIndex = (index + 1).toString().padStart(4, "0");
        zip.file(`${paddedIndex}.png`, imgData, { base64: true });
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "image_frames.zip";
      link.click();
      setLoading(false);
    } catch (error) {
      console.error("Download error", error);
      setLoading(false);
    }
  }

  const reset = () => {
    setFrameIndex(1);
    setGeneratedImages([]);
    setProgress(0);
    setDisabled(false);
    setLoading(false);
    setFile(null);
  };

  return (
    <div id="style-1" className="h-screen w-full">
      <div  className="h-[600vh] flex w-full bg-black">
        <Dialog className="bg-black">
          <DialogTrigger
            className="text-white border border-white fixed top-10 right-10 rounded-lg px-4 py-2"
          >
            Open
          </DialogTrigger>
          <DialogContent className="bg-black">
            <form className="text-white w-full overflow-hidden relative space-y-4">
              <div className=" space-y-4">
                <span className="text-lg font-semibold leading-5 flex justify-center">
                  Upload a File
                </span>
                <p className="leading-5 text-center text-sm">
                  Select a file to upload from your computer or device.
                </p>

                <div className="flex items-center flex-wrap">
                  <label
                    htmlFor="file"
                    className="button bg-transparent border border-dashed border-gray-500 rounded-lg flex-1 py-4 px-8 hover:bg-gray-900"
                  >
                    <input
                      hidden={true}
                      type="file"
                      accept="video/*"
                      id="file"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <div className="flex flex-col text-center sm:flex-row items-center space-x-2">
                      <BiImageAdd className="w-6 h-6" />
                      <p className="text-sm">{file ? file.name : "No file choosen"}</p>
                    </div>
                  </label>
                </div>
              </div>
              <div
                className={clsx(
                  progress > 0 ? "flex" : "hidden",
                  " items-center space-x-2 justify-center text-white"
                )}
              >
                <span>{progress}%</span>
                <Progress value={progress} />
              </div>
              <div className="flex max-sm:flex-col max-sm:space-y-4 items-center justify-between sm:space-x-4">
                <Button
                  type="button"
                  className="hover:bg-gray-800 w-full"
                  onClick={generateImages}
                  disabled={file && !disabled ? false : true}
                >
                  {progress > 0 && progress !== 100 ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Please wait</span>
                    </div>
                  ) : (
                    "Generate Images"
                  )}
                </Button>
                <Button
                  type="button"
                  disabled={loading}
                  className={clsx(
                    progress === 100 ? "block" : "hidden",
                    "bg-transparent w-full"
                    )}
                    variant="outline"
                  onClick={downloadAllImages}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Downloading..</span>
                    </div>
                  ) : (
                    "Download All Images"
                  )}
                </Button>
                <Button
                  type="button"
                  className={clsx(
                    progress === 100 ? "block" : "hidden",
                    "bg-transparent  w-full"
                  )}
                  onClick={reset}
                  variant="outline"
                  >
                  Reset
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* to change the width and height you can play with below classes */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-2/4 -translate-y-2/4 w-3/4 h-3/4 ">
          <img
            src={
              progress === 100
                ? generatedImages[frameIndex].currentSrc
                : currentFrame(frameIndex)
            }
            alt={`Frame ${frameIndex}`}
            className=" w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default OutputDisplay;
