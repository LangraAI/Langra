import { useMemo, useRef, useEffect } from "react";
import { Box } from "@mui/material";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  const previousLengthRef = useRef(0);

  const words = useMemo(() => {
    if (!text) return [];
    return text.split(/(\s+)/);
  }, [text]);

  useEffect(() => {
    if (!isStreaming) {
      previousLengthRef.current = 0;
    }
  }, [isStreaming]);

  return (
    <>
      {words.map((word, index) => {
        const isNew = isStreaming && index >= previousLengthRef.current;
        if (index === words.length - 1 && isStreaming) {
          previousLengthRef.current = words.length;
        }

        return (
          <Box
            key={`${index}-${word}`}
            component="span"
            sx={{
              animation: isNew ? 'fadeIn 0.4s ease-out forwards' : 'none',
              opacity: isNew ? 0 : 1,
              "@keyframes fadeIn": {
                "0%": {
                  opacity: 0,
                },
                "100%": {
                  opacity: 1,
                },
              },
            }}
          >
            {word}
          </Box>
        );
      })}
    </>
  );
}
