import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://manager.rebuzzpos.com/",
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
