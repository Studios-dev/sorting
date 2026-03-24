import { expect, test } from "vite-plus/test";
import { cn } from "@/lib/utils.ts";

test("cn merges conditional and conflicting classes", () => {
  const conditionalClass: string | false = false;

  expect(cn("px-2", conditionalClass, "px-4", ["text-sm", null], undefined)).toBe("px-4 text-sm");
});
