import React, {useCallback} from "react";
import {Form} from "antd";
import {AgGridReact} from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Component con hỗ trợ binding giá trị (value/onChange) với Form.Item của Antd
const AgGridTableInput = ({value, onChange, firstColumnHeader}) => {
  let schema = {columns: [], rows: []};

  if (value) {
    schema = typeof value === "string" ? JSON.parse(value) : value;
  }

  const columnDefs =
    schema.columns?.map((col) => ({
      headerName: col.headerName,
      field: col.field,
      flex: 1,
      minWidth: 150,
      editable: true, // Cho phép sửa dữ liệu ở các cột bình thường
    })) || [];

  // Thêm cột đầu tiên (rowTitle) và khóa chỉnh sửa (readonly)
  if (firstColumnHeader) {
    columnDefs.unshift({
      headerName: firstColumnHeader,
      field: "rowTitle",
      width: 180,
      pinned: "left",
      editable: false, // Không cho phép chỉnh sửa cột tên hàng
      cellStyle: {
        backgroundColor: "#f9fafb",
        fontWeight: 600,
      },
    });
  }

  const handleCellValueChanged = useCallback(
    (event) => {
      const updatedRows = [];
      event.api.forEachNode((node) => updatedRows.push(node.data));

      const updatedSchema = {
        ...schema,
        rows: updatedRows,
      };

      if (onChange) {
        onChange(updatedSchema);
      }
    },
    [schema, onChange],
  );

  return (
    <div className="ag-theme-alpine w-full">
      <AgGridReact
        columnDefs={columnDefs}
        rowData={schema.rows || []}
        headerHeight={40}
        getRowHeight={(params) => params.data.customHeight || 60}
        onCellValueChanged={handleCellValueChanged}
        stopEditingWhenCellsLoseFocus={true}
        domLayout="autoHeight"
      />
    </div>
  );
};

const TableEditor = ({item, basePath}) => {
  const tablePath = [...basePath, "data"];

  const CustomLabel = item.place_holder ? (
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {item.place_holder}
    </span>
  ) : null;

  // Xử lý an toàn để lấy header của cột đầu tiên từ trường data
  let firstColumnHeader = null;
  if (item.data) {
    const parsedData =
      typeof item.data === "string" ? JSON.parse(item.data) : item.data;
    firstColumnHeader = parsedData.firstColumnHeader;
  }

  return (
    <Form.Item name={tablePath} label={CustomLabel} style={{marginBottom: 0}}>
      <AgGridTableInput firstColumnHeader={firstColumnHeader} />
    </Form.Item>
  );
};

export default TableEditor;
