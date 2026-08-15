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
  { file: "aswatna-studio-collaboration.jpg", label: "Aswatna studio collaboration", path: "/assets/workspace/topics/aswatna-studio-collaboration.jpg" },
  { file: "brand-experience-standards.jpg", label: "Brand experience standards", path: "/assets/workspace/topics/brand-experience-standards.jpg" },
  { file: "business-model-and-revenue.jpg", label: "Business model and revenue", path: "/assets/workspace/topics/business-model-and-revenue.jpg" },
  { file: "catering-private-events-and-culinary-programming.jpg", label: "Catering private events and culinary programming", path: "/assets/workspace/topics/catering-private-events-and-culinary-programming.jpg" },
  { file: "coffee-tea-and-beverage-program.jpg", label: "Coffee tea and beverage program", path: "/assets/workspace/topics/coffee-tea-and-beverage-program.jpg" },
  { file: "community-partnerships.jpg", label: "Community partnerships", path: "/assets/workspace/topics/community-partnerships.jpg" },
  { file: "continuous-improvement-and-knowledge-sharing.jpg", label: "Continuous improvement and knowledge sharing", path: "/assets/workspace/topics/continuous-improvement-and-knowledge-sharing.jpg" },
  { file: "crisis-management.jpg", label: "Crisis management", path: "/assets/workspace/topics/crisis-management.jpg" },
  { file: "customer-service-and-recovery.jpg", label: "Customer service and recovery", path: "/assets/workspace/topics/customer-service-and-recovery.jpg" },
  { file: "event-production-sops.jpg", label: "Event production sops", path: "/assets/workspace/topics/event-production-sops.jpg" },
  { file: "facility-operations.jpg", label: "Facility operations", path: "/assets/workspace/topics/facility-operations.jpg" },
  { file: "financial-operations-and-controls.jpg", label: "Financial operations and controls", path: "/assets/workspace/topics/financial-operations-and-controls.jpg" },
  { file: "food-and-beverage-operations.jpg", label: "Food and beverage operations", path: "/assets/workspace/topics/food-and-beverage-operations.jpg" },
  { file: "get-legally-ready.jpg", label: "Get legally ready", path: "/assets/workspace/topics/get-legally-ready.jpg" },
  { file: "global-campaigns.jpg", label: "Global campaigns", path: "/assets/workspace/topics/global-campaigns.jpg" },
  { file: "governance-and-ethics.jpg", label: "Governance and ethics", path: "/assets/workspace/topics/governance-and-ethics.jpg" },
  { file: "guest-journey-and-member-journey.jpg", label: "Guest journey and member journey", path: "/assets/workspace/topics/guest-journey-and-member-journey.jpg" },
  { file: "hiring-onboarding-and-training.jpg", label: "Hiring onboarding and training", path: "/assets/workspace/topics/hiring-onboarding-and-training.jpg" },
  { file: "inventory-and-procurement.jpg", label: "Inventory and procurement", path: "/assets/workspace/topics/inventory-and-procurement.jpg" },
  { file: "launching-a-new-house.jpg", label: "Launching a new house", path: "/assets/workspace/topics/launching-a-new-house.jpg" },
  { file: "legal-compliance-and-risk.jpg", label: "Legal compliance and risk", path: "/assets/workspace/topics/legal-compliance-and-risk.jpg" },
  { file: "local-marketing-playbook.jpg", label: "Local marketing playbook", path: "/assets/workspace/topics/local-marketing-playbook.jpg" },
  { file: "membership-model-and-benefits.jpg", label: "Membership model and benefits", path: "/assets/workspace/topics/membership-model-and-benefits.jpg" },
  { file: "menu-and-palestinian-culinary-identity.jpg", label: "Menu and palestinian culinary identity", path: "/assets/workspace/topics/menu-and-palestinian-culinary-identity.jpg" },
  { file: "mission-values-and-guest-promise.jpg", label: "Mission values and guest promise", path: "/assets/workspace/topics/mission-values-and-guest-promise.jpg" },
  { file: "operating-model.jpg", label: "Operating model", path: "/assets/workspace/topics/operating-model.jpg" },
  { file: "org-structure-and-roles.jpg", label: "Org structure and roles", path: "/assets/workspace/topics/org-structure-and-roles.jpg" },
  { file: "performance-management-and-culture.jpg", label: "Performance management and culture", path: "/assets/workspace/topics/performance-management-and-culture.jpg" },
  { file: "programming-model-and-pillars.jpg", label: "Programming model and pillars", path: "/assets/workspace/topics/programming-model-and-pillars.jpg" },
  { file: "reporting-kpis-and-audits.jpg", label: "Reporting kpis and audits", path: "/assets/workspace/topics/reporting-kpis-and-audits.jpg" },
  { file: "retail-shop-operations.jpg", label: "Retail shop operations", path: "/assets/workspace/topics/retail-shop-operations.jpg" },
  { file: "sustainability-and-impact.jpg", label: "Sustainability and impact", path: "/assets/workspace/topics/sustainability-and-impact.jpg" },
  { file: "technology-stack-and-data.jpg", label: "Technology stack and data", path: "/assets/workspace/topics/technology-stack-and-data.jpg" },
  { file: "templates-and-master-index.jpg", label: "Templates and master index", path: "/assets/workspace/topics/templates-and-master-index.jpg" },
];
