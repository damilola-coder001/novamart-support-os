import React, { useRef } from "react";
import {
  Bot,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Paperclip,
  Send,
  X,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  senderType: "CUSTOMER" | "AI" | "AGENT" | "SYSTEM";
  senderName?: string;
  content: string;
  toolCalls?: string | null;
  attachments?: string | null;
  createdAt: string;
}

interface CustomerChatWindowProps {
  user: any;
  messages: ChatMessage[];
  isAiThinking: boolean;
  conversationStatus: string;
  inputMessage: string;
  setInputMessage: (val: string) => void;
  attachedFile: any;
  setAttachedFile: (val: any) => void;
  isUploading: boolean;
  promptSuggestions: Array<{ label: string; text: string }>;
  onSendMessage: (text?: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const CustomerChatWindow: React.FC<CustomerChatWindowProps> = ({
  user,
  messages,
  isAiThinking,
  conversationStatus,
  inputMessage,
  setInputMessage,
  attachedFile,
  setAttachedFile,
  isUploading,
  promptSuggestions,
  onSendMessage,
  onFileUpload,
  messagesEndRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[75vh]">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>NovaMart AI Support Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                ONLINE
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Connected to Customer Profile ({user?.name || "Customer"})
            </div>
          </div>
        </div>

        {conversationStatus === "NEEDS_HUMAN" && (
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Escalated to Human Agent</span>
          </span>
        )}

        {conversationStatus === "AGENT_ACTIVE" && (
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Human Specialist Active</span>
          </span>
        )}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages
          .filter((msg) => msg.senderType !== "SYSTEM")
          .map((msg) => {
          const isUser = msg.senderType === "CUSTOMER";
          let parsedTools: any[] = [];
          if (msg.toolCalls) {
            try {
              parsedTools = JSON.parse(msg.toolCalls);
            } catch {}
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-brand-600 text-white shadow-xs"
                    : msg.senderType === "AGENT"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-muted border border-border text-brand-400"
                }`}
              >
                {isUser ? "You" : msg.senderType === "AGENT" ? "Agent" : <Bot className="w-4 h-4" />}
              </div>

              <div className="max-w-[85%] sm:max-w-xl space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] px-1">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {isUser ? user?.name : msg.senderName || "NovaMart Assistant"}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">•</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-brand-600 text-white rounded-tr-xs shadow-xs font-bold"
                      : msg.senderType === "AGENT"
                      ? "bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-500 dark:border-emerald-500/50 text-emerald-950 dark:text-emerald-50 rounded-tl-xs shadow-xs font-bold"
                      : "bg-muted/60 border border-border text-foreground rounded-tl-xs shadow-xs font-medium"
                  }`}
                >
                  {msg.content?.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "")}
                </div>

                {/* Tool Calls inspection badge */}
                {Array.isArray(parsedTools) && parsedTools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {parsedTools.map((tc, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 inline-flex items-center gap-1.5 font-mono"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Autonomous tool verified: {tc.tool || "databaseLookup"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isAiThinking && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-muted border border-border text-brand-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border rounded-tl-xs flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestion Chips */}
      <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex flex-wrap gap-2">
        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 my-auto">
          <Sparkles className="w-3 h-3 text-amber-300" /> Suggestions:
        </span>
        {promptSuggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(sug.text)}
            className="text-xs px-3 py-1 rounded-full bg-card hover:bg-accent border border-border text-foreground transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{sug.label}</span>
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-border bg-card">
        {attachedFile && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs flex items-center justify-between text-brand-300">
            <span className="truncate">📎 Attached: {attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            className="hidden"
            accept="image/*,.pdf"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer border border-transparent hover:border-border"
            title="Attach file or photo"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message or ask about your orders/returns..."
            className="flex-1 bg-muted/60 border border-border focus:border-brand-500 focus:outline-hidden px-4 py-2.5 rounded-xl text-xs sm:text-sm text-foreground transition placeholder:text-muted-foreground"
          />

          <button
            type="submit"
            disabled={(!inputMessage.trim() && !attachedFile) || isAiThinking}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition shadow-xs cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
