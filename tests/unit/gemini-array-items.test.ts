import { describe, it, expect } from "vitest";
import { cleanJSONSchemaForAntigravity } from "../../open-sse/translator/helpers/geminiHelper.ts";

describe("Gemini array items sanitizer (#10578)", () => {
  it("should inject a string items schema for array types that are missing it", () => {
    const sloppySchema = {
      type: "object",
      properties: {
        emails: {
          type: "array",
        },
      },
      required: ["emails"],
    };

    const cleanedSchema = cleanJSONSchemaForAntigravity(sloppySchema) as any;

    expect(cleanedSchema.properties.emails.type).toBe("array");
    expect(cleanedSchema.properties.emails.items).toBeDefined();
    expect(cleanedSchema.properties.emails.items.type).toBe("string");
  });

  it("should safely ignore arrays that already have valid items", () => {
    const goodSchema = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: { type: "number" },
        },
      },
    };

    const cleanedSchema = cleanJSONSchemaForAntigravity(goodSchema) as any;

    expect(cleanedSchema.properties.tags.items.type).toBe("number");
  });
});