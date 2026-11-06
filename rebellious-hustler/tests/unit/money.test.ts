import { describe, expect, it } from "vitest";
import { formatPence, parsePoundsToPence, penceToPoundsInput } from "@/lib/money";

describe("money", () => {
  it("formats pence as GBP", () => {
    expect(formatPence(2499)).toBe("£24.99");
    expect(formatPence(0)).toBe("£0.00");
    expect(formatPence(6000)).toBe("£60.00");
    expect(formatPence(123456)).toBe("£1,234.56");
  });

  it("parses pounds typed as text into pence", () => {
    expect(parsePoundsToPence("24.99")).toBe(2499);
    expect(parsePoundsToPence("£24.99")).toBe(2499);
    expect(parsePoundsToPence("24")).toBe(2400);
    expect(parsePoundsToPence("24.9")).toBe(2490);
    expect(parsePoundsToPence(" 1,234.56 ")).toBe(123456);
    expect(parsePoundsToPence("0")).toBe(0);
  });

  it("rejects anything that is not a price", () => {
    expect(parsePoundsToPence("")).toBeNull();
    expect(parsePoundsToPence("abc")).toBeNull();
    expect(parsePoundsToPence("-5")).toBeNull();
    expect(parsePoundsToPence("24.999")).toBeNull();
    expect(parsePoundsToPence("1e3")).toBeNull();
  });

  it("avoids floating point drift", () => {
    expect(parsePoundsToPence("0.29")).toBe(29);
    expect(parsePoundsToPence("1.10")).toBe(110);
  });

  it("renders pence back into an input value", () => {
    expect(penceToPoundsInput(2499)).toBe("24.99");
    expect(penceToPoundsInput(500)).toBe("5.00");
    expect(penceToPoundsInput(null)).toBe("");
  });
});
