import { Download, Eye } from "lucide-react";
import { demoDesigns } from "../design-studio/mock-data";
import { DesignArtwork } from "@/app/(app)/ai-design/page";
import { DesignTabHeader } from "./DesignTabHeader";

export function MyDesignsTab() {
  return (
    <div className="space-y-6">
      <DesignTabHeader
        title="My Designs"
        description="View and manage your previously generated graphics."
        actions={
          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {demoDesigns.length} demo designs
          </span>
        }
      />

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
