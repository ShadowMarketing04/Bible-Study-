// Curated thematic playlists. Each entry groups video IDs (from the `videos`
// table) into a discoverable, shareable collection. `id` is the URL slug used
// by /api/playlist/:id and /playlist/:id.
export interface Playlist {
  id: string;
  name: string;
  description: string;
  videoIds: number[];
}

export const playlists: Playlist[] = [
  {
    id: "pentateuch",
    name: "The Pentateuch",
    description:
      "Genesis through Deuteronomy — the first five books of the Bible, from creation to the edge of the Promised Land.",
    videoIds: [85, 86, 87, 88, 89],
  },
  {
    id: "the-gospels",
    name: "The Gospels",
    description:
      "Matthew, Mark, Luke, and John — four accounts of the life, death, and resurrection of Jesus Christ.",
    videoIds: [165, 166, 167, 168],
  },
  {
    id: "kids-bible-stories",
    name: "Kids' Bible Stories",
    description:
      "Animated retellings from Saddleback Kids and Crossroads Kids' Club — favorite Bible stories made for young viewers.",
    videoIds: [
      258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268,
    ],
  },
];
