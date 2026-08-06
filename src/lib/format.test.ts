import { describe, expect, it } from "vitest";
import { compactGbp, gbp } from "./format";

// d3 formats negatives with U+2212 MINUS SIGN, not the ASCII hyphen (U+002D).
// Written as an explicit escape so the character in these expectations is
// unambiguous to a future reader (and doesn't silently become a hyphen via
// a find-and-replace or an editor autocorrect).
const MINUS = "−";

describe("gbp", () => {
  it("puts the sign in front of the £, not trapped inside it", () => {
    // Regression: `£${grouped(Math.round(value))}` renders "£−266,169" — the
    // minus lands after the currency literal instead of before it.
    expect(gbp(-266169.14)).toBe(`${MINUS}£266,169`);
    expect(gbp(5712342.8)).toBe("£5,712,343");
  });

  it("rounds -0.4 to a bare £0, never −£0", () => {
    // Math.round(-0.4) is -0, which d3 formats as the plain string "0" with
    // no sign. A naive `value < 0` check on the raw input (rather than on the
    // rounded/formatted output) would see -0.4 < 0 and wrongly prepend a minus.
    expect(gbp(-0.4)).toBe("£0");
    expect(gbp(0)).toBe("£0");
  });
});

describe("compactGbp", () => {
  it("puts the sign in front of the £ for compact magnitudes too", () => {
    expect(compactGbp(-1849998.21)).toBe(`${MINUS}£1.8M`);
    expect(compactGbp(5712342.8)).toBe("£5.7M");
  });
});
