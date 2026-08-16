/**
 * scripts/lib/argv.ts — strict argument parsing for the content scripts.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every script in this series parsed arguments with `process.argv.includes(...)`
 * and `indexOf(...) + 1`. That is permissive in exactly the wrong direction: an
 * argument nobody implemented is silently ignored.
 *
 * The independent review of 2026-08-16 rated the consequence Certain. D-PP-r
 * documents `--target prod`, and `PROJECT-STATUS` told the owner to use it — but
 * the loader never implemented it, so
 *
 *     pnpm exec tsx scripts/load-content.ts --all --target prod
 *
 * silently ignored `--target prod` and ran against **TEST**. The operator would
 * have had every reason to believe production had been loaded. The same shape
 * covers `--dryrun` for `--dry-run`, `--allowlive` for `--allow-live`, and any
 * future typo.
 *
 * So: declare the arguments a script accepts, and reject anything else. An
 * unknown argument is an error, never a no-op — because the failure mode of
 * "ignored" is a confident operator with a wrong belief about which database
 * they just touched.
 */

export interface ArgSpec {
  /** Flags with no value, e.g. `--dry-run`. */
  flags: readonly string[];
  /** Options taking one value, e.g. `--focus 1.1`. */
  options?: readonly string[];
}

export interface ParsedArgs {
  has(flag: string): boolean;
  get(option: string): string | null;
}

export function parseArgs(argv: readonly string[], spec: ArgSpec): ParsedArgs {
  const flags = new Set(spec.flags);
  const options = new Set(spec.options ?? []);
  const seenFlags = new Set<string>();
  const values = new Map<string, string>();

  const known = [...flags, ...options].sort().join(" ");

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      throw new Error(
        `Unexpected argument ${JSON.stringify(token)}. This script takes only: ${known}`,
      );
    }
    /* `--opt=value` as well as `--opt value`, so neither habit silently fails. */
    const eq = token.indexOf("=");
    const name = eq === -1 ? token : token.slice(0, eq);

    if (flags.has(name)) {
      if (eq !== -1) throw new Error(`${name} is a flag and takes no value.`);
      seenFlags.add(name);
      continue;
    }
    if (options.has(name)) {
      const value = eq === -1 ? argv[++i] : token.slice(eq + 1);
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${name} needs a value, e.g. \`${name} <value>\`.`);
      }
      values.set(name, value);
      continue;
    }
    throw new Error(
      `Unknown argument ${JSON.stringify(name)}. This script takes only: ${known}\n` +
        `Refusing rather than ignoring it: an ignored argument is how ` +
        `\`--target prod\` silently ran against TEST.`,
    );
  }

  return {
    has: (flag) => seenFlags.has(flag),
    get: (option) => values.get(option) ?? null,
  };
}
