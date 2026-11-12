import React, {useState, useCallback, useMemo, useEffect, useRef} from "react";
import {Button, Input, Tooltip} from "antd";
import {PlusOutlined, DeleteOutlined, TableOutlined, InfoCircleOutlined} from "@ant-design/icons";
import {AgGridReact} from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./styles.css";
import {cleanWhitespace, formatTypingWhitespace} from "../../utils/stringUtils";

const NO_ROWS_TEMPLATE = `
  <div style="padding: 24px; text-align: center; color: #64748b; display: flex; flex-direction: column; align-items: center; justify-content: center;">
    <div style="font-size: 26px; margin-bottom: 6px; opacity: 0.7;">📋</div>
    <div style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 4px;">Chưa có hàng nào trong bảng mẫu</div>
    <div style="font-size: 12px; color: #94a3b8;">Nhấn nút "+ Thêm hàng mới" bên dưới để thêm hàng</div>
  </div>
`;

const CustomHeader = (props) => {
  return (
    <div className="flex justify-between items-center w-full group pr-1">
      <Input
        variant="borderless"
        value={props.displayName}
        onChange={(e) =>
          props.onNameChange(
            props.column.getColDef().field,
            formatTypingWhitespace(e.target.value)
          )
        }
        onBlur={(e) =>
          props.onNameChange(
            props.column.getColDef().field,
            cleanWhitespace(e.target.value)
          )
        }
        className="font-semibold text-gray-800 bg-transparent hover:bg-white/70 focus:bg-white px-2 py-1 rounded transition-colors text-xs w-full"
        placeholder="Tên cột..."
      />
      {props.onDelete && (
        <Tooltip title="Xóa cột này">
          <span
            onClick={() => props.onDelete(props.column.getColDef().field)}
            className="text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer px-1.5 py-0.5 rounded font-bold hover:text-red-600 hover:bg-red-50 transition-all text-sm ml-1"
          >
            ×
          </span>
        </Tooltip>
      )}
    </div>
  );
};

const CustomCell = (props) => {
  const handleChange = (e) => {
    props.onCellChange(
      props.data.id,
      props.colDef.field,
      formatTypingWhitespace(e.target.value, true)
    );
  };

  const handleBlur = (e) => {
    props.onCellChange(
      props.data.id,
      props.colDef.field,
      cleanWhitespace(e.target.value, true)
    );
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
    <div
      className={`w-full h-full relative group flex flex-col ${isRowTitle ? "bg-slate-50 font-medium" : ""}`}
      style={{height: "100%", minHeight: "100%", position: "relative"}}
    >
      <Input.TextArea
        variant="borderless"
        value={props.value || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          flex: 1,
          height: "100%",
          resize: "none",
          padding: "6px 8px 10px 8px",
          lineHeight: "1.4",
          border: "none",
          outline: "none",
          background: "transparent",
          minHeight: 0,
        }}
        className="w-full rounded-none focus:bg-white transition-colors"
        placeholder={isRowTitle ? "Tên hàng..." : "Nội dung mẫu (tùy chọn)..."}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-[6px] cursor-row-resize flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
        style={{bottom: 0}}
        onMouseDown={handleMouseDown}
        title="Kéo mép dưới này để thay đổi chiều cao hàng"
      >
        <div className="w-full h-[2px] bg-blue-500 hover:bg-blue-600 transition-colors pointer-events-none" />
      </div>
    </div>
  );
};

const TableSchemaBuilder = ({value, onChange}) => {
  const gridApiRef = useRef(null);

  const [tableData, setTableData] = useState(() => {
    if (value?.columns && value?.rows) return value;
    const initialCols = [
      {id: `c_1`, headerName: "Cột 1", field: `c_1`},
      {id: `c_2`, headerName: "Cột 2", field: `c_2`},
      {id: `c_3`, headerName: "Cột 3", field: `c_3`},
    ];
    return {
      firstColumnHeader: "Tiêu đề hàng",
      columns: initialCols,
      rows: Array.from({length: 3}, (_, i) => ({
        id: `r_${Date.now()}_${i}`,
        rowTitle: `Hàng ${i + 1}`,
        customHeight: 60,
        c_1: "",
        c_2: "",
        c_3: "",
      })),
    };
  });

  const syncToForm = useCallback((newData) => onChange?.(newData), [onChange]);

  useEffect(() => {
    if (!value || !value.columns) {
      syncToForm(tableData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
  }, []);

  const addColumn = useCallback(() => {
    const newField = `c_${Date.now()}`;
    const newCol = {id: newField, headerName: `Cột ${tableData.columns.length + 1}`, field: newField};
    setTableData((prev) => {
      const newData = {
        ...prev,
        columns: [...prev.columns, newCol],
        rows: prev.rows.map((r) => ({...r, [newField]: ""})),
      };
      syncToForm(newData);
      return newData;
    });
  }, [tableData.columns.length, syncToForm]);

  const removeColumn = useCallback((field) => {
    setTableData((prev) => {
      const newData = {
        ...prev,
        columns: prev.columns.filter((c) => c.field !== field),
        rows: prev.rows.map((r) => {
          const {[field]: _, ...rest} = r;
          return rest;
        }),
      };
      syncToForm(newData);
      return newData;
    });
  }, [syncToForm]);

  const updateColumnName = useCallback((field, newName) => {
    setTableData((prev) => {
      const newData = {
        ...prev,
        columns: prev.columns.map((c) =>
          c.field === field ? {...c, headerName: newName} : c,
        ),
      };
      syncToForm(newData);
      return newData;
    });
  }, [syncToForm]);

  const updateFirstColumnName = useCallback((field, newName) => {
    setTableData((prev) => {
      const newData = {...prev, firstColumnHeader: newName};
      syncToForm(newData);
      return newData;
    });
  }, [syncToForm]);

  const addRow = useCallback(() => {
    setTableData((prev) => {
      const newRow = {
        id: `r_${Date.now()}`,
        rowTitle: `Hàng ${prev.rows.length + 1}`,
        customHeight: 60,
      };
      prev.columns.forEach((c) => (newRow[c.field] = ""));
      const newData = {...prev, rows: [...prev.rows, newRow]};
      syncToForm(newData);
      return newData;
    });
  }, [syncToForm]);

  const removeRow = useCallback((rowId) => {
    setTableData((prev) => {
      const newData = {...prev, rows: prev.rows.filter((r) => r.id !== rowId)};
      syncToForm(newData);
      return newData;
    });
  }, [syncToForm]);

  const updateCell = useCallback((rowId, field, newValue) => {
    setTableData((prev) => {
      const newData = {
        ...prev,
        rows: prev.rows.map((r) =>
          r.id === rowId ? {...r, [field]: newValue} : r,
        ),
      };
      syncToForm(newData);
      return newData;
    });
  }, [syncToForm]);

  const updateRowHeight = useCallback((rowId, customHeight) => {
    setTableData((prev) => {
      const newData = {
        ...prev,
        rows: prev.rows.map((r) => (r.id === rowId ? {...r, customHeight} : r)),
      };
      syncToForm(newData);
      return newData;
    });

    setTimeout(() => {
      if (gridApiRef.current) {
        gridApiRef.current.resetRowHeights();
      }
    }, 50);
  }, [syncToForm]);

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
      suppressMenu: true,
    }),
    [],
  );

  const gridColumnDefs = useMemo(() => [
    {
      headerName: tableData.firstColumnHeader || "Tiêu đề hàng",
      field: "rowTitle",
      width: 170,
      pinned: "left",
      resizable: true,
      rowDrag: true,
      headerClass: "border-r border-gray-200",
      cellStyle: {
        borderTop: "1px solid #e2e8f0",
        borderRight: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        borderLeft: "1px solid #e2e8f0",
        padding: 0,
        display: "flex",
        alignItems: "stretch",
      },
      cellRenderer: CustomCell,
      cellRendererParams: {
        onCellChange: updateCell,
        onHeightChange: updateRowHeight,
      },
      headerComponent: CustomHeader,
      headerComponentParams: {onNameChange: updateFirstColumnName},
    },
    ...tableData.columns.map((col) => ({
      ...col,
      flex: 1,
      minWidth: 150,
      resizable: true,
      headerClass: "border-r border-gray-200",
      cellStyle: {
        borderTop: "1px solid #e2e8f0",
        borderRight: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        borderLeft: "1px solid #e2e8f0",
        padding: 0,
        display: "flex",
        alignItems: "stretch",
      },
      cellRenderer: CustomCell,
      cellRendererParams: {
        onCellChange: updateCell,
        onHeightChange: updateRowHeight,
      },
      headerComponent: CustomHeader,
      headerComponentParams: {
        onDelete: removeColumn,
        onNameChange: updateColumnName,
      },
    })),
    {
      headerName: "",
      width: 48,
      pinned: "right",
      headerClass: "border-l border-gray-200",
      cellStyle: {
        borderTop: "1px solid #e2e8f0",
        borderRight: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        borderLeft: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      cellRenderer: (params) => (
        <Tooltip title="Xóa hàng này">
          <Button
            danger
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeRow(params.data.id)}
            className="hover:bg-red-50"
          />
        </Tooltip>
      ),
    },
  ], [tableData.firstColumnHeader, tableData.columns, updateCell, updateRowHeight, removeColumn, updateColumnName, updateFirstColumnName, removeRow]);

  const columnCount = tableData.columns.length + 1;
  const rowCount = tableData.rows.length;

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <TableOutlined className="text-blue-600 text-sm" />
          <span className="text-xs font-semibold text-gray-700">
            Thiết kế cấu trúc bảng mẫu
          </span>
          <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            {columnCount} cột • {rowCount} hàng
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <InfoCircleOutlined className="text-gray-400" />
            <span>Kéo mép cột để chỉnh độ rộng • Kéo cạnh đáy ô để chỉnh chiều cao</span>
          </div>
          <Button
            type="primary"
            size="small"
            onClick={addColumn}
            icon={<PlusOutlined />}
            className="rounded"
          >
            Thêm cột
          </Button>
        </div>
      </div>

      <div className="p-3">
        <div
          className="ag-theme-alpine table-schema-builder-grid w-full mb-3 rounded-lg overflow-hidden border border-gray-100"
          style={{minHeight: tableData.rows.length === 0 ? 140 : "auto"}}
        >
          <AgGridReact
            columnDefs={gridColumnDefs}
            defaultColDef={defaultColDef}
            rowData={tableData.rows}
            getRowId={(params) => params.data.id}
            getRowHeight={(params) => params.data.customHeight || 60}
            headerHeight={44}
            suppressRowClickSelection={true}
            suppressCellFocus={true}
            rowDragManaged={true}
            domLayout="autoHeight"
            overlayNoRowsTemplate={NO_ROWS_TEMPLATE}
            onGridReady={onGridReady}
            onRowDragEnd={(e) => {
              if (e.overIndex === -1) return;
              const fromIndex = tableData.rows.findIndex(
                (r) => r.id === e.node.data.id,
              );
              const toIndex = e.overIndex;
              if (fromIndex !== toIndex) {
                setTableData((prev) => {
                  const newRows = [...prev.rows];
                  const [moved] = newRows.splice(fromIndex, 1);
                  newRows.splice(toIndex, 0, moved);
                  const newData = {...prev, rows: newRows};
                  syncToForm(newData);
                  return newData;
                });
              }
            }}
          />
        </div>

        <Button
          type="dashed"
          block
          onClick={addRow}
          icon={<PlusOutlined />}
          className="text-blue-600 border-blue-300 hover:text-blue-700 hover:border-blue-500 font-medium h-9 rounded-lg"
        >
          Thêm hàng mới
        </Button>
      </div>
    </div>
  );
};

export default TableSchemaBuilder;
