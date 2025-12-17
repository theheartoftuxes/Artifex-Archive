import { PrismaClient, MediaType, Visibility } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to get random number in range
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to get random float in range
const randomFloat = (min: number, max: number) =>
  Math.random() * (max - min) + min;

// Helper function to get random items from array
const randomItems = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.rating.deleteMany();
  await prisma.save.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.mediaMetadata.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Create 5 demo users (including one admin)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@artifex.com",
        name: "Admin User",
        username: "admin",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      },
    }),
    prisma.user.create({
      data: {
        email: "alex@artifex.com",
        name: "Alex Creator",
        username: "alex_creator",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      },
    }),
    prisma.user.create({
      data: {
        email: "sarah@artifex.com",
        name: "Sarah Artist",
        username: "sarah_artist",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      },
    }),
    prisma.user.create({
      data: {
        email: "mike@artifex.com",
        name: "Mike Designer",
        username: "mike_designer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      },
    }),
    prisma.user.create({
      data: {
        email: "luna@artifex.com",
        name: "Luna Creative",
        username: "luna_creative",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Define all possible tags
  const allTags = [
    "cyberpunk",
    "anime",
    "neon",
    "lofi",
    "nature",
    "chill",
    "ambient",
    "electronic",
    "futuristic",
    "abstract",
    "minimalist",
    "vibrant",
    "dark",
    "bright",
    "retro",
    "modern",
    "fantasy",
    "sci-fi",
    "surreal",
    "realistic",
    "pixel",
    "vector",
    "3d",
    "2d",
    "cinematic",
    "atmospheric",
    "energetic",
    "calm",
    "melodic",
    "rhythmic",
    "action",
    "adventure",
    "puzzle",
    "platformer",
    "rpg",
    "indie",
    "experimental",
    "artistic",
    "creative",
    "innovative",
  ];

  // Create tags in database
  const tags = await Promise.all(
    allTags.map((tagName) =>
      prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      })
    )
  );

  console.log(`✅ Created/verified ${tags.length} tags`);

  // Define 20 media items with varied types
  const mediaItemsData = [
    // 8 Images
    {
      title: "Neon Samurai",
      description: "A stunning cyberpunk samurai warrior bathed in neon lights, created with advanced AI image generation.",
      mediaType: MediaType.IMAGE,
      aiModelUsed: "Midjourney v6",
      promptSummary: "cyberpunk samurai warrior neon lights japanese blade katana futuristic armor glowing",
      tags: ["cyberpunk", "anime", "neon", "futuristic", "vibrant", "dark", "artistic"],
    },
    {
      title: "Abstract Realities",
      description: "An exploration of abstract forms and colors blending reality with imagination.",
      mediaType: MediaType.IMAGE,
      aiModelUsed: "DALL-E 3",
      promptSummary: "abstract art geometric shapes colors forms reality imagination surreal composition",
      tags: ["abstract", "surreal", "vibrant", "artistic", "creative", "experimental"],
    },
    {
      title: "Cosmic Dreams",
      description: "A breathtaking view of cosmic landscapes and nebulas in vibrant colors.",
      mediaType: MediaType.IMAGE,
      aiModelUsed: "Stable Diffusion XL",
      promptSummary: "cosmic space nebula galaxy stars planets vibrant colors universe astronomy",
      tags: ["sci-fi", "cosmic", "vibrant", "surreal", "atmospheric", "futuristic"],
    },
    {
      title: "Pixel Art City",
      description: "A nostalgic pixel art representation of a bustling cyberpunk cityscape.",
      mediaType: MediaType.IMAGE,
      aiModelUsed: "Midjourney v6",
      promptSummary: "pixel art cyberpunk cityscape retro 8bit 16bit nostalgic urban skyline",
      tags: ["pixel", "cyberpunk", "retro", "2d", "vibrant", "nostalgic", "urban"],
    },
    {
      title: "Nature's Symphony",
      description: "A beautiful blend of natural elements and digital artistry.",
      mediaType: MediaType.IMAGE,
      aiModelUsed: "DALL-E 3",
      promptSummary: "nature landscape forest trees flowers digital art blend organic natural",
      tags: ["nature", "abstract", "vibrant", "calm", "artistic", "organic"],
    },
    {
      title: "Minimalist Geometry",
      description: "Clean geometric shapes in a minimalist composition with perfect balance.",
      mediaType: MediaType.IMAGE,
      aiModelUsed: "Stable Diffusion XL",
      promptSummary: "minimalist geometric shapes clean simple composition balance modern design",
      tags: ["minimalist", "geometric", "abstract", "modern", "clean", "artistic"],
    },
    {
      title: "Fantasy Portal",
      description: "A magical portal opening to another dimension, rich with fantasy elements.",
      mediaType: MediaType.IMAGE,
      aiModelUsed: "Midjourney v6",
      promptSummary: "fantasy portal magic dimension mystical gateway otherworldly magical realm",
      tags: ["fantasy", "magical", "surreal", "vibrant", "cinematic", "artistic", "mystical"],
    },
    {
      title: "Neon Noir",
      description: "A film noir inspired scene with neon lighting and dramatic shadows.",
      mediaType: MediaType.IMAGE,
      aiModelUsed: "DALL-E 3",
      promptSummary: "film noir neon lighting dramatic shadows detective mystery urban night",
      tags: ["noir", "neon", "dark", "cinematic", "atmospheric", "dramatic", "retro"],
    },
    // 5 Music
    {
      title: "Ambient Rainforest",
      description: "A soothing ambient track featuring natural rainforest sounds blended with electronic elements.",
      mediaType: MediaType.MUSIC,
      aiModelUsed: "Suno v3",
      promptSummary: "ambient music rainforest nature sounds birds water electronic synth chill",
      tags: ["lofi", "nature", "chill", "ambient", "calm", "melodic", "organic"],
    },
    {
      title: "Synthetic Symphony",
      description: "An energetic electronic symphony combining multiple synth layers and rhythmic patterns.",
      mediaType: MediaType.MUSIC,
      aiModelUsed: "Udio",
      promptSummary: "electronic symphony synth layers rhythmic patterns energetic beats electronic music",
      tags: ["electronic", "energetic", "rhythmic", "futuristic", "synthetic", "melodic"],
    },
    {
      title: "Digital Echoes",
      description: "Ethereal soundscape with digital echoes and atmospheric textures.",
      mediaType: MediaType.MUSIC,
      aiModelUsed: "Suno v3",
      promptSummary: "ethereal soundscape digital echoes atmospheric textures ambient experimental",
      tags: ["ambient", "atmospheric", "ethereal", "calm", "experimental", "artistic"],
    },
    {
      title: "Cyberpunk Beats",
      description: "Hard-hitting beats with cyberpunk aesthetics and industrial sounds.",
      mediaType: MediaType.MUSIC,
      aiModelUsed: "Udio",
      promptSummary: "cyberpunk beats industrial sounds hard hitting electronic music futuristic",
      tags: ["cyberpunk", "energetic", "rhythmic", "dark", "industrial", "futuristic"],
    },
    {
      title: "Melodic Journey",
      description: "A beautiful melodic composition taking listeners on an emotional journey.",
      mediaType: MediaType.MUSIC,
      aiModelUsed: "Suno v3",
      promptSummary: "melodic composition emotional journey beautiful music cinematic orchestral",
      tags: ["melodic", "calm", "emotional", "artistic", "cinematic", "atmospheric"],
    },
    // 4 Videos
    {
      title: "Virtual Voyage",
      description: "An immersive video journey through virtual landscapes and digital worlds.",
      mediaType: MediaType.VIDEO,
      aiModelUsed: "Runway Gen-2",
      promptSummary: "virtual reality journey landscapes digital worlds immersive 3d animation",
      tags: ["virtual", "immersive", "futuristic", "cinematic", "atmospheric", "artistic"],
    },
    {
      title: "Time Lapse Dreams",
      description: "A mesmerizing time-lapse video of abstract forms and colors in motion.",
      mediaType: MediaType.VIDEO,
      aiModelUsed: "Pika Labs",
      promptSummary: "time lapse abstract forms colors motion animation mesmerizing visual",
      tags: ["abstract", "surreal", "cinematic", "artistic", "experimental", "vibrant"],
    },
    {
      title: "Neon City Nights",
      description: "A cinematic video showcasing neon-lit city streets at night with dynamic camera movements.",
      mediaType: MediaType.VIDEO,
      aiModelUsed: "Runway Gen-2",
      promptSummary: "neon city night streets cinematic camera movement urban cyberpunk",
      tags: ["neon", "cyberpunk", "urban", "cinematic", "dark", "atmospheric", "futuristic"],
    },
    {
      title: "Nature's Flow",
      description: "A serene video capturing the flow of nature with water, wind, and light.",
      mediaType: MediaType.VIDEO,
      aiModelUsed: "Pika Labs",
      promptSummary: "nature flow water wind light serene peaceful natural elements",
      tags: ["nature", "calm", "organic", "atmospheric", "serene", "artistic"],
    },
    // 3 Games
    {
      title: "Procedural Pixels",
      description: "An indie platformer with procedurally generated levels and pixel art aesthetics.",
      mediaType: MediaType.GAME,
      aiModelUsed: "ChatGPT Game Engine",
      promptSummary: "indie platformer procedural generation pixel art retro game levels",
      tags: ["pixel", "platformer", "indie", "procedural", "2d", "retro", "adventure"],
    },
    {
      title: "Infinite Worlds",
      description: "An exploration game with infinite procedurally generated worlds to discover.",
      mediaType: MediaType.GAME,
      aiModelUsed: "Claude Game Builder",
      promptSummary: "exploration game infinite worlds procedural generation discover adventure",
      tags: ["exploration", "procedural", "adventure", "3d", "indie", "innovative"],
    },
    {
      title: "Neon Runner",
      description: "A fast-paced endless runner set in a cyberpunk neon city with dynamic obstacles.",
      mediaType: MediaType.GAME,
      aiModelUsed: "ChatGPT Game Engine",
      promptSummary: "endless runner cyberpunk neon city fast paced obstacles action game",
      tags: ["cyberpunk", "neon", "action", "endless", "2d", "energetic", "retro"],
    },
  ];

  // Create media items with random stats (more realistic distribution)
  // Store target stats for later use in ratings/saves
  const itemStats: Array<{
    isPopular: boolean;
    viewCount: number;
    saveCount: number;
    ratingCount: number;
    avgRating: number;
  }> = [];

  const mediaItems = await Promise.all(
    mediaItemsData.map((item, index) => {
      // More realistic distribution: some items are more popular
      const isPopular = Math.random() > 0.5;
      const viewCount = isPopular ? randomInt(2000, 10000) : randomInt(100, 2000);
      const saveCount = isPopular ? randomInt(50, 800) : randomInt(5, 100);
      const ratingCount = isPopular ? randomInt(15, 50) : randomInt(3, 15);
      const avgRating = isPopular ? randomFloat(4.0, 4.9) : randomFloat(3.0, 4.5);

      // Store stats for later
      itemStats.push({
        isPopular,
        viewCount,
        saveCount,
        ratingCount,
        avgRating,
      });

      // Generate placeholder URLs based on media type
      const mediaUrl =
        item.mediaType === MediaType.IMAGE
          ? `https://placehold.co/1920x1080/6366f1/ffffff?text=${encodeURIComponent(item.title)}`
          : item.mediaType === MediaType.VIDEO
          ? `https://placehold.co/1920x1080/8b5cf6/ffffff?text=${encodeURIComponent(item.title)}`
          : item.mediaType === MediaType.MUSIC
          ? `https://placehold.co/800x800/ec4899/ffffff?text=${encodeURIComponent(item.title)}`
          : `https://placehold.co/1200x800/10b981/ffffff?text=${encodeURIComponent(item.title)}`;

      const thumbnailUrl = `https://placehold.co/400x300/6366f1/ffffff?text=${encodeURIComponent(item.title)}`;

      return prisma.mediaItem.create({
        data: {
          title: item.title,
          description: item.description,
          mediaType: item.mediaType,
          mediaUrl,
          thumbnailUrl,
          aiModelUsed: item.aiModelUsed,
          promptSummary: item.promptSummary,
          visibility: Visibility.PUBLIC,
          creatorId: users[index % users.length].id, // Distribute items across users
          avgRating: 0, // Will be updated after ratings are created
          ratingCount: 0, // Will be updated after ratings are created
          ratingTotal: 0, // Will be updated after ratings are created
          saveCount: 0, // Will be updated after saves are created
          viewCount,
        },
      });
    })
  );

  console.log(`✅ Created ${mediaItems.length} media items`);

  // Link tags to media items
  await Promise.all(
    mediaItems.map((item: { id: string }, index: number) => {
      const itemTags = mediaItemsData[index].tags;
      const tagConnections = tags
        .filter((tag: { name: string }) => itemTags.includes(tag.name))
        .map((tag: { id: string }) => ({ id: tag.id }));

      return prisma.mediaItem.update({
        where: { id: item.id },
        data: {
          tags: {
            connect: tagConnections,
          },
        },
      });
    })
  );

  console.log(`✅ Linked tags to media items`);

  // Create ratings for each media item (more realistic distribution)
  const allRatings: Promise<any>[] = [];
  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i];
    const stats = itemStats[i];
    const ratingCount = stats.ratingCount;
    const targetAvg = stats.avgRating;
    const itemRatings: number[] = [];
    
    // Generate ratings that average close to targetAvg
    for (let j = 0; j < ratingCount; j++) {
      // Generate rating between 1-5, but weighted toward targetAvg
      let rating: number;
      if (j < ratingCount - 1) {
        // Most ratings are around targetAvg with some variance
        const variance = (Math.random() - 0.5) * 1.5; // ±0.75 variance
        rating = Math.max(1, Math.min(5, Math.round(targetAvg + variance)));
      } else {
        // Last rating adjusts to hit target average more closely
        const currentSum = itemRatings.reduce((sum: number, r: number) => sum + r, 0);
        const needed = targetAvg * ratingCount - currentSum;
        rating = Math.max(1, Math.min(5, Math.round(needed)));
      }
      
      itemRatings.push(rating);
    }

    // Create ratings from different users (ensure unique users per item)
    const ratingUsers = randomItems(users, Math.min(ratingCount, users.length)) as typeof users;
    for (let j = 0; j < ratingCount; j++) {
      const userIndex = j % ratingUsers.length;
      allRatings.push(
        prisma.rating.create({
          data: {
            userId: ratingUsers[userIndex].id,
            mediaItemId: item.id,
            value: itemRatings[j],
          },
        })
      );
    }
  }

  await Promise.all(allRatings);
  console.log(`✅ Created ${allRatings.length} ratings`);

  // Create saves (more realistic: popular items get more saves)
  const allSaves: Promise<any>[] = [];
  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i];
    const stats = itemStats[i];
    const targetSaveCount = stats.saveCount;
    
    // Distribute saves across users (some users save multiple items)
    const savingUsers = randomItems(users, Math.min(targetSaveCount, users.length)) as typeof users;
    let savesCreated = 0;
    
    // Create saves, cycling through users if needed
    while (savesCreated < targetSaveCount && savesCreated < 100) { // Cap at 100 saves per item
      const userIndex = savesCreated % savingUsers.length;
      allSaves.push(
        prisma.save.create({
          data: {
            userId: savingUsers[userIndex].id,
            mediaItemId: item.id,
          },
        })
      );
      savesCreated++;
    }
  }

  await Promise.all(allSaves);
  console.log(`✅ Created ${allSaves.length} saves`);

  // Update media items with actual counts (in case saves/ratings differ)
  for (const item of mediaItems) {
    const actualRatings = await prisma.rating.count({
      where: { mediaItemId: item.id },
    });
    const actualSaves = await prisma.save.count({
      where: { mediaItemId: item.id },
    });
    const ratings = await prisma.rating.findMany({
      where: { mediaItemId: item.id },
    });
    const ratingTotal = ratings.reduce((sum: number, r: { value: number }) => sum + r.value, 0);
    const actualAvgRating =
      ratings.length > 0
        ? ratingTotal / ratings.length
        : 0;

    await prisma.mediaItem.update({
      where: { id: item.id },
      data: {
        avgRating: actualAvgRating,
        ratingCount: actualRatings,
        ratingTotal: ratingTotal,
        saveCount: actualSaves,
      },
    });
  }

  console.log("✨ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
