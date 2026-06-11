import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Palestine House
      </p>
      <h1 className="max-w-xl text-3xl font-semibold sm:text-4xl">
        Palestine House foundation is ready.
      </h1>
      <Separator className="w-16" />
      <p className="max-w-md text-muted-foreground">
        Temporary scaffold screen — Sprint 0B. Real pages, approved copy, and the
        design system arrive in later sprints.
      </p>
      <Button>Foundation ready</Button>
    </main>
  );
}
