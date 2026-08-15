/**
 * Web Speech API wrapper for transcribing voice input.
 */
export function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
  if (!SpeechRecognition) {
    return null;
  }
  
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  
  return recognition;
}

export const isSpeechSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
};
