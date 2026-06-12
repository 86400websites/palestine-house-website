import { TatreezDivider } from "@/components/shared/tatreez-divider";

/* The standard between-sections divider — one definition so every page
   carries the identical tatreez mark. */
export function PageDivider() {
  return (
    <div className="page-divider">
      <TatreezDivider width="160px" opacity={0.7} />
    </div>
  );
}
