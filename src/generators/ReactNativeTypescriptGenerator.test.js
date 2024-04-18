import { Api, Resource, Field } from "@api-platform/api-doc-parser";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import tmp from "tmp";
import ReactNativeTypescriptGenerator from "./ReactNativeTypescriptGenerator.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const generator = new ReactNativeTypescriptGenerator({
  hydraPrefix: "hydra:",
  templateDirectory: `${dirname}/../../templates`,
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("generate", () => {
  test("Generate a Next app", () => {
    const tmpobj = tmp.dirSync({ unsafeCleanup: true });

    const fields = [
      new Field("bar", {
        id: "http://schema.org/url",
        range: "http://www.w3.org/2001/XMLSchema#string",
        reference: null,
        required: true,
        description: "An URL",
      }),
    ];
    const resource = new Resource("prefix/aBe_cd", "http://example.com/foos", {
      id: "abc",
      title: "abc",
      readableFields: fields,
      writableFields: fields,
    });
    const api = new Api("http://example.com", {
      entrypoint: "http://example.com:8080",
      title: "My API",
      resources: [resource],
    });
    generator.generate(api, resource, tmpobj.name);

    [
      "/config/entrypoint.ts",
      "/endpoints/Abc.ts",
      "/types/Abc.ts",
      "/types/collection.ts",
      "/types/item.ts",
      "/utils/dataAccess.ts",
      "/utils/mercure.ts",
    ].forEach((file) => expect(fs.existsSync(tmpobj.name + file)).toBe(true));

    ["/types/Abc.ts"].forEach((file) => {
      expect(fs.existsSync(tmpobj.name + file)).toBe(true);
      expect(fs.readFileSync(tmpobj.name + file, "utf8")).toMatch(/bar/);
    });

    tmpobj.removeCallback();
  });
});
