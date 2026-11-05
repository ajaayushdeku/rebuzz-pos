import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  ImagePlus,
  Lightbulb,
  MessageSquare,
  Paperclip,
  Plus,
  Power,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  User,
  WandSparkles,
  X,
} from "lucide-react";
import { examplePrompts, instructionSteps } from "../design-studio/mock-data";
import { DesignTabHeader } from "./DesignTabHeader";
import { getAiDesignErrorInfo } from "./formatAiDesignError";
import type { AiDesignErrorInfo } from "./formatAiDesignError";
import { ChatMessage } from "@/app/(app)/ai-design/page";
import { useEffect, useRef, useState } from "react";

type GeneratedImage = {
  b64Json: string;
  revisedPrompt: string | null;
  mimeType: string;
};

type GenerateResponse = {
  success: boolean;
  needsClarification?: boolean;
  briefReady?: boolean;
  followUpQuestion?: string;
  context?: Record<string, unknown>;
  message?: string;
  images?: GeneratedImage[];
  design?: {
    prompt: string;
    metadata?: Record<string, unknown>;
  };
  generation?: {
    model: string;
    size: string;
    quality: string | null;
    outputFormat: string;
    created: number;
  };
  error?: string;
  detail?: string;
  providerCode?: string | number;
  status?: number;
  requestId?: string;
};

type FailedGenerateRequest = {
  prompt: string;
  conversationHistory: ChatMessage[];
  generateImage: boolean;
  previousContext: Record<string, unknown> | null;
  referenceImages: File[];
  uploadedImages: File[];
};

class AiDesignRequestError extends Error {
  info: AiDesignErrorInfo;

  constructor(info: AiDesignErrorInfo) {
    super(info.message);
    this.name = "AiDesignRequestError";
    this.info = info;
  }
}

function ImageFilePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
      {preview && (
        <img
          src={preview}
          alt={file.name}
          className="h-full w-full object-cover"
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function CreateDesignTab({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const [input, setInput] = useState("");
  const [examplesExpanded, setExamplesExpanded] = useState(true);
  const [cloudflareConfigured, setCloudflareConfigured] = useState<
    boolean | null
  >(null);

  const [cloudflareEnabled, setCloudflareEnabled] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm your AI Design Assistant. Tell me what kind of graphic you'd like to create. You can describe a promotion, showcase a product, or share an announcement. I'll help turn your idea into a design!",
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generationInfo, setGenerationInfo] =
    useState<GenerateResponse["generation"]>(undefined);
  const [previousContext, setPreviousContext] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [designBrief, setDesignBrief] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [error, setError] = useState("");

  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const failedRequestRef = useRef<FailedGenerateRequest | null>(null);

  const referenceInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startNewChat = () => {
    if (isGenerating) return;

    setMessages([
      {
        id: 1,
        role: "assistant",
        content:
          "Hi! I'm your AI Design Assistant. Tell me what kind of graphic you'd like to create. You can describe a promotion, showcase a product, or share an announcement. I'll help turn your idea into a design!",
      },
    ]);
    setInput("");
    setGeneratedImages([]);
    setGenerationInfo(undefined);
    setPreviousContext(null);
    setDesignBrief(null);
    setError("");
    failedRequestRef.current = null;
    setReferenceImages([]);
    setUploadedImages([]);
    if (referenceInputRef.current) referenceInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
    textareaRef.current?.focus();
  };

  useEffect(() => {
    let cancelled = false;

    const loadAiSettings = async () => {
      try {
        const response = await fetch("/api/ai-design/settings", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error("Unable to load AI settings.");
        }

        if (!cancelled) {
          setCloudflareConfigured(Boolean(result.data?.configured));
          setCloudflareEnabled(!!result.data?.enabled);
        }
      } catch {
        if (!cancelled) {
          setCloudflareConfigured(false);
          setCloudflareEnabled(false);
        }
      }
    };

    void loadAiSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeWorkflowStep =
    generatedImages.length > 0 || isGeneratingImage ? 3 : designBrief ? 2 : 1;
  const generationStatus = isGeneratingImage
    ? "Generating your graphic..."
    : "Preparing your design brief...";
  const chatStatus = isGenerating
    ? generationStatus
    : cloudflareConfigured === null
      ? "Checking Cloudflare setup..."
      : cloudflareConfigured && cloudflareEnabled
        ? "Ready to create"
        : cloudflareConfigured
          ? "AI is disabled — enable it in AI Settings"
          : "Connect your Cloudflare account to get started";

  const workflowSteps = [
    {
      number: 1,
      title: "Describe",
      detail: "Share your idea",
      icon: MessageSquare,
    },
    {
      number: 2,
      title: "Review brief",
      detail: "Check the details",
      icon: ClipboardCheck,
    },
    {
      number: 3,
      title: "Generate",
      detail: "Create your graphic",
      icon: WandSparkles,
    },
  ];

  const generateDesign = async (
    prompt: string,
    conversationHistory: ChatMessage[],
    generateImage = false,
    retryRequest?: FailedGenerateRequest,
  ) => {
    if (isGenerating || !prompt.trim()) return;

    const requestContext = retryRequest?.previousContext ?? previousContext;
    const requestSnapshot: FailedGenerateRequest = retryRequest
      ? { ...retryRequest, previousContext: requestContext }
      : {
          prompt,
          conversationHistory: [...conversationHistory],
          generateImage,
          previousContext: requestContext,
          referenceImages: [...referenceImages],
          uploadedImages: [...uploadedImages],
        };

    if (requestSnapshot.generateImage && !requestContext) {
      setError("Please prepare your design brief before generating.");
      return;
    }

    setIsGenerating(true);
    setIsGeneratingImage(requestSnapshot.generateImage);
    setError("");
    if (retryRequest) {
      setMessages((previous) => previous.filter((message) => !message.error));
    }

    try {
      const formData = new FormData();

      formData.append("prompt", requestSnapshot.prompt);
      formData.append(
        "generateImage",
        requestSnapshot.generateImage ? "true" : "false",
      );

      formData.append(
        "conversationHistory",
        JSON.stringify(
          requestSnapshot.conversationHistory.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ),
      );

      if (requestSnapshot.previousContext) {
        formData.append(
          "previousContext",
          JSON.stringify(requestSnapshot.previousContext),
        );
      }

      requestSnapshot.referenceImages.forEach((file) => {
        formData.append("referenceImages", file);
      });

      requestSnapshot.uploadedImages.forEach((file) => {
        formData.append("assets", file);
      });

      const response = await fetch("/api/ai-design/generate", {
        method: "POST",
        body: formData,
      });

      const result: GenerateResponse = await response
        .json()
        .catch(() => ({}) as GenerateResponse);

      if (!response.ok || !result.success) {
        const errorInfo = getAiDesignErrorInfo(
          {
            ...result,
            status: response.status,
          },
          "Unable to process your design request. Please try again.",
        );

        throw new AiDesignRequestError(errorInfo);
      }

      // 1. AI needs additional information.
      if (result.needsClarification) {
        failedRequestRef.current = null;

        if (result.context) {
          setPreviousContext(result.context);
        }

        setDesignBrief(null);

        setMessages((previous) => [
          ...previous,
          {
            id: Date.now(),
            role: "assistant",
            content:
              result.followUpQuestion ||
              "Could you provide a little more information about your design?",
          },
        ]);

        return;
      }

      // 2. The brief is ready, but no image has been generated yet.
      if (result.briefReady) {
        if (!result.context) {
          throw new Error("The AI did not return a valid design brief.");
        }

        failedRequestRef.current = null;
        setPreviousContext(result.context);
        setDesignBrief(result.context);

        setMessages((previous) => [
          ...previous,
          {
            id: Date.now(),
            role: "assistant",
            content:
              result.message ||
              "Your design brief is ready! Please review it below and generate your design when you're happy with it.",
          },
        ]);

        return;
      }

      // 3. Image generation completed.
      if (!result.images?.length) {
        throw new Error("The AI response did not contain a generated image.");
      }

      failedRequestRef.current = null;
      setGeneratedImages(result.images);
      setGenerationInfo(result.generation);

      if (result.context) {
        setPreviousContext(result.context);
        setDesignBrief(result.context);
      }

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now(),
          role: "assistant",
          content:
            result.message ||
            "Your design has been generated successfully! You can preview and download it below.",
        },
      ]);
    } catch (err) {
      const fallbackMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong while generating your design.";

      const errorInfo =
        err instanceof AiDesignRequestError
          ? err.info
          : getAiDesignErrorInfo(
              {
                error: err instanceof TypeError ? "NETWORK_ERROR" : undefined,
                message: fallbackMessage,
              },
              "Something went wrong while generating your design.",
            );

      failedRequestRef.current = requestSnapshot;
      setError(errorInfo.message);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now(),
          role: "assistant",
          content: errorInfo.message,
          error: {
            category: errorInfo.category,
            title: errorInfo.title,
            advice: errorInfo.advice,
            requestId: errorInfo.requestId,
          },
        },
      ]);
    } finally {
      setIsGenerating(false);
      setIsGeneratingImage(false);
    }
  };

  const retryLastRequest = () => {
    const failedRequest = failedRequestRef.current;

    if (!failedRequest || isGenerating) return;

    setMessages((previous) => previous.filter((message) => !message.error));

    void generateDesign(
      failedRequest.prompt,
      failedRequest.conversationHistory,
      failedRequest.generateImage,
      failedRequest,
    );
  };

  const sendMessage = async (message?: string) => {
    const text = (message ?? input).trim();

    if (!text || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    // Exclude the initial welcome message.
    // Include all previous user and assistant messages.
    const conversationHistory = messages.slice(1);

    // Add the user's message to the chat immediately.
    setMessages((previous) => [
      ...previous.filter((message) => !message.error),
      userMessage,
    ]);

    setInput("");
    setError("");
    failedRequestRef.current = null;
    setGeneratedImages([]);
    setGenerationInfo(undefined);
    setDesignBrief(null);

    // Automatically call the backend.
    await generateDesign(text, conversationHistory);
  };

  const handleGenerateDesign = () => {
    if (!previousContext || isGenerating) return;

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!latestUserMessage) return;

    generateDesign(latestUserMessage.content, [], true);
  };

  const usePrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleImageUpload = (
    files: FileList | null,
    type: "reference" | "image",
  ) => {
    if (!files) return;

    const selectedFiles = Array.from(files);

    const currentFiles =
      type === "reference" ? referenceImages : uploadedImages;

    const maxCategoryCount = type === "reference" ? 3 : 5;

    const totalUploaded = referenceImages.length + uploadedImages.length;
    const remainingTotalSlots = Math.max(0, 4 - totalUploaded);

    const remainingCategorySlots = Math.max(
      0,
      maxCategoryCount - currentFiles.length,
    );

    const validFiles = selectedFiles.filter(
      (file) =>
        ["image/png", "image/jpeg", "image/webp"].includes(file.type) &&
        file.size <= 5 * 1024 * 1024,
    );

    if (validFiles.length !== selectedFiles.length) {
      alert("Only PNG, JPG, and WebP images up to 5 MB are supported.");
    }

    const availableSlots = Math.min(
      remainingTotalSlots,
      remainingCategorySlots,
    );

    if (validFiles.length > availableSlots) {
      alert(
        `You can upload a maximum of 4 images in total, with up to ${
          type === "reference" ? "3 reference images" : "5 design assets"
        }.`,
      );
    }

    const filesToAdd = validFiles.slice(0, availableSlots);

    if (type === "reference") {
      setReferenceImages((previous) => [...previous, ...filesToAdd]);
    } else {
      setUploadedImages((previous) => [...previous, ...filesToAdd]);
    }
  };

  const removeImage = (index: number, type: "reference" | "image") => {
    if (type === "reference") {
      setReferenceImages((previous) => previous.filter((_, i) => i !== index));
    } else {
      setUploadedImages((previous) => previous.filter((_, i) => i !== index));
    }
  };

  const downloadImage = (image: GeneratedImage, index: number) => {
    const link = document.createElement("a");

    const extensionByMimeType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension =
      extensionByMimeType[image.mimeType.toLowerCase()] || "png";

    link.href = `data:${image.mimeType};base64,${image.b64Json}`;
    link.download = `ai-design-${index + 1}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const latestErrorMessageId = [...messages]
    .reverse()
    .find((message) => message.error)?.id;

  return (
    <div className="space-y-8">
      <DesignTabHeader
        eyebrow={
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            AI POWERED DESIGN
          </>
        }
        title="Create graphics with AI"
        description="Describe your idea, have a conversation with your AI assistant, and create promotional graphics for your business."
      />

      <nav aria-label="Design creation steps" className="relative rounded-2xl ">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[0%] right-[50%] top-1/2 z-0 h-[3px] -translate-y-1/2 rounded-full bg-slate-200/90 dark:bg-slate-800"
        >
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 transition-[width] duration-700 ease-out motion-reduce:transition-none after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-r after:from-blue-400 after:to-fuchsia-400 after:opacity-70 after:blur-[3px]"
            style={{
              width: `${(activeWorkflowStep - 1) * 100}%`,
            }}
          />
        </div>
        <ol className="relative z-10 grid grid-cols-3 gap-15 sm:gap-10">
          {workflowSteps.map((step) => {
            const isComplete =
              generatedImages.length > 0
                ? step.number < activeWorkflowStep || step.number === 3
                : step.number < activeWorkflowStep;
            const isActive = !isComplete && step.number === activeWorkflowStep;
            const StepIcon = step.icon;

            return (
              <li
                key={step.number}
                aria-current={isActive ? "step" : undefined}
                className={`group relative min-w-0 overflow-hidden rounded-xl border p-2.5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 sm:p-3 ${
                  isComplete
                    ? "border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-background dark:border-emerald-900 dark:from-emerald-950/80 dark:to-card"
                    : isActive
                      ? "border-blue-300 bg-gradient-to-br from-blue-100/90 via-violet-50/80 to-background ring-1 ring-blue-200/60 dark:border-blue-800 dark:from-blue-950/80 dark:via-violet-950/40 dark:to-card dark:ring-blue-900/50"
                      : "border-border/80 bg-background/60 hover:border-blue-200 hover:bg-blue-50/60 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                  <span
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                      isComplete
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                        : isActive
                          ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white"
                          : "bg-muted text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-300"
                    }`}
                  >
                    <StepIcon
                      className="h-[18px] w-[18px]"
                      aria-hidden="true"
                    />
                    {isComplete && (
                      <CheckCircle2
                        className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-background text-emerald-600 dark:bg-card"
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
                      Step 0{step.number}
                      {isActive && (
                        <span
                          className="relative flex h-2 w-2"
                          aria-hidden="true"
                        >
                          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60 motion-safe:animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-0.5 hidden sm:block truncate text-xs font-semibold sm:text-sm ${
                        isComplete
                          ? "text-emerald-800 dark:text-emerald-300"
                          : isActive
                            ? "text-blue-800 dark:text-blue-300"
                            : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="mt-0.5 hidden text-xs text-muted-foreground md:block">
                      {step.detail}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {(designBrief || generatedImages.length > 0) && (
        <div className="flex justify-end xl:hidden">
          <a
            href="#design-output"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-blue-700 hover:bg-muted dark:text-blue-300"
          >
            {generatedImages.length > 0
              ? "Jump to generated design"
              : "Jump to design brief"}
          </a>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        {/* Main chat area */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* Chat header */}
          <div className="relative flex flex-col gap-3 overflow-hidden border-b border-blue-100 bg-gradient-to-r from-blue-50 via-violet-50/70 to-background px-4 py-4 dark:border-blue-950 dark:from-blue-950/40 dark:via-violet-950/20 dark:to-card sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl"
            />
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-600/20">
                <Bot className="h-5 w-5" aria-hidden="true" />
                <Sparkles
                  className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-background p-0.5 text-violet-500 dark:bg-card dark:text-white"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight">
                  Let’s create something
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your creative partner for business graphics
                </p>
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isGenerating
                        ? "animate-pulse bg-amber-500"
                        : cloudflareConfigured === null
                          ? "animate-pulse bg-slate-400"
                          : cloudflareConfigured && cloudflareEnabled
                            ? "bg-emerald-500"
                            : cloudflareConfigured
                              ? "bg-amber-500"
                              : "bg-rose-500"
                    }`}
                  />
                  {chatStatus}
                </p>
              </div>
            </div>

            <div className="flex flex-row-reverse sm:flex-col items-end justify-start sm:justify-end gap-3">
              <button
                type="button"
                onClick={startNewChat}
                disabled={isGenerating}
                className="inline-flex h-7.5 items-center justify-center gap-2 rounded-full  border border-blue-700 bg-blue-600 px-3.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:border-blue-800 hover:bg-blue-700 hover:shadow-md active:scale-[0.97] cursor-pointer disabled:pointer-events-none disabled:opacity-50 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>New Chat</span>
              </button>

              <div
                className={`inline-flex w-fit flex-row items-center justify-end gap-1.5 rounded-full border px-3 py-0.5 text-[11px] sm:text-[11.5px] font-medium shadow-sm ${
                  cloudflareConfigured === null
                    ? "border-border bg-background/70 text-muted-foreground"
                    : cloudflareConfigured && cloudflareEnabled
                      ? "border-blue-200/80 bg-white/80 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
                      : "border-amber-200 bg-amber-50/90 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {cloudflareConfigured === null ? (
                  <>
                    <RefreshCw
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    Checking Cloudflare setup
                  </>
                ) : cloudflareConfigured && cloudflareEnabled ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Cloudflare connected
                  </>
                ) : cloudflareConfigured ? (
                  <>
                    <Power className="h-3.5 w-3.5" aria-hidden="true" />
                    Cloudflare connected · AI disabled
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      aria-label="Open AI Settings to enable AI"
                      title="Open AI Settings to enable AI"
                      className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-amber-900 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-1 dark:bg-amber-900/70 dark:text-amber-100 dark:hover:bg-amber-800 cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                    Connect your Cloudflare account
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      aria-label="Open AI Settings"
                      title="Open AI Settings"
                      className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-amber-900 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-1 dark:bg-amber-900/70 dark:text-amber-100 dark:hover:bg-amber-800 cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </div>
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

                {message.error ? (
                  <div className="max-w-[90%] rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/70 dark:bg-amber-950/30 sm:max-w-[85%]">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-amber-900 dark:text-amber-200">
                          {message.error.title}
                        </p>
                        <p className="mt-1 leading-relaxed text-amber-800 dark:text-amber-300">
                          {message.content ||
                            (message.error.category === "safety"
                              ? "The provider couldn't generate this particular image."
                              : "The request could not be completed.")}
                        </p>
                        <p className="mt-2 leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                          {message.error.advice}
                        </p>
                        {message.error.requestId && (
                          <p className="mt-3 break-all text-[11px] text-amber-700/80 dark:text-amber-400/80">
                            Request ID: {message.error.requestId}
                          </p>
                        )}
                        {message.id === latestErrorMessageId && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={retryLastRequest}
                              disabled={isGenerating}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`}
                              />
                              {isGenerating ? "Retrying..." : "Try again"}
                            </button>
                            {(message.error.category === "authentication" ||
                              message.error.category === "permission") && (
                              <button
                                type="button"
                                onClick={onOpenSettings}
                                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-background px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950"
                              >
                                <Settings className="h-3.5 w-3.5" />
                                AI Settings
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                      message.role === "assistant"
                        ? "rounded-tl-sm bg-muted"
                        : "rounded-tr-sm bg-blue-600 text-white"
                    }`}
                  >
                    {message.content}
                  </div>
                )}
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
                  {generationStatus}
                </div>
              </div>
            )}
          </div>

          {/* Prompt suggestions */}
          <div className="border-t border-border bg-gradient-to-b from-muted/35 to-background px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                aria-expanded={examplesExpanded}
                aria-controls="design-example-prompts"
                onClick={() => setExamplesExpanded((expanded) => !expanded)}
                className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wide text-foreground">
                    Need a little inspiration?
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Choose a starting point and make it your own.
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${examplesExpanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <span className="hidden sm:block rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
                QUICK STARTS
              </span>
            </div>

            <div
              id="design-example-prompts"
              aria-hidden={!examplesExpanded}
              inert={!examplesExpanded}
              className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none"
              style={{
                gridTemplateRows: examplesExpanded ? "1fr" : "0fr",
                opacity: examplesExpanded ? 1 : 0,
              }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {examplePrompts.map((example) => {
                    const Icon = example.icon;

                    return (
                      <button
                        key={example.title}
                        type="button"
                        onClick={() => usePrompt(example.prompt)}
                        disabled={isGenerating}
                        className="group flex items-center gap-3 rounded-xl border border-border/80 bg-card/80 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:hover:translate-y-0 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 text-blue-700 transition-transform duration-200 group-hover:scale-105 dark:from-blue-950 dark:to-violet-950 dark:text-blue-300">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium transition-colors group-hover:text-blue-800 dark:group-hover:text-blue-300">
                            {example.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {example.description}
                          </p>
                        </div>

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-all group-hover:bg-blue-600 group-hover:text-white">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Message input */}
          <div className="border-t border-border bg-muted/30 p-4 sm:p-6">
            <label className="mb-2 block text-sm font-semibold">
              What would you like to create?
            </label>

            <p className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-relaxed text-muted-foreground">
              <span>
                <Paperclip className="mr-1 inline h-3 w-3" aria-hidden="true" />
                Style references: {referenceImages.length}/3
              </span>

              <span>
                <ImagePlus className="mr-1 inline h-3 w-3" aria-hidden="true" />
                Design assets: {uploadedImages.length}/5
              </span>

              <span className="font-medium text-foreground">
                Total: {referenceImages.length + uploadedImages.length}/4 images
              </span>

              <span>PNG, JPG or WebP · up to 5 MB each</span>
            </p>

            <div className="rounded-xl border border-border bg-background p-3 shadow-sm transition-colors focus-within:border-blue-500">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={3}
                maxLength={6000}
                disabled={isGenerating}
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
                            <ImageFilePreview
                              key={`${file.name}-${index}`}
                              file={file}
                              onRemove={() => removeImage(index, type)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-3 flex-row items-end justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                    disabled={
                      isGenerating ||
                      referenceImages.length >= 3 ||
                      referenceImages.length + uploadedImages.length >= 4
                    }
                    title={`Add style reference image (${referenceImages.length} of 3)`}
                    aria-label={`Add style reference image, ${referenceImages.length} of 3 added`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                  >
                    <Paperclip className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={
                      isGenerating ||
                      uploadedImages.length >= 5 ||
                      referenceImages.length + uploadedImages.length >= 4
                    }
                    title={`Add image to design (${uploadedImages.length} of 5)`}
                    aria-label={`Add image to design, ${uploadedImages.length} of 5 added`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-violet-900 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isGenerating}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating
                    ? isGeneratingImage
                      ? "Generating..."
                      : "Preparing brief..."
                    : "Send"}
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              You can describe everything in one message. The assistant will ask
              follow-up questions only when more information is needed.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        <aside
          id="design-output"
          aria-label="Design brief and generated result"
          className={`scroll-mt-6 space-y-6 ${
            generatedImages.length === 0
              ? "xl:sticky xl:top-6 xl:self-start"
              : ""
          }`}
        >
          {/* Design brief review */}
          {designBrief && (
            <div className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Review your design brief
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The AI has prepared your design requirements. Review the
                    details before generating the final graphic.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Design type", key: "designType" },
                  { label: "Platform", key: "platform" },
                  { label: "Dimensions", key: "dimensions" },
                  { label: "Style", key: "style" },
                  { label: "Target audience", key: "targetAudience" },
                  { label: "Brand name", key: "brandName" },
                ].map(({ label, key }) => {
                  const value = designBrief[key];

                  if (value === undefined || value === null || value === "") {
                    return null;
                  }

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-border bg-muted/30 p-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {Array.isArray(designBrief.requiredText) &&
                designBrief.requiredText.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      Required text
                    </h3>

                    <div className="space-y-2">
                      {designBrief.requiredText.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            {typeof item === "string"
                              ? item
                              : JSON.stringify(item)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {typeof designBrief.additionalInstructions === "string" &&
                designBrief.additionalInstructions && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      Additional instructions
                    </h3>
                    <p className="rounded-lg bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
                      {designBrief.additionalInstructions}
                    </p>
                  </div>
                )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  You can still provide more instructions in the chat before
                  generating.
                </p>

                <button
                  type="button"
                  onClick={handleGenerateDesign}
                  disabled={isGenerating}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <WandSparkles className="h-4 w-4" />
                  {isGenerating ? "Generating graphic..." : "Generate Design"}
                </button>
              </div>
            </div>
          )}

          {/* Generated preview */}
          {generatedImages.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Generated design</h2>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Your AI-generated graphic is ready to preview.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Completed
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {generatedImages.map((image, index) => (
                  <div key={`${index}-${image.mimeType}`} className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-border bg-muted">
                      <img
                        src={`data:${image.mimeType};base64,${image.b64Json}`}
                        alt={`Generated design ${index + 1}`}
                        className="h-auto w-full object-contain"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadImage(image, index)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      Download{" "}
                      {generatedImages.length > 1
                        ? `Image ${index + 1}`
                        : "Design"}
                    </button>

                    {image.revisedPrompt && (
                      <p className="text-xs leading-5 text-muted-foreground">
                        <span className="font-semibold">Generated prompt:</span>{" "}
                        {image.revisedPrompt}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {generationInfo && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {generationInfo.model}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {generationInfo.size}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {generationInfo.outputFormat.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">
                    What would you like to do next?
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Regenerate from this brief, or request a change in chat. The
                    assistant updates the brief for you to review before
                    creating a new graphic.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Your current preview stays visible if a new generation fails
                    and is replaced only after a new image is generated
                    successfully.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const latestUserIndex = messages
                        .map((message) => message.role)
                        .lastIndexOf("user");

                      if (latestUserIndex === -1) return;

                      const latestPrompt = messages[latestUserIndex].content;
                      const conversationHistory = messages.slice(
                        1,
                        latestUserIndex,
                      );

                      generateDesign(latestPrompt, conversationHistory, true);
                    }}
                    disabled={isGenerating}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const textarea = textareaRef.current;
                      if (!textarea) return;

                      textarea.scrollIntoView({
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "auto"
                          : "smooth",
                        block: "center",
                      });
                      textarea.focus({ preventScroll: true });
                    }}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Request a change
                  </button>
                </div>
              </div>
            </div>
          )}
          {!designBrief && generatedImages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/70 p-6 sm:p-8">
              <div className="mx-auto max-w-sm space-y-2 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <WandSparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-sm font-semibold">
                  Your design will appear here
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Describe what you want to create. Once the brief is ready, you
                  can review it here before generating the graphic.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

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
