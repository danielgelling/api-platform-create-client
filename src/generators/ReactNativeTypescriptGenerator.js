import chalk from "chalk";
import handlebars from "handlebars";
import hbhComparison from "handlebars-helpers/lib/comparison.js";
import hbhString from "handlebars-helpers/lib/string.js";
import BaseGenerator from "./BaseGenerator.js";

export default class ReactNativeTypescriptGenerator extends BaseGenerator {
  constructor(params) {
    super(params);

    this.registerTemplates(`react-native-ts/`, [
      // endpoints
      // "endpoints/foo.ts",

      // types
      "types/collection.ts",
      "types/foo.ts", // TODO: Remove optionality
      "types/item.ts",

      // utils
      "utils/dataAccess.ts",
      "utils/endpoints.ts",
      "utils/mercure.ts",
    ]);

    handlebars.registerHelper("compare", hbhComparison.compare);
    handlebars.registerHelper("lowercase", hbhString.lowercase);
  }

  help(resource) {
    console.log(
      chalk.green('Code for the "%s" resource type has been generated!'),
      resource.title
    );
  }

  generate(api, resource, dir) {
    const lc = resource.title.toLowerCase();
    const ucf = this.ucFirst(resource.title);
    const { fields, imports } = this.parseFields(resource);

    const context = {
      name: resource.name,
      lc,
      uc: resource.title.toUpperCase(),
      ucf,
      fields,
      formFields: this.buildFields(fields),
      imports,
      hydraPrefix: this.hydraPrefix,
      title: resource.title,
      hasRelations: fields.some((field) => field.reference || field.embedded),
      hasManyRelations: fields.some(
        (field) => field.isReferences || field.isEmbeddeds
      ),
    };

    // Create directories
    // These directories may already exist
    [
      `${dir}/config`,
      // `${dir}/endpoints`,
      `${dir}/types`,
      `${dir}/utils`,
    ].forEach((dir) => this.createDir(dir, false));

    // this.createFile(
    //   "endpoints/foo.ts",
    //   `${dir}/endpoints/${context.ucf}.ts`,
    //   context
    // );
    this.createFile("types/foo.ts", `${dir}/types/${context.ucf}.ts`, context);

    // copy with regular name
    [
      // endpoints

      // types
      "types/collection.ts",
      "types/item.ts",

      // utils
      "utils/dataAccess.ts",
      "utils/endpoints.ts",
      "utils/mercure.ts",
    ].forEach((file) =>
      this.createFile(file, `${dir}/${file}`, context, false)
    );

    // API config
    this.createEntrypoint(api.entrypoint, `${dir}/config/entrypoint.ts`);
  }

  getDescription(field) {
    return field.description ? field.description.replace(/"/g, "'") : "";
  }

  parseFields(resource) {
    const fields = [
      ...resource.writableFields,
      ...resource.readableFields,
    ].reduce((list, field) => {
      if (list[field.name] || field.name === "objectType") {
        return list;
      }

      const isReferences = Boolean(
        field.reference && field.maxCardinality !== 1
      );
      const isEmbeddeds = Boolean(field.embedded && field.maxCardinality !== 1);

      return {
        ...list,
        [field.name]: {
          ...field,
          type: this.getType(field),
          description: this.getDescription(field),
          readonly: false,
          required: field.required ?? false,
          isReferences,
          isEmbeddeds,
          isRelations: isEmbeddeds || isReferences,
        },
      };
    }, {});

    // Parse fields to add relevant imports, required for Typescript
    const fieldsArray = Object.values(fields);
    const imports = Object.values(fields).reduce(
      (list, { reference, type, embedded }) => {
        if (!reference && !embedded) {
          return list;
        }

        if (embedded) {
          return {
            ...list,
            [embedded.title]: {
              type: embedded.title,
              file: `./${embedded.title}`,
            },
          };
        }

        return {
          ...list,
          [type]: {
            type,
            file: `./${type}`,
          },
        };
      },
      {}
    );

    return { fields: fieldsArray, imports: Object.values(imports) };
  }

  ucFirst(target) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
}
