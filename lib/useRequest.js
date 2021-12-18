import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export const useGetData = (path) => {
  if (!path) {
    throw new Error("Path is required");
  }

  const url = path;

  const { data, error } = useSWR(url, fetcher);

  return { data, error };
};
