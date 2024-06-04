import isomorphicFetch     from 'isomorphic-unfetch';
import { ENTRYPOINT }      from '../config/entrypoint';
import { PagedCollection } from '../types/collection';
import { Item }            from '../types/item';

const MIME_TYPE = 'application/ld+json';

interface Violation {
  message: string;
  propertyPath: string;
}

export interface FetchResponse<TData> {
  hubURL: string | null;
  data: TData;
  text: string;
}

export interface FetchError {
  message: string;
  status: string;
  fields: { [key: string]: string };
}

const extractHubURL = (response: Response): null | URL => {
  const linkHeader = response.headers.get('Link');
  if (!linkHeader) return null;

  const matches = linkHeader.match(
    /<([^>]+)>;\s+rel=(?:mercure|"[^"]*mercure[^"]*")/,
  );

  return matches && matches[1] ? new URL(matches[1], ENTRYPOINT) : null;
};

export const fetch = async <T extends Item>(
  id: string | T,
  init: RequestInit = {},
): Promise<FetchResponse<T>> => {
  if (typeof init.headers === 'undefined') init.headers = {};
  if (!Object.prototype.hasOwnProperty.call(init.headers, 'Accept'))
    init.headers = { ...init.headers, Accept: MIME_TYPE };
  if (
    init.body !== undefined &&
    !(init.body instanceof FormData) &&
    !Object.prototype.hasOwnProperty.call(init.headers, 'Content-Type')
  )
    init.headers = {
      ...init.headers,
      'Content-Type': init.method === 'PATCH' ? 'application/merge-patch+json' : MIME_TYPE
    };

  const resp = await isomorphicFetch(`${ENTRYPOINT}${typeof id === 'string' ? id : id['@id']}`, init);

  try {
    if (resp.status === 204) {
      return {
        hubURL: extractHubURL(resp)?.toString() || null, // URL cannot be serialized as JSON, must be sent as string
        data: {} as T,
        text: null,
      }
    }

    const text = await resp.text();
    const json = JSON.parse(text);
    if (resp.ok) {
      return {
        hubURL: extractHubURL(resp)?.toString() || null, // URL cannot be serialized as JSON, must be sent as string
        data: json,
        text,
      };
    }

    const errorMessage = json['{{{hydraPrefix}}}title'];
    const status = json['{{{hydraPrefix}}}description'] || resp.statusText;

    if (!json.violations) {
      throw {custom: true, message: errorMessage, name: 'Request failed', response: {resp, text}};
    }

    const fields: { [key: string]: string } = {};
    json.violations.map(
      (violation: Violation) =>
        (fields[violation.propertyPath] = violation.message),
    );

    throw { custom: true, message: errorMessage, status, fields } as FetchError;
  } catch(e) {
    if (e.custom) {
      throw e;
    }


  }
};

export const getItemPath = (
  iri: string | undefined,
  pathTemplate: string,
): string => {
  if (!iri) {
    return '';
  }

  const resourceId = iri.split('/').slice(-1)[0];

  return pathTemplate.replace('[id]', resourceId);
};

export const parsePage = (resourceName: string, path: string) =>
  parseInt(
    new RegExp(`^/${resourceName}\\?page=(\\d+)`).exec(path)?.[1] ?? '1',
    10,
  );

export const getItemPaths = async <TData extends Item>(
  response: FetchResponse<PagedCollection<TData>> | undefined,
  resourceName: string,
  pathTemplate: string,
) => {
  if (!response) return [];

  try {
    const view = response.data['{{{hydraPrefix}}}view'];
    const { '{{{hydraPrefix}}}last': last } = view ?? {};
    const paths =
      response.data['{{{hydraPrefix}}}member']?.map((resourceData) =>
        getItemPath(resourceData['@id'] ?? '', pathTemplate),
      ) ?? [];
    const lastPage = parsePage(resourceName, last ?? '');

    for (let page = 2; page <= lastPage; page++) {
      paths.push(
        ...((
          await fetch<PagedCollection<TData>>(`/${resourceName}?page=${page}`)
        )?.data['{{{hydraPrefix}}}member']?.map((resourceData) =>
          getItemPath(resourceData['@id'] ?? '', pathTemplate),
        ) ?? []),
      );
    }

    return paths;
  } catch (e) {
    console.error(e);

    return [];
  }
};

export const getCollectionPaths = async <TData extends Item>(
  response: FetchResponse<PagedCollection<TData>> | undefined,
  resourceName: string,
  pathTemplate: string,
) => {
  if (!response) return [];

  const view = response.data['{{{hydraPrefix}}}view'];
  const { '{{{hydraPrefix}}}last': last } = view ?? {};
  const paths = [pathTemplate.replace('[page]', '1')];
  const lastPage = parsePage(resourceName, last ?? '');

  for (let page = 2; page <= lastPage; page++) {
    paths.push(pathTemplate.replace('[page]', page.toString()));
  }

  return paths;
};
