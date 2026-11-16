import React, {useState, useEffect, useRef, useCallback, useMemo} from "react";
import {Select} from "antd";
import PropTypes from "prop-types";
import {authApis} from "../../config/Apis";
import MySpinner from "../MySpinner";

const DELAY_SPINNER_MS = 500;
const DEFAULT_DEBOUNCE_MS = 400;

const formatOptionItem = (item, labelField, valueField, optionRenderer) => {
  if (!item) return null;
  const val = item[valueField] ?? item.id;
  if (val === undefined || val === null) return null;

  let lbl = "";
  if (typeof labelField === "function") {
    lbl = labelField(item);
  } else {
    lbl = item[labelField] ?? item.name ?? String(val);
  }

  const renderedContent = optionRenderer ? optionRenderer(item) : lbl;
  return {
    value: val,
    label: renderedContent,
    raw: item,
  };
};

const LazySelect = ({
  endpoint,
  fetchData,
  extraParams = null,
  labelField = "name",
  valueField = "id",
  initialLabel = "",
  initialOption = null,
  initialOptions = [],
  tagRenderer = null,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  placeholder = "Vui lòng chọn...",
  allowClear = true,
  showSearch = true,
  disabled = false,
  mode = undefined,
  value,
  onChange,
  onLoadedData,
  optionRenderer,
  style,
  className,
  ...restProps
}) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchTimerRef = useRef(null);
  const extraParamsRef = useRef(extraParams);
  extraParamsRef.current = extraParams;

  const executeApiCall = useCallback(
    async (targetPage, keyword) => {
      if (typeof fetchData === "function") {
        return await fetchData({
          page: targetPage,
          q: keyword,
          extraParams: extraParamsRef.current,
        });
      }

      if (!endpoint) return {results: [], next: null};

      let url = `${endpoint}?page=${targetPage}`;
      if (keyword && keyword.trim()) {
        url += `&q=${encodeURIComponent(keyword.trim())}`;
      }

      if (extraParamsRef.current) {
        Object.entries(extraParamsRef.current).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            url += `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
          }
        });
      }

      const res = await authApis().get(url);
      return res.data;
    },
    [endpoint, fetchData],
  );

  const loadData = useCallback(
    async (targetPage = 1, keyword = "", isReset = false) => {
      setLoading(true);
      const startTime = Date.now();

      try {
        const data = await executeApiCall(targetPage, keyword);
        const newResults = data?.results || (Array.isArray(data) ? data : []);
        const nextUrl = data?.next;

        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, DELAY_SPINNER_MS - elapsed);
        if (remainingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }

        if (isReset || targetPage === 1) {
          setItems(newResults);
        } else {
          setItems((prev) => [...prev, ...newResults]);
        }

        setHasMore(Boolean(nextUrl));
        setPage(targetPage);
        setHasLoadedOnce(true);

        if (onLoadedData) {
          onLoadedData(newResults, targetPage);
        }
      } catch (error) {
        console.error("LazySelect fetch error:", error);
      } finally {
        setLoading(false);
      }
    },
    [executeApiCall, onLoadedData],
  );

  const handleDropdownVisibleChange = (open) => {
    if (!open) return;
    if (hasLoadedOnce) return;
    loadData(1, searchQuery, true);
  };

  const handlePopupScroll = (e) => {
    const {target} = e;
    const isNearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 15;

    if (!isNearBottom) return;
    if (loading || !hasMore) return;

    loadData(page + 1, searchQuery, false);
  };

  const handleSearch = (keyword) => {
    setSearchQuery(keyword);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      loadData(1, keyword, true);
    }, debounceMs);
  };

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedOnce) return;
    loadData(1, searchQuery, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraParams]);

  useEffect(() => {
    if (hasLoadedOnce) return;
    const hasValue = Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== null && value !== "";
    if (hasValue) {
      loadData(1, "", true);
    }
  }, [value, hasLoadedOnce, loadData]);

  const selectOptions = useMemo(() => {
    const list = items
      .map((item) =>
        formatOptionItem(item, labelField, valueField, optionRenderer),
      )
      .filter(Boolean);

    if (value === undefined || value === null || value === "") {
      return list;
    }

    if (Array.isArray(value)) {
      const missingValues = value.filter(
        (val) => !list.some((opt) => String(opt.value) === String(val)),
      );
      if (missingValues.length === 0) return list;

      const fallbackOptions = missingValues.map((val) => {
        const foundInitial = Array.isArray(initialOptions)
          ? initialOptions.find((opt) => {
              const optVal =
                opt[valueField] ?? opt.id ?? opt.value ?? opt.code;
              return String(optVal) === String(val);
            })
          : null;

        if (foundInitial) {
          const formatted = formatOptionItem(
            foundInitial,
            labelField,
            valueField,
            optionRenderer,
          );
          if (formatted) return formatted;
        }

        return {
          value: val,
          label: String(val).startsWith("PLO") ? String(val) : `Mục #${val}`,
          raw: null,
        };
      });
      return [...fallbackOptions, ...list];
    }

    const valueExists = list.some((opt) => String(opt.value) === String(value));
    if (valueExists) {
      return list;
    }

    const fallbackLabel =
      initialOption?.label || initialLabel || `ID: ${value}`;
    const initialItem = {
      value: value,
      label: fallbackLabel,
      raw: initialOption?.raw || null,
    };
    return [initialItem, ...list];
  }, [
    items,
    value,
    initialLabel,
    initialOption,
    initialOptions,
    labelField,
    valueField,
    optionRenderer,
  ]);

  const renderDropdown = (menu) => {
    return (
      <>
        {menu}
        {loading && items.length > 0 && (
          <div className="py-2 flex justify-center border-t border-gray-100 bg-white">
            <MySpinner
              fullScreen={false}
              size="small"
              message="Đang tải thêm..."
            />
          </div>
        )}
      </>
    );
  };

  const emptyContent = loading ? (
    <MySpinner fullScreen={false} size="small" message="Đang tải dữ liệu..." />
  ) : (
    <div className="py-4 text-center text-gray-400 text-xs">
      Không tìm thấy dữ liệu
    </div>
  );

  return (
    <Select
      showSearch={showSearch}
      filterOption={false}
      loading={loading}
      disabled={disabled}
      placeholder={placeholder}
      allowClear={allowClear}
      mode={mode}
      value={value}
      onChange={onChange}
      tagRender={tagRenderer || undefined}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      onPopupScroll={handlePopupScroll}
      onSearch={handleSearch}
      dropdownRender={renderDropdown}
      notFoundContent={emptyContent}
      options={selectOptions}
      style={style}
      className={className}
      {...restProps}
    />
  );
};

LazySelect.propTypes = {
  endpoint: PropTypes.string,
  fetchData: PropTypes.func,
  extraParams: PropTypes.object,
  labelField: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  valueField: PropTypes.string,
  initialLabel: PropTypes.string,
  initialOption: PropTypes.object,
  initialOptions: PropTypes.array,
  tagRenderer: PropTypes.func,
  debounceMs: PropTypes.number,
  placeholder: PropTypes.string,
  allowClear: PropTypes.bool,
  showSearch: PropTypes.bool,
  disabled: PropTypes.bool,
  mode: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onLoadedData: PropTypes.func,
  optionRenderer: PropTypes.func,
  style: PropTypes.object,
  className: PropTypes.string,
};

export default LazySelect;
