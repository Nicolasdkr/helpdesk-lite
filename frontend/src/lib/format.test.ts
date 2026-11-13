import { describe, expect, it } from "vitest";
import { formatRelative, initials } from "./format";

describe("formatRelative", () => {
  const now = new Date("2026-11-12T12:00:00Z");

  it("muestra 'ahora' para menos de un minuto", () => {
    expect(formatRelative("2026-11-12T11:59:30Z", now)).toBe("ahora");
  });

  it("usa la unidad más grande que corresponda", () => {
    expect(formatRelative("2026-11-12T09:00:00Z", now)).toBe("hace 3 horas");
    expect(formatRelative("2026-11-11T12:00:00Z", now)).toBe("ayer");
    expect(formatRelative("2026-10-29T12:00:00Z", now)).toBe("hace 2 semanas");
  });
});

describe("initials", () => {
  it("toma la primera letra de las dos primeras palabras", () => {
    expect(initials("Tomás Técnico")).toBe("TT");
    expect(initials("ana maría lópez")).toBe("AM");
    expect(initials("Nicolas")).toBe("N");
  });
});
