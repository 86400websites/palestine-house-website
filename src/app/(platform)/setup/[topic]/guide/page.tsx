import type { Metadata } from "next";
import {
  PwGuidePage,
  guideMetadata,
} from "@/components/workspace-v2/pw-guide-reader";

/* /setup/[topic]/guide — the Simple guide reader for a Setup focus area (PP4).

   One of four thin wrappers over the shared reader. `guide` is the only doc
   kind under D-PP-f, so the segment is a literal rather than a parameter, and
   the section is a literal too — which is what keeps the approval check and the
   topic lookup in one shared place instead of four. */

type Params = { params: Promise<{ topic: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  return guideMetadata("setup", params);
}

export default async function SetupGuideRoute({ params }: Params) {
  return <PwGuidePage section="setup" params={params} />;
}
