"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  Flag,
  ArrowLeft,
} from "lucide-react";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

type StoryView = "live" | "yesterday";

type StorySegment = {
  text: string;
  color: "default" | "green" | "red";
};

type Story = {
  view: StoryView;
  title: string;
  subtitle: string;
  vibe: string;
  segments: StorySegment[];
  priority?: {
    label: string;
    text: string;
  };
};

const STORIES: Record<StoryView, Story> = {
  live: {
    view: "live",
    title: "Live Business Health",
    subtitle: "Synthesizing sales, inventory & customers",
    vibe: "🔥 TGIF 🎉",
    segments: [
      {
        text: "The morning rush was intense, but we're already at ",
        color: "default",
      },
      { text: "$8,000!", color: "green" },
      {
        text: " The team handled the pressure like absolute pros.",
        color: "green",
      },
      {
        text: "\n\nWe're using up a ton of backup paper cups though, and coffee beans are moving at 'Fast' velocity. ☕ We'll need to check stock levels carefully this afternoon.",
        color: "green",
      },
      {
        text: "\n\nThe vibe is great and customers are happy. I'll synthesize all today's data and send you the complete wrap-up at 4 PM.",
        color: "green",
      },
    ],
    priority: undefined,
  },
  yesterday: {
    view: "yesterday",
    title: "Yesterday's AI Analysis",
    subtitle: "Synthesizing sales, inventory & customers",
    vibe: "✨ Awesome vibes ✨",
    segments: [
      { text: "We finished Thursday at ", color: "default" },
      { text: "$12,700", color: "green" },
      {
        text: ". While slightly below our target, our profit margin was higher than usual because we sold a ton of high-margin seasonal iced drinks.",
        color: "red",
      },
      {
        text: "\n\nInventory check: We have plenty of stock across the board, but Caramel Syrup is totally full, so skip ordering that for now. 🧋",
        color: "default",
      },
      {
        text: " We did notice a slight dip in pastry sales, so we might have some day-old muffins to discount tomorrow.",
        color: "red",
      },
      {
        text: "\n\nWe had 14 new people sign up for rewards today! 🎁",
        color: "green",
      },
      {
        text: " However, just watch out for staffing costs–we had 4 people on the floor during the quiet mid-morning, which ate into our hourly profit.",
        color: "green",
      },
    ],
    priority: {
      label: "Top priority for tomorrow",
      text: "Adjust the schedule to cut one person from the 10 AM - 12 PM block, and put out a 'Day-Old Pastry' basket at the register for a quick upsell!",
    },
  },
};

const TEXT_COLORS = {
  default: "text-gray-800",
  green: "text-green-600",
  red: "text-red-500",
};

export default function AIBusinessStory() {
  const [view, setView] = useState<StoryView>("live");
  const [collapsed, setCollapsed] = useState(false);

  const story = STORIES[view];

  // Render story text with line breaks
  const renderSegments = (segments: StorySegment[]) => {
    const parts: React.ReactNode[] = [];
    segments.forEach((seg, i) => {
      const lines = seg.text.split("\n\n");
      lines.forEach((line, j) => {
        if (j > 0)
          parts.push(<br key={`br-${i}-${j}`} />, <br key={`br2-${i}-${j}`} />);
        if (line) {
          parts.push(
            <span key={`${i}-${j}`} className={TEXT_COLORS[seg.color]}>
              {line}
            </span>,
          );
        }
      });
    });
    return parts;
  };

  return (
    <div className="relative bg-white w-[60%] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <LockDimFeactureOverlay component_name="AI Business Story" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">{story.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{story.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-amber-50 border border-amber-100 text-amber-700 rounded-full px-3 py-1">
            {story.vibe}
          </span>
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Story body */}
      {!collapsed && (
        <div className="px-6 pb-4">
          <p className="text-sm leading-relaxed">
            {renderSegments(story.segments)}
          </p>

          {/* Priority block */}
          {story.priority && (
            <div className="mt-5 border-l-4 border-amber-400 pl-4 py-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Flag size={13} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-500">
                  {story.priority.label}
                </p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {story.priority.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer nav */}
      <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-center gap-4">
        {view === "live" ? (
          <>
            <button
              onClick={() => setView("yesterday")}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Read Yesterday&lsquo;s Full Story →
            </button>
            <button className="text-xs font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors">
              Show more to see full business details
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setView("live")}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={12} /> Back to Live Business Health
            </button>
            <button className="text-xs font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors">
              Show more to see full business details
            </button>
          </>
        )}
      </div>
    </div>
  );
}
