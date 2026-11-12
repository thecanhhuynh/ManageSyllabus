import React, {useCallback, useMemo, useRef} from "react";
import {Form, Button, Input, Popconfirm, Tooltip} from "antd";
import {PlusOutlined, DeleteOutlined, TableOutlined, InfoCircleOutlined} from "@ant-design/icons";
import {AgGridReact} from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import UpdateRequireWrapper from "../../components/wrapper/UpdateRequireWrapper";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const NO_ROWS_TEMPLATE = `
  <div style="padding: 24px 16px 42px 16px; text-align: center; color: #64748b; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
    <div style="font-size: 26px; margin-bottom: 6px; opacity: 0.7;">📋</div>
    <div style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 4px;">Chưa có dòng dữ liệu nào</div>
    <div style="font-size: 12px; color: #94a3b8; line-height: 1.4;">Nhấn nút "+ Thêm dòng dữ liệu" bên dưới để bắt đầu nhập</div>
  </div>
`;

const CustomCell = (props) => {
  const handleChange = (e) => {
    props.onCellChange(props.data.id, props.colDef.field, e.target.value);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const {node, api} = props;

    const startHeight =
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

  const isRowTitle = props.colDef.field === "rowTitle";

  return (
    <div className={`w-full h-full relative group flex flex-col ${isRowTitle ? "bg-slate-50 font-medium" : ""}`}>
      <Input.TextArea
        variant="borderless"
        value={props.value || ""}
        onChange={handleChange}
        style={{
          flex: 1,
          resize: "none",
          padding: "6px 8px",
          lineHeight: "1.4",
          border: "none",
          outline: "none",
          background: "transparent",
          minHeight: 0,
        }}
        className="w-full rounded-none focus:bg-white transition-colors"
        placeholder={isRowTitle ? "Tên hàng..." : "Nhập nội dung..."}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-blue-100"
        onMouseDown={handleMouseDown}
        title="Kéo cạnh này để đổi chiều cao hàng"
      >
        <div className="w-8 h-1 bg-blue-400 rounded-full pointer-events-none" />
      </div>
    </div>
  );
};

const AgGridTableInput = ({value, onChange, firstColumnHeader, tableName}) => {
  const gridApiRef = useRef(null);

  const schema = useMemo(() => {
    if (!value) return {columns: [], rows: []};
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return {
      columns: Array.isArray(parsed.columns) ? parsed.columns : [],
      rows: Array.isArray(parsed.rows) ? parsed.rows : [],
      firstColumnHeader: parsed.firstColumnHeader || firstColumnHeader || "Tiêu đề hàng",
    };
  }, [value, firstColumnHeader]);

  const syncToForm = useCallback((newData) => onChange?.(newData), [onChange]);

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
    params.api?.sizeColumnsToFit();
  }, []);

  const onGridSizeChanged = useCallback((params) => {
    params?.api?.sizeColumnsToFit();
  }, []);

  const updateCell = useCallback(
    (rowId, field, newValue) => {
      const newRows = schema.rows.map((r) =>
        r.id === rowId ? {...r, [field]: newValue} : r,
      );
      syncToForm({...schema, rows: newRows});
    },
    [schema, syncToForm],
  );

  const updateRowHeight = useCallback(
    (rowId, customHeight) => {
      const newRows = schema.rows.map((r) =>
        r.id === rowId ? {...r, customHeight} : r,
      );
      syncToForm({...schema, rows: newRows});

      setTimeout(() => {
        if (gridApiRef.current) {
          gridApiRef.current.resetRowHeights();
        }
      }, 50);
    },
    [schema, syncToForm],
  );

  const addRow = useCallback(() => {
    const newRow = {
      id: `r_${Date.now()}`,
      rowTitle: `Hàng ${schema.rows.length + 1}`,
      customHeight: 60,
    };
    schema.columns.forEach((c) => (newRow[c.field] = ""));
    syncToForm({...schema, rows: [...schema.rows, newRow]});
  }, [schema, syncToForm]);

  const removeRow = useCallback(
    (rowId) => {
      const newRows = schema.rows.filter((r) => r.id !== rowId);
      syncToForm({...schema, rows: newRows});
    },
    [schema, syncToForm],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
      suppressMenu: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
    }),
    [],
  );

  const columnDefs = useMemo(() => {
    const headerTitle = schema.firstColumnHeader || firstColumnHeader || "Tiêu đề hàng";
    const defs = [
      {
        headerName: headerTitle,
        field: "rowTitle",
        width: 140,
        minWidth: 110,
        pinned: "left",
        cellStyle: {padding: 0, display: "flex", alignItems: "stretch"},
        cellRenderer: CustomCell,
        cellRendererParams: {
          onCellChange: updateCell,
          onHeightChange: updateRowHeight,
        },
      },
    ];

    const dynamicCols = schema.columns.map((col) => ({
      headerName: col.headerName || "Cột",
      field: col.field,
      flex: 1,
      minWidth: 100,
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
    }));

    defs.push(...dynamicCols);

    defs.push({
      headerName: "",
      width: 48,
      minWidth: 48,
      maxWidth: 48,
      resizable: false,
      suppressMenu: true,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      cellRenderer: (params) => (
        <Tooltip title="Xóa dòng này">
          <Popconfirm
            title="Xác nhận xóa dòng này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => removeRow(params.data.id)}
          >
            <Button
              danger
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              className="hover:bg-red-50"
            />
          </Popconfirm>
        </Tooltip>
      ),
    });

    return defs;
  }, [schema.firstColumnHeader, schema.columns, firstColumnHeader, updateCell, updateRowHeight, removeRow]);

  const columnCount = schema.columns.length + 1;
  const rowCount = schema.rows.length;

  return (
    <div className="w-full border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <TableOutlined className="text-blue-600 text-sm" />
          <span className="text-xs font-semibold text-gray-700">
            {tableName || "Bảng dữ liệu"}
          </span>
          <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            {columnCount} cột • {rowCount} hàng
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <InfoCircleOutlined className="text-gray-400" />
          <span>Kéo mép cột để chỉnh độ rộng • Kéo cạnh đáy ô để chỉnh chiều cao</span>
        </div>
      </div>

      <div className="p-3">
        <div
          className="ag-theme-alpine w-full mb-3 rounded-lg overflow-hidden border border-gray-100"
          style={{minHeight: schema.rows.length === 0 ? 190 : "auto"}}
        >
          <AgGridReact
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowData={schema.rows}
            getRowId={(params) => params.data.id}
            headerHeight={42}
            getRowHeight={(params) => params.data.customHeight || 60}
            suppressRowClickSelection={true}
            suppressCellFocus={true}
            domLayout="autoHeight"
            overlayNoRowsTemplate={NO_ROWS_TEMPLATE}
            onGridReady={onGridReady}
            onGridSizeChanged={onGridSizeChanged}
          />
        </div>
        <Button
          type="dashed"
          block
          onClick={addRow}
          icon={<PlusOutlined />}
          className="text-blue-600 border-blue-300 hover:text-blue-700 hover:border-blue-500 font-medium h-9 rounded-lg"
        >
          Thêm dòng dữ liệu
        </Button>
      </div>
    </div>
  );
};

const TableEditor = ({item, basePath}) => {
  const tablePath = [...basePath, "table_schema"];
  const tableSchema = useSyllabusStore(
    (state) =>
      state.localBlocks[item.code]?.data?.table_schema ?? {
        columns: [],
        rows: [],
      },
  );

  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);
  const handleTableChange = (newSchema) => {
    updateLocalBlock(item.code, {table_schema: newSchema});
  };

  const CustomLabel = item.place_holder ? (
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {item.place_holder}
    </span>
  ) : null;

  let firstColumnHeader = null;
  const currentSchemaObj =
    typeof tableSchema === "string" ? JSON.parse(tableSchema) : tableSchema;

  if (currentSchemaObj?.firstColumnHeader) {
    firstColumnHeader = currentSchemaObj.firstColumnHeader;
  } else if (item.table_schema) {
    const parsedData =
      typeof item.table_schema === "string"
        ? JSON.parse(item.table_schema)
        : item.table_schema;
    firstColumnHeader = parsedData?.firstColumnHeader;
  }

  return (
    <UpdateRequireWrapper isRequired={item.requires_update}>
      <Form.Item name={tablePath} label={CustomLabel} style={{marginBottom: 0}}>
        <AgGridTableInput
          firstColumnHeader={firstColumnHeader}
          value={tableSchema}
          onChange={handleTableChange}
          tableName={item.place_holder || item.name}
        />
      </Form.Item>
    </UpdateRequireWrapper>
  );
};

export default TableEditor;
