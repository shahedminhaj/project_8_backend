const initialEvents = [
  {
    title: "Warm Hands, Warm Hearts",
    description:
      "Help us sort and share winter essentials with families who need a little extra warmth this season. Every donated coat and every helping hand makes a difference.",
    category: "Donation",
    location: "Mirpur 10, Dhaka",
    daysAhead: 3,
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "A Greener Gulshan",
    description:
      "Spend a morning planting native trees and making our shared streets greener. Tools, seedlings, and a cup of tea are on us.",
    category: "Plantation",
    location: "Gulshan Lake Park, Dhaka",
    daysAhead: 5,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Little Steps, Cleaner Canal",
    description:
      "Join neighbors for a hands-on cleanup along the canal. We will provide gloves, bags, and a short safety briefing before we get started.",
    category: "Cleanup",
    location: "Dhanmondi Lake, Dhaka",
    daysAhead: 8,
    image: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "The Shared Table",
    description:
      "Cook, pack, and deliver nourishing meal boxes with a friendly crew. Bring your energy; we will take care of the ingredients.",
    category: "Food drive",
    location: "Mohammadpur, Dhaka",
    daysAhead: 11,
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Stories for Every Saturday",
    description:
      "Share the joy of reading with local children through games, stories, and a book to take home. No teaching experience needed.",
    category: "Education",
    location: "Lalmatia, Dhaka",
    daysAhead: 14,
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "A Day for Neighbors",
    description:
      "Meet the people who make our neighborhood feel like home. Lend a hand at our community day with activities for every age.",
    category: "Community",
    location: "Banani, Dhaka",
    daysAhead: 17,
    image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=900&q=80",
  },
];

export async function seedEvents(events) {
  if ((await events.countDocuments()) > 0) return;

  const now = new Date();
  const initialDocuments = initialEvents.map(({ daysAhead, ...event }) => {
    const date = new Date(now);
    date.setDate(date.getDate() + daysAhead);
    return {
      ...event,
      date: date.toISOString().slice(0, 10),
      creatorEmail: "hello@commonplace.community",
      creatorName: "Commonplace team",
      creatorId: null,
      attendees: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  await events.insertMany(initialDocuments);
}
