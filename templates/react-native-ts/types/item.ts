export interface Item {
  "@id": string;
}

export const isItem = (data: any): data is Item => "@id" in data

export type ItemOrIri = Item | string;
