//adapted from react-science/app to support single file urls

import { useQuery } from '@tanstack/react-query';
import { FileCollection, fileCollectionFromWebservice, fileCollectionFromFileArray } from 'filelist-utils';
import { useCallback } from 'react';

import { AppDispatch, useAppDispatch } from 'react-science/app-data';
import { useHashSearchParams } from 'react-science/ui';

type LoadFn = (
  files: File[] | FileCollection,
  dispatch: AppDispatch,
) => Promise<void>;

export function useLoadFileCollectionFromHash(onLoad: LoadFn) {
  const appDispatch = useAppDispatch();
  const hashParams = useHashSearchParams();
  const filelistUrl = hashParams.get('filelist');
  const fileUrl = hashParams.get('file');

  if (filelistUrl) {
    const query = useQuery({
      queryKey: ['filelist', filelistUrl],
      queryFn: async () => {
        if (!filelistUrl) {
          return null;
        }
        const fileCollection = await fileCollectionFromWebservice(filelistUrl);
        void onLoad(fileCollection, appDispatch);
        return true;
      },
    });
    return query;
  }
  else if (fileUrl) {
    const query = useQuery({
      queryKey: ['file', fileUrl],
      queryFn: async () => {
        if (!fileUrl) {
          return null;
        }

        // split on fist single slash
        // Todo: Handle relative paths
        const path = fileUrl.split(/[^\/]([\/][^\/].*)/s)[1];
        const host = fileUrl.replace(path, "");
        let file = path.split("/").at(-1);
        if (!file) file = "Unnamed.mpr";

        const fileCollection = await fileCollectionFromFileArray([{
            relativePath: path,
            name: file,
            lastModified: 0, 
            size: 0,
          }], 
          host);
        void onLoad(fileCollection, appDispatch);
        return true;
      },
    });
    return query;
  }
}

export function useDropFiles(onLoad: LoadFn) {
  const dispatch = useAppDispatch();
  const onDrop = useCallback(
    (files: File[]) => {
      void onLoad(files, dispatch);
    },
    [dispatch, onLoad],
  );
  return onDrop;
}
