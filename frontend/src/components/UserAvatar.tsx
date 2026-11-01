import { useEffect, useState } from "react";

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: "small" | "large";
}

export function UserAvatar({ name, src, size = "large" }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase() || "?";

  return (
    <span className={`user-avatar user-avatar-${size}`} aria-label={name}>
      {src && !failed ? (
        <img src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        initial
      )}
    </span>
  );
}
