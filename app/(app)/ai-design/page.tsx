"use client";

import { useState } from "react";
import { MessageSquare, Images, Settings } from "lucide-react";

import { designTabs } from "@/components/design-studio/mock-data";
import { CreateDesignTab } from "@/components/ai-design/CreateDesignTab";
import { AISettingsTab } from "@/components/ai-design/AISettingsTab";
import { MyDesignsTab } from "@/components/ai-design/MyDesignsTab";
import PageHeader from "@/components/ui/PageHeader";

export type Tab = "create" | "designs" | "settings";

export type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

export function DesignArtwork({
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

// function UploadedImagePreview({
//   file,
//   onRemove,
// }: {
//   file: File;
//   onRemove: () => void;
// }) {
//   const [previewUrl, setPreviewUrl] = useState("");

//   useEffect(() => {
//     const url = URL.createObjectURL(file);
//     setPreviewUrl(url);

//     return () => URL.revokeObjectURL(url);
//   }, [file]);

//   return (
//     <div className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
//       {previewUrl && (
//         <img
//           src={previewUrl}
//           alt={file.name}
//           className="h-full w-full object-cover"
//         />
//       )}

//       <button
//         type="button"
//         onClick={onRemove}
//         aria-label={`Remove ${file.name}`}
//         className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-100 transition-opacity hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
//       >
//         <X className="h-3 w-3" />
//       </button>

//       <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-center text-[9px] text-white">
//         {file.name}
//       </div>
//     </div>
//   );
// }

export type AISettings = {
  configured: boolean;
  enabled: boolean;
  maskedAccountId: string | null;
  maskedApiToken: string | null;
  textModel: string | null;
  imageModel: string | null;
  lastVerifiedAt: string | null;
  updatedAt: string | null;
};

export default function DesignStudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("create");

  return (
    <div className="min-h-screen bg-surface-page px-6 py-5 sm:py-8  md:px-10 dark:bg-[#0f1420]">
      <div className="mx-auto w-full">
        <PageHeader
          title="AI Design Studio"
          subtitle=" Your creative assistant"
          spaceBelow={false}
          // flexItems="items-start flex-col"
          actionWidth="w-fit sm:w-full"
          actions={
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
                    <span className="hidden sm:block"> {tab.label}</span>
                  </button>
                );
              })}
            </div>
          }
        />
      </div>

      <div className="pt-4">
        {/* Tab content */}
        {activeTab === "create" && (
          <CreateDesignTab onOpenSettings={() => setActiveTab("settings")} />
        )}
        {activeTab === "designs" && <MyDesignsTab />}
        {activeTab === "settings" && <AISettingsTab />}
      </div>
    </div>
  );
}
