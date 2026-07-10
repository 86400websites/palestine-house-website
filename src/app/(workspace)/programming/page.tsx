import { redirect } from "next/navigation";

/* /programming folded into the members-only Live hub (LH1). The publish form +
   "Your sessions" management now live on /live alongside the network feed; this
   redirect keeps old bookmarks and muscle memory working. */
export default function ProgrammingPage() {
  redirect("/live");
}
