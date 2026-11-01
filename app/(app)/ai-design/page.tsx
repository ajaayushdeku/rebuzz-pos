"use client";

import { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Paperclip,
  ImagePlus,
  Download,
  RefreshCw,
  Bookmark,
  MessageSquare,
  Images,
  Settings,
  CheckCircle2,
  Eye,
  EyeOff,
  WandSparkles,
  ArrowRight,
  Lightbulb,
  Clock3,
  Bot,
  User,
  X,
} from "lucide-react";

import {
  designTabs,
  examplePrompts,
  instructionSteps,
  demoDesigns,
} from "@/components/design-studio/mock-data";

type Tab = "create" | "designs" | "settings";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

function DesignArtwork({
  title,
  subtitle,
  discount,
  background,
  accent,
}: {
  title: string;
  subtitle: string;
  discount: string;
  background: string;
  accent: string;
}) {
  return (
    <div
      className={`relative flex aspect-[4/5] w-full flex-col items-center justify-between overflow-hidden rounded-xl bg-gradient-to-br ${background} p-6 text-center text-white`}
    >
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/20" />
      <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full border border-white/20" />

      <div className="relative z-10 w-full">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/70">
          Your Brand
        </p>
        <div className="mx-auto mt-3 h-px w-12 bg-white/50" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <p className={`text-xs font-bold uppercase tracking-[0.3em] ${accent}`}>
          {subtitle}
        </p>

        <h3 className="max-w-full text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
          {title}
        </h3>

        <div className="rounded-lg border border-white/40 bg-white/10 px-5 py-3 backdrop-blur-sm">
          <p className="text-3xl font-black">{discount}</p>
        </div>

        <p className="text-xs font-medium uppercase tracking-widest text-white/80">
          Limited Time Offer
        </p>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/70">
          Visit us today
        </p>
      </div>
    </div>
  );
}

function CreateDesignTab() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm your AI Design Assistant. Tell me what kind of graphic you'd like to create. You can describe a promotion, showcase a product, or share an announcement. I'll help turn your idea into a design!",
    },
  ]);

  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const referenceInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = (message?: string) => {
    const text = (message ?? input).trim();

    if (!text) return;

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        content: text,
      },
      {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "That sounds great! I've got your idea. You can add more details or generate a design using the button below. This is a demo experience, so no actual AI request will be sent.",
      },
    ]);

    setInput("");
    setIsGenerated(false);
    setSaved(false);
  };

  const generateDesign = () => {
    setIsGenerating(true);
    setIsGenerated(false);

    // Demo-only generation delay.
    window.setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now(),
          role: "assistant",
          content:
            "Your demo design is ready! You can preview it below, simulate downloading it, or ask for another version.",
        },
      ]);
    }, 1200);
  };

  const usePrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleImageUpload = (
    files: FileList | null,
    type: "reference" | "image",
  ) => {
    if (!files) return;

    const selectedFiles = Array.from(files);

    const validFiles = selectedFiles.filter(
      (file) =>
        ["image/png", "image/jpeg", "image/webp"].includes(file.type) &&
        file.size <= 5 * 1024 * 1024,
    );

    if (validFiles.length !== selectedFiles.length) {
      alert("Only PNG, JPG, and WebP images up to 5 MB are supported.");
    }

    if (type === "reference") {
      setReferenceImages((previous) => [...previous, ...validFiles]);
    } else {
      setUploadedImages((previous) => [...previous, ...validFiles]);
    }
  };

  const removeImage = (index: number, type: "reference" | "image") => {
    if (type === "reference") {
      setReferenceImages((previous) => previous.filter((_, i) => i !== index));
    } else {
      setUploadedImages((previous) => previous.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-8">
      {/* Page introduction */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <Sparkles className="h-4 w-4" />
          AI POWERED DESIGN
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Create graphics with AI
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Describe your idea, have a conversation with your AI assistant, and
          create promotional graphics for your business.
        </p>
      </div>

      {/* Main chat area */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold">AI Design Assistant</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Ready to create
              </p>
            </div>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            Demo mode
          </span>
        </div>

        {/* Messages */}
        <div className="max-h-[520px] min-h-[300px] space-y-5 overflow-y-auto p-4 sm:p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "assistant"
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                  message.role === "assistant"
                    ? "rounded-tl-sm bg-muted"
                    : "rounded-tr-sm bg-blue-600 text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
                Creating your design...
              </div>
            </div>
          )}
        </div>

        {/* Prompt suggestions */}
        <div className="border-t border-border px-4 py-4 sm:px-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            TRY AN EXAMPLE
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {examplePrompts.map((example) => {
              const Icon = example.icon;

              return (
                <button
                  key={example.title}
                  type="button"
                  onClick={() => usePrompt(example.prompt)}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-blue-400 hover:bg-muted/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{example.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {example.description}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Message input */}
        <div className="border-t border-border bg-muted/30 p-4 sm:p-6">
          <label className="mb-2 block text-sm font-semibold">
            What would you like to create?
          </label>

          <div className="rounded-xl border border-border bg-background p-3 shadow-sm transition-colors focus-within:border-blue-500">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={3}
              placeholder="Describe your promotion, product, campaign, or design idea..."
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />

            {(referenceImages.length > 0 || uploadedImages.length > 0) && (
              <div className="mt-3 space-y-3">
                {[
                  {
                    title: "Reference images",
                    files: referenceImages,
                    type: "reference" as const,
                  },
                  {
                    title: "Images to include",
                    files: uploadedImages,
                    type: "image" as const,
                  },
                ].map(({ title, files, type }) =>
                  files.length > 0 ? (
                    <div key={type}>
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">
                        {title} ({files.length})
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="relative h-20 w-20 overflow-hidden rounded-lg border border-border"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => removeImage(index, type)}
                              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  hidden
                  onChange={(event) => {
                    handleImageUpload(event.target.files, "reference");
                    event.target.value = "";
                  }}
                />

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  hidden
                  onChange={(event) => {
                    handleImageUpload(event.target.files, "image");
                    event.target.value = "";
                  }}
                />

                <button
                  type="button"
                  onClick={() => referenceInputRef.current?.click()}
                  title="Attach reference image"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  title="Add image to design"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>

                <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                  Enter to send · Shift + Enter for new line
                </span>
              </div>

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            You can describe everything in one message. The assistant will ask
            follow-up questions only when more information is needed.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Demo responses only. No API calls are made.
            </span>

            <button
              type="button"
              onClick={generateDesign}
              disabled={
                messages.length < 2 ||
                isGenerating ||
                messages[messages.length - 1]?.role === "user"
              }
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <WandSparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Design"}
            </button>
          </div>
        </div>
      </div>

      {/* Generated preview */}
      {isGenerated && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Generated design</h2>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your demo graphic is ready to preview.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Completed
            </span>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <DesignArtwork
              title="Mega Sale"
              subtitle="Festive Season Sale"
              discount="30% OFF"
              background="from-red-950 via-red-800 to-amber-600"
              accent="text-amber-300"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Instagram portrait
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Demo graphic
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                alert("Demo: Download functionality will be integrated later.")
              }
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              type="button"
              onClick={generateDesign}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>

            <button
              type="button"
              onClick={() => setSaved(true)}
              disabled={saved}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              {saved ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {saved ? "Saved" : "Save to My Designs"}
            </button>

            <button
              type="button"
              onClick={() =>
                document.querySelector<HTMLTextAreaElement>("textarea")?.focus()
              }
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <MessageSquare className="h-4 w-4" />
              Improve with AI
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">How it works</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create professional graphics in just a few simple steps.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {instructionSteps.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-border bg-card p-5"
            >
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {step.number}
              </p>
              <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Helpful tips */}
      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="text-sm font-semibold">Tip for better designs</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Include your business name, offer details, preferred colors, and
            where you plan to share the graphic. The more useful details you
            provide, the better the result can match your expectations.
          </p>
        </div>
      </div>
    </div>
  );
}

function MyDesignsTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Designs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage your previously generated graphics.
          </p>
        </div>

        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {demoDesigns.length} demo designs
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All designs", "Festival", "Product", "Restaurant"].map(
          (filter, index) => (
            <button
              key={filter}
              type="button"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                index === 0
                  ? "bg-blue-600 text-white"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {filter}
            </button>
          ),
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demoDesigns.map((design) => (
          <div
            key={design.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="p-3">
              <DesignArtwork
                title={design.discount}
                subtitle={design.subtitle}
                discount={design.title}
                background={design.background}
                accent={design.accent}
              />
            </div>

            <div className="space-y-3 px-4 pb-4">
              <div>
                <h3 className="text-sm font-semibold">{design.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {design.category} · {design.date}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => alert(`Previewing: ${design.title}`)}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Demo: Download will be implemented during integration.",
                    )
                  }
                  className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type AISettings = {
  configured: boolean;
  enabled: boolean;
  maskedKey: string | null;
  lastVerifiedAt: string | null;
  updatedAt: string | null;
};

function AISettingsTab() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/ai-design/settings", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Unable to load AI settings.");
      }

      setSettings(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load AI settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleVerifyAndSave = async () => {
    if (!apiKey.trim() && !settings?.configured) {
      setError("Please enter your OpenAI API key.");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setSuccess("");

      // Step 1: Verify the new key or the previously saved key.
      const verifyRes = await fetch("/api/ai-design/settings/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });

      const verifyJson = await verifyRes.json();

      if (!verifyRes.ok || !verifyJson.data?.ok) {
        throw new Error(verifyJson.error || "API key verification failed.");
      }

      // Step 2: Save only after successful verification.
      if (apiKey.trim()) {
        const saveRes = await fetch("/api/ai-design/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: apiKey.trim(),
          }),
        });

        const saveJson = await saveRes.json();

        if (!saveRes.ok) {
          throw new Error(saveJson.error || "Unable to save API key.");
        }
      }

      setApiKey("");
      setSuccess(
        apiKey.trim()
          ? "API key verified and saved successfully."
          : "Your existing API key is valid.",
      );

      await fetchSettings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while verifying the API key.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/ai-design/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !settings.enabled,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Unable to update AI settings.");
      }

      await fetchSettings();

      setSuccess(
        !settings.enabled
          ? "AI Design has been enabled."
          : "AI Design has been disabled.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update settings.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!window.confirm("Are you sure you want to remove your API key?")) {
      return;
    }

    try {
      setRemoving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/ai-design/settings", {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Unable to remove API key.");
      }

      setApiKey("");
      setShowKey(false);

      await fetchSettings();

      setSuccess("API key removed successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove API key.",
      );
    } finally {
      setRemoving(false);
    }
  };

  const status = settings?.configured
    ? settings.enabled
      ? "Connected"
      : "Disabled"
    : "Not connected";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the OpenAI API connection used for AI graphic generation.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">OpenAI API Connection</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Used for generating promotional graphics.
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              settings?.configured && settings.enabled
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {loading ? "Loading..." : status}
          </span>
        </div>

        <div className="my-6 border-t border-border" />

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold">API Key</label>

            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Get API Key
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder={
                settings?.maskedKey
                  ? `Saved key: ${settings.maskedKey}`
                  : "Enter your OpenAI API key"
              }
              disabled={loading || verifying}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 pr-11 text-sm outline-none transition-colors focus:border-blue-500 disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => setShowKey((previous) => !previous)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            {settings?.configured
              ? "A key is already saved securely. Enter a new key only if you want to replace it."
              : "Enter your OpenAI API key. It will be securely stored by the backend."}
          </p>

          {settings?.lastVerifiedAt && (
            <p className="text-xs text-muted-foreground">
              Last verified:{" "}
              {new Date(settings.lastVerifiedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleVerifyAndSave}
            disabled={loading || verifying || removing}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying && <RefreshCw className="h-4 w-4 animate-spin" />}
            {verifying
              ? "Verifying..."
              : settings?.configured
                ? apiKey.trim()
                  ? "Verify & Replace Key"
                  : "Verify Existing Key"
                : "Verify & Save"}
          </button>

          {settings?.configured && (
            <>
              <button
                type="button"
                onClick={handleToggleEnabled}
                disabled={loading || updating || removing}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {updating
                  ? "Updating..."
                  : settings.enabled
                    ? "Disable AI"
                    : "Enable AI"}
              </button>

              <button
                type="button"
                onClick={handleRemoveConnection}
                disabled={loading || removing || updating}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30 disabled:opacity-50"
              >
                {removing ? "Removing..." : "Remove connection"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Important information</h3>
        </div>

        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <li>• You need an OpenAI API account and API key.</li>
          <li>• API usage is billed separately through your OpenAI account.</li>
          <li>
            • Image-generation credentials are separate from your existing AI
            Insights provider settings.
          </li>
          <li>
            • Your API key is never stored in browser storage or exposed in
            frontend code.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-dashed border-border p-5">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Usage information</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Generation count and API usage information can be integrated once
              the backend exposes usage statistics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesignStudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("create");

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <WandSparkles className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-lg font-bold">AI Design Studio</h1>
            <p className="text-xs text-muted-foreground">
              Your creative assistant
            </p>
          </div>
        </div>

        <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1 sm:w-auto">
          {designTabs.map((tab) => {
            const Icon =
              tab.id === "create"
                ? MessageSquare
                : tab.id === "designs"
                  ? Images
                  : Settings;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "create" && <CreateDesignTab />}
      {activeTab === "designs" && <MyDesignsTab />}
      {activeTab === "settings" && <AISettingsTab />}
    </main>
  );
}
