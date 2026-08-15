import React, { useEffect, useRef, useState } from "react";
import { Copy, RefreshCw, Check, Sparkles, Volume2, Square, Pencil, ThumbsUp, ThumbsDown, Brain, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Attachment } from "../types";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  statusMessage?: string;
  onRegenerate: () => void;
  onStopGeneration?: () => void;
  onContinueGenerating?: () => void;
  onEditMessage?: (id: string, text: string) => void;
  accentColorClass: string;
}

function ThinkingAccordion({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="my-2.5 rounded-xl border border-blue-500/25 bg-blue-500/5 overflow-hidden backdrop-blur-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-mono font-semibold text-blue-300 hover:bg-blue-500/10 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Collapsible Reasoning &amp; Thought Process</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="p-3.5 border-t border-blue-500/20 text-xs font-mono text-slate-300 bg-black/40 whitespace-pre-wrap leading-relaxed shadow-inner">
          {content}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl border border-white/10 bg-[#050914] overflow-hidden shadow-lg group/code">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/10 text-xs font-mono text-slate-400">
        <span className="uppercase font-semibold text-blue-400 text-[11px] tracking-wider">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[11px] cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || "text"}
        PreTag="div"
        customStyle={{ margin: 0, padding: '0.85rem 1rem', background: 'transparent', fontSize: '0.825rem' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export default function ChatWindow({
  messages,
  isLoading,
  statusMessage,
  onRegenerate,
  onStopGeneration,
  onContinueGenerating,
  onEditMessage,
  accentColorClass,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [feedbackState, setFeedbackState] = useState<Record<string, "like" | "dislike" | null>>({});
  const prevMessagesLengthRef = useRef(messages.length);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAutoScrollEnabled(isNearBottom);
    }
  };

  useEffect(() => {
    let shouldScroll = isAutoScrollEnabled;

    if (messages.length > prevMessagesLengthRef.current) {
      shouldScroll = true;
      setIsAutoScrollEnabled(true);
    }
    prevMessagesLengthRef.current = messages.length;

    if (shouldScroll) {
      bottomRef.current?.scrollIntoView({ behavior: isLoading ? "auto" : "smooth" });
    }
  }, [messages, isLoading, isAutoScrollEnabled]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFeedback = (id: string, type: "like" | "dislike") => {
    setFeedbackState((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const handleReadAloud = (id: string, text: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const plainText = text.replace(/[#*_~`>]/g, "");
    utterance.text = plainText;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    
    window.speechSynthesis.speak(utterance);
    setSpeakingId(id);
  };

  return (
    <div
      id="chat-window-viewport"
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-4 md:px-8 space-y-4 sm:space-y-6 scrollbar-thin flex flex-col"
    >
      {messages.map((msg, index) => {
        const isUser = msg.sender === "user";
        const isLastMessage = index === messages.length - 1;
        const currentFeedback = feedbackState[msg.id];

        // Do not render empty assistant card before response text or media begins streaming
        if (!isUser && !msg.text && !msg.generatedImage && !msg.generatedVideo && !msg.attachment) {
          return null;
        }

        return (
          <div
            key={msg.id}
            id={`chat-bubble-row-${msg.id}`}
            className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              id={`chat-bubble-card-${msg.id}`}
              className={`relative max-w-[94%] sm:max-w-[85%] md:max-w-[75%] rounded-[20px] sm:rounded-[22px] p-3 sm:p-4 shadow-xl transition-all duration-200 group ${
                isUser
                  ? `bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-blue-500/20 hover:-translate-y-0.5`
                  : "bg-white/[0.04] border border-white/10 hover:border-white/20 text-slate-100 rounded-tl-sm backdrop-blur-2xl shadow-black/40 hover:-translate-y-0.5"
              }`}
            >
              {/* Attachment Display inside bubble */}
              {msg.attachment && (
                <div
                  id={`bubble-attachment-${msg.id}`}
                  className="mb-3 max-w-[280px] rounded-xl overflow-hidden border border-white/10 shadow-sm"
                >
                  {msg.attachment.type === "application/pdf" ? (
                    <div className="w-full h-[100px] bg-slate-900/50 flex flex-col items-center justify-center border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mb-2">
                        <span className="text-rose-400 font-bold text-xs">PDF</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={msg.attachment.url}
                      alt={msg.attachment.name}
                      className="w-full h-auto object-cover max-h-[200px]"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="p-2 bg-slate-950/40 backdrop-blur-sm flex items-center justify-between">
                    <span className="text-[10px] text-slate-300 truncate pr-4">{msg.attachment.name}</span>
                  </div>
                </div>
              )}

              {/* Generated Image */}
              {msg.generatedImage && (
                <div className="mb-3 max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-sm">
                  <img src={msg.generatedImage} alt="Generated" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
                </div>
              )}

              {/* Generated Video Info */}
              {msg.generatedVideo && (
                <div className="mb-3 p-4 rounded-xl border border-white/10 shadow-sm bg-white/5 flex flex-col items-center justify-center gap-2">
                   {msg.generatedVideo.status === 'done' && msg.generatedVideo.uri ? (
                     <video src={msg.generatedVideo.uri} controls className="max-w-sm w-full rounded-lg outline-none" />
                   ) : (
                     <div className="text-sm text-cyan-300 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Video... (Poll ID: {msg.generatedVideo.operationName?.slice(-6)})
                     </div>
                   )}
                </div>
              )}

              {/* Message text with Markdown support */}
              <div
                id={`bubble-text-content-${msg.id}`}
                className="prose prose-invert prose-xs md:prose-sm max-w-none text-slate-100 leading-relaxed font-sans"
              >
                {isUser ? (
                  editingMsgId === msg.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <textarea
                        className="w-full bg-slate-900/60 border border-white/20 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px] resize-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingMsgId(null)}
                          className="px-3 py-1 text-xs rounded hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (onEditMessage && editContent.trim()) {
                              onEditMessage(msg.id, editContent);
                              setEditingMsgId(null);
                            }
                          }}
                          className={`px-3 py-1 text-xs rounded bg-gradient-to-r ${accentColorClass} text-white font-medium hover:opacity-90 transition-opacity cursor-pointer`}
                        >
                          Save & Submit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )
                ) : (
                  <div className={`markdown-body ${msg.isStreaming ? 'streaming' : ''}`}>
                    {(() => {
                      const thinkMatch = msg.text.match(/<think>([\s\S]*?)<\/think>/i);
                      const thinkingContent = thinkMatch ? thinkMatch[1].trim() : null;
                      const cleanText = thinkMatch ? msg.text.replace(/<think>[\s\S]*?<\/think>/i, '').trim() : msg.text;

                      return (
                        <>
                          {thinkingContent && <ThinkingAccordion content={thinkingContent} />}
                          <ReactMarkdown
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeText = String(children).replace(/\n$/, '');
                                return !inline ? (
                                  <CodeBlock language={match ? match[1] : ""} value={codeText} />
                                ) : (
                                  <code {...props} className={className}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {cleanText}
                          </ReactMarkdown>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              {/* Grounding chunks */}
              {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Sources:</span>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingChunks.map((chunk, idx) => {
                      const link = chunk.web || chunk.maps;
                      if (!link) return null;
                      return (
                        <a 
                          key={idx} 
                          href={link.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[11px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-blue-300 flex items-center gap-1 max-w-full truncate hover:-translate-y-0.5 transition-all"
                        >
                           <span className="truncate">{link.title || link.uri}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message controls footer */}
              <div
                id={`bubble-controls-${msg.id}`}
                className={`flex items-center gap-2.5 mt-2.5 pt-2 border-t border-white/5 opacity-100 transition-opacity duration-200 ${
                  isUser ? "justify-end text-white/70" : "justify-start text-slate-400"
                }`}
              >
                {/* Copy text button */}
                <button
                  id={`copy-msg-btn-${msg.id}`}
                  onClick={() => handleCopyText(msg.id, msg.text)}
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                  title="Copy text"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Edit message button (User only) */}
                {isUser && !isLoading && (
                  <button
                    id={`edit-msg-btn-${msg.id}`}
                    onClick={() => {
                      setEditContent(msg.text);
                      setEditingMsgId(msg.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                    title="Edit message"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Like / Dislike buttons (Assistant only) */}
                {!isUser && (
                  <>
                    <button
                      id={`like-msg-btn-${msg.id}`}
                      onClick={() => handleToggleFeedback(msg.id, "like")}
                      className={`p-1.5 rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer ${
                        currentFeedback === "like"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "hover:bg-white/10 hover:text-white"
                      }`}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`dislike-msg-btn-${msg.id}`}
                      onClick={() => handleToggleFeedback(msg.id, "dislike")}
                      className={`p-1.5 rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer ${
                        currentFeedback === "dislike"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "hover:bg-white/10 hover:text-white"
                      }`}
                      title="Bad response"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {/* Read Aloud button (Assistant only) */}
                {!isUser && (
                  <button
                    id={`read-msg-btn-${msg.id}`}
                    onClick={() => handleReadAloud(msg.id, msg.text)}
                    className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                    title={speakingId === msg.id ? "Stop reading" : "Read aloud"}
                  >
                    {speakingId === msg.id ? (
                      <Square className="w-3.5 h-3.5 text-blue-400 fill-current" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Continue Generating button (Assistant only & on last AI message) */}
                {!isUser && isLastMessage && !isLoading && onContinueGenerating && (
                  <button
                    onClick={onContinueGenerating}
                    className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 text-xs font-medium flex items-center gap-1 hover:-translate-y-0.5 transition-all cursor-pointer"
                    title="Continue response"
                  >
                    <span>Continue generating</span>
                  </button>
                )}

                {/* Regenerate button (Assistant only & on last AI message) */}
                {!isUser && isLastMessage && !isLoading && (
                  <button
                    id={`regenerate-msg-btn-${msg.id}`}
                    onClick={onRegenerate}
                    className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                    title="Regenerate reply"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Message Timestamp */}
                <span className="text-[10px] font-mono select-none opacity-80 ml-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Loading Thinking Indicator */}
      {isLoading && (!messages.length || messages[messages.length - 1].sender === "user" || (messages[messages.length - 1].sender === "assistant" && !messages[messages.length - 1].text)) && (
        <div id="ai-typing-indicator-row" className="flex w-full justify-start animate-in fade-in duration-300">
          <div className="relative max-w-[85%] md:max-w-[75%] rounded-[22px] rounded-tl-sm p-4 bg-white/[0.04] border border-white/10 text-slate-100 shadow-xl backdrop-blur-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200 tracking-wide font-mono">{statusMessage || "Optimizing Response..."}</span>
                <div id="typing-dots-container" className="flex items-center gap-1.5 px-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                </div>
              </div>
            </div>

            {onStopGeneration && (
              <button
                onClick={onStopGeneration}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Square className="w-3 h-3 fill-rose-300" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom anchor for scrolling */}
      <div id="chat-viewport-bottom-anchor" ref={bottomRef} className="h-2 shrink-0" />
    </div>
  );
}
