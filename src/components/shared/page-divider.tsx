import { TatreezDivider } from "@/components/shared/tatreez-divider";

/* The standard between-sections divider — one definition so every page
   carries the identical tatreez mark. Public-only, so it carries the v3
   olive/copper motif (DR1-10); the workspace uses TatreezDivider directly
   with the heritage default. */
export function PageDivider() {
  return (
    <div className="page-divider">
      <TatreezDivider width="160px" opacity={0.7} palette="v3" />
    </div>
  );
}
