"use client";
import { useEffect, useRef, useState } from "react";

export default function VideoLoop({ videos }: { videos: string[] }) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onEnd = () => setIdx(i => (i + 1) % videos.length);
    v.addEventListener("ended", onEnd);
    return () => v.removeEventListener("ended", onEnd);
  }, [videos.length]);

  if (videos.length === 0) return null;

  return (
    <video
      ref={ref}
      key={videos[idx]}
      src={videos[idx]}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
    />
  );
}