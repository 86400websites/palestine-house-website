/* The topic photographs available to the Focus areas screen.
 *
 * Generated from the contents of public/assets/workspace/topics/. Regenerate
 * after adding or removing one:
 *
 *   node -e 'const fs=require("fs");console.log(fs.readdirSync("public/assets/workspace/topics").filter(f=>f.endsWith(".jpg")).sort().join("\n"))'
 *
 * WHY A LIST AND NOT A DIRECTORY READ: these files are served statically, so
 * reading the directory at request time is not something the deploy target
 * guarantees. A committed list is boring and always right.
 *
 * D-PP-o reuses the existing photographs rather than commissioning new ones, so
 * this is the whole pool the owner chooses from; PP7 deletes the ones the new
 * 22 focus areas do not use, and this file shrinks with them.
 */
export const TOPIC_PHOTO_DIR = "/assets/workspace/topics";

export const TOPIC_PHOTOS: readonly { file: string; label: string; path: string }[] = [
  { file: "ask-community-support-for-help.jpg", label: "Ask community support for help", path: "/assets/workspace/topics/ask-community-support-for-help.jpg" },
  { file: "build-a-small-team.jpg", label: "Build a small team", path: "/assets/workspace/topics/build-a-small-team.jpg" },
  { file: "connect-to-the-wider-palestine-house-network.jpg", label: "Connect to the wider palestine house network", path: "/assets/workspace/topics/connect-to-the-wider-palestine-house-network.jpg" },
  { file: "daily-house-operations.jpg", label: "Daily house operations", path: "/assets/workspace/topics/daily-house-operations.jpg" },
  { file: "find-and-prepare-the-space.jpg", label: "Find and prepare the space", path: "/assets/workspace/topics/find-and-prepare-the-space.jpg" },
  { file: "food-beverages.jpg", label: "Food beverages", path: "/assets/workspace/topics/food-beverages.jpg" },
  { file: "get-legally-ready.jpg", label: "Get legally ready", path: "/assets/workspace/topics/get-legally-ready.jpg" },
  { file: "get-ready-to-open.jpg", label: "Get ready to open", path: "/assets/workspace/topics/get-ready-to-open.jpg" },
  { file: "learn-from-other-palestine-houses.jpg", label: "Learn from other palestine houses", path: "/assets/workspace/topics/learn-from-other-palestine-houses.jpg" },
  { file: "learn-the-event.jpg", label: "Learn the event", path: "/assets/workspace/topics/learn-the-event.jpg" },
  { file: "marketing.jpg", label: "Marketing", path: "/assets/workspace/topics/marketing.jpg" },
  { file: "members-and-visitors.jpg", label: "Members and visitors", path: "/assets/workspace/topics/members-and-visitors.jpg" },
  { file: "money.jpg", label: "Money", path: "/assets/workspace/topics/money.jpg" },
  { file: "monthly-check-up.jpg", label: "Monthly check up", path: "/assets/workspace/topics/monthly-check-up.jpg" },
  { file: "partnerships.jpg", label: "Partnerships", path: "/assets/workspace/topics/partnerships.jpg" },
  { file: "plan-an-event.jpg", label: "Plan an event", path: "/assets/workspace/topics/plan-an-event.jpg" },
  { file: "plan-the-calendar.jpg", label: "Plan the calendar", path: "/assets/workspace/topics/plan-the-calendar.jpg" },
  { file: "plan-the-money.jpg", label: "Plan the money", path: "/assets/workspace/topics/plan-the-money.jpg" },
  { file: "promote-the-event.jpg", label: "Promote the event", path: "/assets/workspace/topics/promote-the-event.jpg" },
  { file: "sponsorship-fundraising.jpg", label: "Sponsorship fundraising", path: "/assets/workspace/topics/sponsorship-fundraising.jpg" },
  { file: "team.jpg", label: "Team", path: "/assets/workspace/topics/team.jpg" },
  { file: "work-with-artists-and-speakers.jpg", label: "Work with artists and speakers", path: "/assets/workspace/topics/work-with-artists-and-speakers.jpg" },
];
