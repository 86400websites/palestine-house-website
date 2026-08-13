import type { Metadata } from "next";
import {
  PwGuidePage,
  guideMetadata,
} from "@/components/workspace-v2/pw-guide-reader";

/* /program/[topic]/guide — the Simple guide reader for a Program focus area
   (PP4). One of four thin wrappers; the gate lives in the shared reader. */

type Params = { params: Promise<{ topic: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  return guideMetadata("program", params);
}

export default async function ProgramGuideRoute({ params }: Params) {
  return <PwGuidePage section="program" params={params} />;
}
