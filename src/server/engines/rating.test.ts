// @vitest-environment node
import { describe, expect, it } from "vitest";
import { combineRating } from "./rating";

describe("combineRating", () => {
  it("is zero with nothing to combine", () => expect(combineRating({ average: 0, count: 0 }, [])).toEqual({ average: 0, count: 0 }));
  it("keeps the baseline alone", () => expect(combineRating({ average: 4.96, count: 275 }, [])).toEqual({ average: 4.96, count: 275 }));
  it("weights new reviews against the baseline count", () => {
    expect(combineRating({ average: 5, count: 3 }, [1])).toEqual({ average: 4, count: 4 });
  });
  it("works without a baseline", () => expect(combineRating({ average: 0, count: 0 }, [4, 5])).toEqual({ average: 4.5, count: 2 }));
});
