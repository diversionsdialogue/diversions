import rss from "@astrojs/rss";
import { getAllPosts } from "@/lib/data";

export async function GET(context) {
  const posts = await getAllPosts();
  posts.sort(
    (a, b) =>
      new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime(),
  );

  return rss({
    title: "Diversions — Blog",
    description:
      "Artikelen van Diversions over onderzoek, customer journeys, conversie-optimalisatie en online groei.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.pubDate),
      link: `/blog/${post.slug ?? post.id}/`,
    })),
    customData: `<language>nl-nl</language>`,
  });
}
