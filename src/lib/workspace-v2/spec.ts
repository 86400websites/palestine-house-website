/* MAINTAINED BY HAND since CR1 — do not re-run scripts/extract-mockup-spec.ts,
 * which would overwrite this file with the retired mockup wording.
 *
 * The workspace v2 shell copy. It began as a generated extraction of the owner's
 * final mockup; CR1 replaced that wording from the owner's private copy document.
 * Kept as a module rather than a JSON import because the full spec is ~167 KB
 * and only this slice is needed at module scope. Section/topic content comes from
 * the database. */

export const WORKSPACE_CHROME = {
  "skipLink": "Skip to content",
  "brand": {
    "href": "https://www.palestine-house.com/",
    "ariaLabel": "Palestine House — public home page",
    "logoAlt": "Palestine House — Our Culture Embassy"
  },
  "nav": {
    "ariaLabel": "Community platform",
    "mobileAriaLabel": "Community platform, mobile",
    "items": [
      {
        "page": "about",
        "label": "Overview",
        "tip": "Start here."
      },
      {
        "page": "setup",
        "label": "Setup",
        "tip": "Get the foundations right."
      },
      {
        "page": "operate",
        "label": "Operate",
        "tip": "Run the House."
      },
      {
        "page": "program",
        "label": "Program",
        "tip": "Plan experiences."
      },
      {
        "page": "support",
        "label": "Support",
        "tip": "Get help."
      }
    ]
  },
  "account": {
    "label": "Community Platform",
    "ariaLabel": "Open Community Platform"
  },
  "menuButton": {
    "ariaLabel": "Open menu"
  },
  "documentTitleSuffix": "Palestine House Community Platform",
  "footer": {
    "cta": {
      "heading": "Need help finding the right resource?",
      "lead": "Search the guides and templates, or request a contact for your community question.",
      "searchAction": "Search Resources",
      "askAction": "Request Community Contacts",
      "photoAlt": "Guests gathered at a lantern-lit Palestine House doorway"
    },
    "brand": {
      "logoAlt": "Palestine House — Our Culture Embassy",
      "blurb": "A shared place for the guides, templates and connections that help you build and run your own Palestine House.",
      "arabic": "بيت فلسطين في كل مدينة"
    },
    "columns": [
      {
        "title": "RESOURCES",
        "links": [
          "Overview",
          "Setup",
          "Operate"
        ],
        "context": []
      },
      {
        "title": "COMMUNITY",
        "links": [
          "Program",
          "Support",
          "Search Resources"
        ],
        "context": []
      },
      {
        "title": "ACCOUNT",
        "links": [
          "Community Platform"
        ],
        "context": [
          "Private resources for Palestine House community members."
        ]
      },
      {
        "title": "HELP",
        "links": [
          "Community Contacts"
        ],
        "context": []
      }
    ],
    "bottom": {
      "tagline": "Passion inspires. Discipline delivers.",
      "copyright": "© Palestine House · Community Platform"
    }
  }
} as const;

export const PLATFORM_PAGES = {
  "about": {
    "label": "Overview",
    "eyebrow": "Palestine House · Community Platform",
    "title": "Practical resources for your own Palestine House.",
    "lead": "Find guides, templates and community connections across Setup, Operate, Program and Support. Choose the question you are working on and start there.",
    "heroImage": "/assets/workspace/heroes/about.jpg",
    "heroPosition": "50% 50%"
  },
  "setup": {
    "label": "Setup",
    "eyebrow": "Setup",
    "title": "Setup",
    "lead": "Prepare your own Palestine House with practical guidance on local requirements, money, space, people and opening. Start with the decision in front of you.",
    "heroImage": "/assets/workspace/heroes/setup.jpg",
    "heroPosition": "50% 50%"
  },
  "operate": {
    "label": "Operate",
    "eyebrow": "Operate",
    "title": "Operate",
    "lead": "Manage the money, daily routines, food and drinks where offered, visitors and team. Use one Monthly House Review to agree the next actions.",
    "heroImage": "/assets/workspace/heroes/operate.jpg",
    "heroPosition": "50% 52%"
  },
  "program": {
    "label": "Program",
    "eyebrow": "Program",
    "title": "Program",
    "lead": "Shape a Palestinian cultural calendar, plan and promote events, work with contributors and learn from each activity. Your House chooses its programme and providers.",
    "heroImage": "/assets/workspace/heroes/program.jpg",
    "heroPosition": "50% 46%"
  },
  "support": {
    "label": "Support",
    "eyebrow": "Support",
    "title": "Support",
    "lead": "Find practical tools for marketing, funding and partnerships. Request community contacts and learn from other Houses through a suitable contact or confirmed sharing channel.",
    "heroImage": "/assets/workspace/heroes/support.jpg",
    "heroPosition": "50% 44%"
  }
} as const;

export const PLATFORM_JOURNEY = [
  {
    "page": "setup",
    "num": "1",
    "icon": "compass",
    "title": "Setup",
    "desc": "Prepare your House: local requirements, finances, a suitable space, a small team and a realistic opening plan.",
    "action": "Explore",
    "image": "/assets/workspace/sections/setup.jpg",
    "imagePosition": "50% 54%"
  },
  {
    "page": "operate",
    "num": "2",
    "icon": "house",
    "title": "Operate",
    "desc": "Keep daily life manageable: money, the venue, food and drinks where offered, members and visitors, the team and local reviews.",
    "action": "Explore",
    "image": "/assets/workspace/sections/operate.jpg",
    "imagePosition": "50% 50%"
  },
  {
    "page": "program",
    "num": "3",
    "icon": "calendar",
    "title": "Program",
    "desc": "Create a cultural calendar, plan events, work with contributors, promote activities and learn from what happens.",
    "action": "Explore",
    "image": "/assets/workspace/sections/program.jpg",
    "imagePosition": "50% 50%"
  },
  {
    "page": "support",
    "num": "4",
    "icon": "life-buoy",
    "title": "Support",
    "desc": "Find tools for marketing, funding and partnerships. Request community contacts and explore ways to learn from other Houses.",
    "action": "Explore",
    "image": "/assets/workspace/sections/support.jpg",
    "imagePosition": "50% 54%"
  }
] as const;

/* The one surviving standard card (D-PP-f) and the templates grid's shared copy.
 * Constant across all 33 topics in the mockup — asserted above — which is what
 * licenses shipping them as constants instead of database rows. */
export const RESOURCE_KINDS = [
  {
    "kind": "GUIDE",
    "key": "guide",
    "title": "Simple Guide",
    "icon": "guide",
    "desc": "Follow the recommended approach in clear steps.",
    "action": "Read guide",
    "use": "Use this when you are ready to work through the topic with your team."
  }
] as const;

export const TEMPLATE_COPY = {
  "desc": "A ready-to-use file for your team.",
  "use": "Download this when you need a practical working document for the topic."
} as const;

export type WorkspaceNavItem = (typeof WORKSPACE_CHROME.nav.items)[number];
export type PlatformPageKey = keyof typeof PLATFORM_PAGES;
