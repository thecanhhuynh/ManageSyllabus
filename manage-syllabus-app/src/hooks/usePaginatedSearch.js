import {useState, useEffect, useRef, useCallback} from "react";

export const usePaginatedSearch = (fetchFunction) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [q, setQ] = useState("");
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchFunction(page, q);
        if (isMounted) {
          setData((prev) =>
            page === 1 ? res.data.results : [...prev, ...res.data.results],
          );
          setHasNext(!!res.data.next);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [page, q, fetchFunction]);

  const handleSearch = useCallback((val) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setQ(val);
      setPage(1);
    }, 500);
  }, []);

  const loadMore = useCallback(() => {
    if (hasNext && !loading) setPage((p) => p + 1);
  }, [hasNext, loading]);

  return {data, loading, handleSearch, loadMore};
};
