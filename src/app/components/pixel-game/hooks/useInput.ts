import { useEffect, MutableRefObject } from "react";

interface UseInputOptions {
  keysPressed: MutableRefObject<Set<string>>;
  setDebugCollision: (fn: (prev: boolean) => boolean) => void;
}

export function useInput({
  keysPressed,
  setDebugCollision,
}: UseInputOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());

      if (e.key.toLowerCase() === "c") {
        setDebugCollision((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
}
