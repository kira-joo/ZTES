// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EntityName } from "src/common/enums";
import { ALL_MODELS } from "./model-registry";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return full.endsWith(".ts") && !full.endsWith(".test.ts") ? [full] : [];
  });
}

describe("model registry", () => {
  it("lists every model created in src/server", () => {
    const root = path.resolve(__dirname, "../..");
    const declared = sourceFiles(root).flatMap((file) =>
      [...readFileSync(file, "utf8").split("\n").filter((l) => !/^\s*(\*|\/\/)/.test(l)).join("\n").matchAll(/createMongoModel\(\s*EntityName\.(\w+)/g)].map((m) => m[1])
    );
    const registered = new Set(ALL_MODELS.map((model) => model.modelName));

    const missing = declared.filter((key) => !registered.has((EntityName as Record<string, string>)[key!]!));
    expect(missing).toEqual([]);
    expect(declared.length).toBe(ALL_MODELS.length);
  });
});
