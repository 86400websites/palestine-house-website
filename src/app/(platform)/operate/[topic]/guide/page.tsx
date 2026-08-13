import type { Metadata } from "next";
import {
  PwGuidePage,
  guideMetadata,
} from "@/components/workspace-v2/pw-guide-reader";

/* /operate/[topic]/guide — the Simple guide reader for an Operate focus area
   (PP4). One of four thin wrappers; the gate lives in the shared reader. */

type Params = { params: Promise<{ topic: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  return guideMetadata("operate", params);
}

export default async function OperateGuideRoute({ params }: Params) {
  return <PwGuidePage section="operate" params={params} />;
}
