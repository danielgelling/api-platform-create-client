import { useEffect, useState }                from 'react';
import EventSource                            from 'react-native-sse';
import { PagedCollection, isPagedCollection } from '../types/collection';
import { Item, isItem }                       from '../types/item';

const mercureSubscribe = <T extends Item | PagedCollection<Item> | undefined>(
  hubURL: string,
  topics: (T | PagedCollection<T>)[],
  setData: (data: T) => void,
) => {
  const url = new URL(hubURL);

  topics.forEach((topic) => {
    if (!topic || !topic['@id']) throw new Error('@id is missing');

    url.searchParams.append('topic', new URL(topic['@id'], 'http://localhost:60080').toString());
  });

  const eventSource = new EventSource(url.toString());

  eventSource.addEventListener(
    'message',
    (event) => event.data && setData(JSON.parse(event.data)),
  );

  eventSource.addEventListener('close', (e) => {
    console.log(`EventSource "${url.toString()}" closed:`, e);
  });

  eventSource.addEventListener('error', (e) => {
    console.error(`EventSource "${url.toString()}" error:`, e);
  });

  return eventSource;
};

export const useMercure = <TData extends Item | PagedCollection<Item> | undefined>(
  initialData: TData,
  hubURL: string | null,
): TData => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData, hubURL]);

  useEffect(() => {
    if (!hubURL || !initialData) {
      return;
    }

    if (!isPagedCollection<Item>(initialData) && !isItem(initialData)) {
      console.error('Object sent is not in JSON-LD format.');

      return;
    }

    if (isPagedCollection<Item>(initialData)
      && initialData['{{{hydraPrefix}}}member']
    ) {
      // No members to subscribe to.
      if (initialData['{{{hydraPrefix}}}member'].length === 0) {
        return;
      }

      const eventSource = mercureSubscribe(hubURL, initialData['{{{hydraPrefix}}}member'], (item) => {
        const newData = Object.assign({}, initialData, data) as PagedCollection<Item>;

        if (!newData['{{{hydraPrefix}}}member']) {
          newData['{{{hydraPrefix}}}member'] = [];
        }

        const index = newData['{{{hydraPrefix}}}member'].findIndex(i => i['@id'] === item['@id']);

        if (index === -1) {
          newData['{{{hydraPrefix}}}member']?.push(item);
        } else {
          newData['{{{hydraPrefix}}}member'][index] = item;
        }

        setData({ ...newData } as TData);
      });

      return () => {
        eventSource.close();
      };
    }

    // It's a single object
    const eventSource = mercureSubscribe<TData>(hubURL, [initialData], setData);

    return () => {
      eventSource.close();
    };
  }, [initialData, hubURL]);

  return data;
};
