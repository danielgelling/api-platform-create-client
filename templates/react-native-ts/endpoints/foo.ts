import {fetch} from '../utils/dataAccess';
import {PagedCollection} from '../types/collection';
import { {{{ucf}}} } from '../types/{{{ucf}}}';

export const get{{{ucf}}} = async (id: string) =>
  await fetch<{{{ucf}}}>(`/race-days/${id}`);

export const save{{{ucf}}} = async (value: {{{ucf}}}) =>
  await fetch<{{{ucf}}}>(!value['@id'] ? '/race-days' : value['@id'], {
    method: !value['@id'] ? 'POST' : 'PUT',
    body: JSON.stringify(value),
  });

export const patch{{{ucf}}} = async (id: string, { ...values }: Partial<{{{ucf}}}>) =>
  await fetch<{{{ucf}}}>(id, {
    method: 'PATCH',
    body: JSON.stringify(values),
    headers: { "Content-Type": "application/merge-patch+json" },
  });

export const delete{{{ucf}}} = async (value: string|{{{ucf}}}) =>
  await fetch<{{{ucf}}}>(typeof value === 'string' ? value : (value['@id'] ?? ''), { method: 'DELETE' });

export const get{{{ucf}}}sPath = (page?: string | string[] | undefined) =>
  `/race-days${typeof page === 'string' ? `?page=${page}` : ''}`;

export const get{{{ucf}}}s = async (page?: string | string[] | undefined) =>
  await fetch<PagedCollection<{{{ucf}}}>>(get{{{ucf}}}sPath(page));
