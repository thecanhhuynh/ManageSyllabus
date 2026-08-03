import React, {useCallback, useRef} from "react";
import {Form, Button, Input} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import {AgGridReact} from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// 1. Dùng lại CustomCell từ TableSchemaBuilder để nhập liệu và kéo giãn chiều cao
const CustomCell = (props) => {
  const handleChange = (e) => {
    props.onCellChange(props.data.id, props.colDef.field, e.target.value);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const {node, api} = props;

    let startHeight =
      props.data.customHeight ||
      node.rowHeight ||
      api.getRowHeight(node.rowIndex) ||
      60;
    let animationFrameId;

    const onMouseMove = (moveEvent) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const delta = moveEvent.clientY - startY;
        node.setRowHeight(Math.max(42, startHeight + delta));
        api.onRowHeightChanged();
      });
    };

    const onMouseUp = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";

      const finalHeight = node.rowHeight;
      if (props.onHeightChange) {
        props.onHeightChange(props.data.id, finalHeight);
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "row-resize";
  };

  // Nếu là cột bị khóa (Cột đầu tiên - rowTitle), không cho nhập
  const isReadonly = props.colDef.field === "rowTitle";

  return (
    <div className="w-full h-full relative group flex flex-col">
      {isReadonly ? (
        <div className="flex-1 px-2 py-2 text-gray-700 bg-gray-50 flex items-center">
          {props.value || ""}
        </div>
      ) : (
        <Input.TextArea
          variant="borderless"
          value={props.value || ""}
          onChange={handleChange}
          style={{
            flex: 1,
            resize: "none",
            padding: "2px 6px",
            lineHeight: "normal",
            border: "none",
            outline: "none",
            background: "transparent",
            minHeight: 0,
          }}
          className="w-full rounded-none bg-transparent focus:bg-white"
          placeholder="..."
        />
      )}
      <div
        className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize hover:bg-blue-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleMouseDown}
        title="Kéo để đổi chiều cao"
      />
    </div>
  );
};

// 2. Component chính xử lý bảng
const AgGridTableInput = ({value, onChange, firstColumnHeader}) => {
  const gridApiRef = useRef(null);

  // Nếu giá trị khởi tạo bị stringify
  let schema = {columns: [], rows: []};
  if (value) {
    schema = typeof value === "string" ? JSON.parse(value) : value;
  }

  const syncToForm = useCallback((newData) => onChange?.(newData), [onChange]);

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
  }, []);

  // --- CÁC HÀM CẬP NHẬT DỮ LIỆU ---
  const updateCell = (rowId, field, newValue) => {
    const newRows = schema.rows.map((r) =>
      r.id === rowId ? {...r, [field]: newValue} : r,
    );
    syncToForm({...schema, rows: newRows});
  };

  const updateRowHeight = (rowId, customHeight) => {
    const newRows = schema.rows.map((r) =>
      r.id === rowId ? {...r, customHeight} : r,
    );
    syncToForm({...schema, rows: newRows});

    setTimeout(() => {
      if (gridApiRef.current) {
        gridApiRef.current.resetRowHeights();
      }
    }, 50);
  };

  const addRow = () => {
    const newRow = {
      id: `r_${Date.now()}`,
      rowTitle: `Hàng ${schema.rows.length + 1}`,
      customHeight: 60,
    };
    schema.columns.forEach((c) => (newRow[c.field] = ""));
    syncToForm({...schema, rows: [...schema.rows, newRow]});
  };

  const removeRow = (rowId) => {
    const newRows = schema.rows.filter((r) => r.id !== rowId);
    syncToForm({...schema, rows: newRows});
  };

  // --- ĐỊNH NGHĨA CỘT ---
  const columnDefs = [];

  // Cột khóa đầu tiên (nếu có)
  if (firstColumnHeader) {
    columnDefs.push({
      headerName: firstColumnHeader,
      field: "rowTitle",
      width: 180,
      pinned: "left",
      cellStyle: {padding: 0, display: "flex", alignItems: "stretch"},
      cellRenderer: CustomCell,
      cellRendererParams: {
        onCellChange: updateCell,
        onHeightChange: updateRowHeight,
      },
    });
  }

  // Cột dữ liệu bình thường
  const dynamicCols =
    schema.columns?.map((col) => ({
      headerName: col.headerName,
      field: col.field,
      flex: 1,
      minWidth: 150,
      cellStyle: {
        padding: 0,
        display: "flex",
        alignItems: "stretch",
        borderLeft: "1px solid #f0f0f0",
      },
      cellRenderer: CustomCell,
      cellRendererParams: {
        onCellChange: updateCell,
        onHeightChange: updateRowHeight,
      },
    })) || [];

  columnDefs.push(...dynamicCols);

  // Cột nút Xóa
  columnDefs.push({
    headerName: "",
    width: 50,
    pinned: "right",
    cellStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    cellRenderer: (params) => (
      <Button
        danger
        type="text"
        size="small"
        icon={<DeleteOutlined />}
        onClick={() => removeRow(params.data.id)}
      />
    ),
  });

  return (
    <div className="w-full border border-gray-200 rounded-lg p-3 bg-white">
      <div className="ag-theme-alpine w-full mb-3">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={schema.rows || []}
          getRowId={(params) => params.data.id}
          headerHeight={40}
          getRowHeight={(params) => params.data.customHeight || 60}
          suppressRowClickSelection={true}
          suppressCellFocus={true}
          domLayout="autoHeight"
          onGridReady={onGridReady}
        />
      </div>
      <Button
        type="dashed"
        block
        onClick={addRow}
        icon={<PlusOutlined />}
        className="text-blue-600 border-blue-300"
      >
        Thêm dòng dữ liệu
      </Button>
    </div>
  );
};

const TableEditor = ({item, basePath}) => {
  const tablePath = [...basePath, "table_schema"];

  const CustomLabel = item.place_holder ? (
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {item.place_holder}
    </span>
  ) : null;

  let firstColumnHeader = null;
  if (item.table_schema) {
    const parsedData =
      typeof item.table_schema === "string"
        ? JSON.parse(item.table_schema)
        : item.table_schema;
    firstColumnHeader = parsedData.firstColumnHeader;
  }

  return (
    <Form.Item name={tablePath} label={CustomLabel} style={{marginBottom: 0}}>
      <AgGridTableInput firstColumnHeader={firstColumnHeader} />
    </Form.Item>
  );
};

export default TableEditor;
