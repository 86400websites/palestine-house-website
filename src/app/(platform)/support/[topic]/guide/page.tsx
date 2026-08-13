import type { Metadata } from "next";
import {
  PwGuidePage,
  guideMetadata,
} from "@/components/workspace-v2/pw-guide-reader";

/* /support/[topic]/guide — the Simple guide reader for a Support focus area
   (PP4). One of four thin wrappers; the gate lives in the shared reader.

   /support also carries the Ask HQ panel, but that is the section page: this
   dynamic segment sits beneath it and never shadows it. */

type Params = { params: Promise<{ topic: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  return guideMetadata("support", params);
}

export default async function SupportGuideRoute({ params }: Params) {
  return <PwGuidePage section="support" params={params} />;
}
