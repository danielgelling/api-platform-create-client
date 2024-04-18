import { fetch } from "./dataAccess";
import {Item} from "../types/item";

export const get = async <T extends Item>(id: T | string) =>
  await fetch<T>(typeof id === "string" ? id : id["@id"], {
    method: "GET",
  });

export const save = async <T extends Item>(value: T) =>
  await fetch<T>(value["@id"], {
    method: value["@id"] ? "PUT" : "POST",
    body: JSON.stringify(value),
  });

export const patch = async <T extends Item>(id: string, { ...values }: Partial<T>) =>
  await fetch<T>(id, {
    method: "PATCH",
    body: JSON.stringify(values),
    headers: { "Content-Type": "application/merge-patch+json" },
  });

export const remove = async <T extends Item>(id: string | T) =>
  await fetch<T>(typeof id === "string" ? id : id["@id"], {
    method: "DELETE",
  });
