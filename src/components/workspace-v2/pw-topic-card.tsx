import type { PwTopic } from "@/lib/workspace-v2/types";

/* One focus-area card inside a toolkit group (PP3).

   Scaffold at 3d: the image-led layout's copy column only, so the accordion
   above it is reviewable against real data. 3e adds the image, the summary
   line, Explore/Back and Watch Video, and the body that expands beneath. */

export function PwTopicCard({ topic }: { topic: PwTopic }) {
  return (
    <article className="pw-topic" id={`topic-${topic.slug}`}>
      <div className="pw-topic-head">
        <div className="pw-topic-copy">
          <h3 className="pw-topic-title">{topic.title}</h3>
          {topic.description ? (
            <p className="pw-topic-desc">{topic.description}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
