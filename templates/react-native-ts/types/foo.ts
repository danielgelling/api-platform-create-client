import { Item } from "./item";
{{#each imports}}
import { {{{type}}} } from "{{{file}}}";
{{/each}}

export class {{{ucf}}} implements Item {
  public readonly "@id": string;
  public readonly "@type" = "{{{ucf}}}" as const;

  constructor(
    _id: string,
{{#each fields}}
    {{#if readonly}}readonly{{/if}} public {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}},
{{/each}}
  ) {
    this["@id"] = _id;
  }
}
