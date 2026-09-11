import {useState, useEffect} from "react";
import {AppServices} from "../../../services/AppServices";
import {usePaginatedSearch} from "../../../hooks/usePaginatedSearch";

export const useRequirementData = () => {
  const [reqTypes, setReqTypes] = useState([]);

  useEffect(() => {
    AppServices.getReqTypes()
      .then((res) => setReqTypes(res.data))
      .catch(console.error);
  }, []);

  const {
    data: subjects,
    loading,
    handleSearch,
    loadMore,
  } = usePaginatedSearch(AppServices.getReqTypes);

  return {reqTypes, subjects, loading, handleSearch, loadMore};
};
