import React, {useState, useCallback, useRef} from "react";
import {Button, Input} from "antd";
import {PlusOutlined, DeleteOutlined, DragOutlined} from "@ant-design/icons";
import {AgGridReact} from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./styles.css";
const CustomHeader = (props) => {
  return (
    <div className="flex justify-between items-center w-full group">
      <Input
        variant="borderless"
        value={props.displayName}
        onChange={(e) =>
          props.onNameChange(props.column.getColDef().field, e.target.value)
        }
        className="font-bold text-gray-700 bg-transparent hover:bg-gray-100 focus:bg-white px-2 rounded-sm w-full"
        placeholder="Tên cột..."
      />
      {props.onDelete && (
        <span
          onClick={() => props.onDelete(props.column.getColDef().field)}
          className="text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer px-1 font-bold hover:text-red-600 transition-opacity"
          title="Xóa cột"
        >
          ×
        </span>
      )}
    </div>
  );
};

const CustomCell = (props) => {
  const handleChange = (e) => {
    props.onCellChange(props.data.id, props.colDef.field, e.target.value);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const {node, api} = props;

    // Lấy chiều cao hiện tại (từ state hoặc fallback)
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
        api.onRowHeightChanged(); // Render mượt lúc đang kéo
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

  return (
    <div
      className="w-full h-full relative group"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <Input.TextArea
        variant="borderless"
        value={props.value || ""}
        onChange={handleChange}
        style={{
          flex: 1,
          resize: "none",
          padding: "2px 6px", // tuỳ chỉnh
          lineHeight: "normal",
          border: "none",
          outline: "none",
          background: "transparent",
          minHeight: 0, // ngăn TextArea co giãn không mong muốn
        }}
        className="w-full rounded-none bg-transparent focus:bg-white"
        placeholder="..."
      />
      <div
        className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize hover:bg-blue-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleMouseDown}
        title="Kéo để đổi chiều cao"
      />
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
      columns: initialCols,
      rows: Array.from({length: 3}, (_, i) => ({
        id: `r_${Date.now()}_${i}`,
        rowTitle: `Hàng ${i + 1}`,
        customHeight: 60, // Khởi tạo trường lưu chiều cao
        c_1: "",
        c_2: "",
        c_3: "",
      })),
    };
  });

  const syncToForm = useCallback((newData) => onChange?.(newData), [onChange]);

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
  }, []);

  const addColumn = () => {
    const newField = `c_${Date.now()}`;
    const newCol = {id: newField, headerName: "Cột mới", field: newField};
    setTableData((prev) => {
      const newData = {
        columns: [...prev.columns, newCol],
        rows: prev.rows.map((r) => ({...r, [newField]: ""})),
      };
      syncToForm(newData);
      return newData;
    });
  };

  const removeColumn = (field) => {
    setTableData((prev) => {
      const newData = {
        columns: prev.columns.filter((c) => c.field !== field),
        rows: prev.rows.map((r) => {
          const {[field]: _, ...rest} = r;
          return rest;
        }),
      };
      syncToForm(newData);
      return newData;
    });
  };

  const updateColumnName = (field, newName) => {
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
  };

  const updateFirstColumnName = (field, newName) => {
    setTableData((prev) => {
      const newData = {...prev, firstColumnHeader: newName};
      syncToForm(newData);
      return newData;
    });
  };

  const addRow = () => {
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
  };

  const removeRow = (rowId) => {
    setTableData((prev) => {
      const newData = {...prev, rows: prev.rows.filter((r) => r.id !== rowId)};
      syncToForm(newData);
      return newData;
    });
  };

  const updateCell = (rowId, field, newValue) => {
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
  };

  // HÀM MỚI: Cập nhật chiều cao vào state và ép Grid render lại
  const updateRowHeight = (rowId, customHeight) => {
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
        gridApiRef.current.resetRowHeights(); // Gọi hàm này để ép Grid chạy lại getRowHeight
      }
    }, 50);
  };

  const gridColumnDefs = [
    {
      headerName: tableData.firstColumnHeader || "Tên hàng",
      field: "rowTitle",
      width: 180,
      pinned: "left",
      resizable: true,
      rowDrag: true,
      headerClass: "border-r border-gray-200",
      cellStyle: {
        backgroundColor: "#f9fafb",
        borderTop: "1px solid #000000",
        borderRight: "1px solid #000000",
        borderBottom: "1px solid #000000",
        borderLeft: "1px solid #000000",
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
    // 3. Các cột động
    ...tableData.columns.map((col) => ({
      ...col,
      flex: 1,
      minWidth: 150,
      resizable: true,
      headerClass: "border-r border-gray-200",
      cellStyle: {
        borderTop: "1px solid #000000",
        borderRight: "1px solid #000000",
        borderBottom: "1px solid #000000",
        borderLeft: "1px solid #000000",
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
    // 4. Cột xóa
    {
      headerName: "",
      width: 50,
      pinned: "right",
      headerClass: "border-l border-gray-200",
      cellStyle: {
        borderTop: "1px solid #000000",
        borderRight: "1px solid #000000",
        borderBottom: "1px solid #000000",
        borderLeft: "1px solid #000000",
        display: "flex",
        alignItems: "stretch",
      },
      cellRenderer: (params) => (
        <div className="flex justify-center items-center h-full w-full">
          <Button
            danger
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeRow(params.data.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-gray-700 flex items-center gap-2">
          <DragOutlined className="text-gray-400" />
          Thiết kế bảng trực quan (Kéo góc dưới ô để đổi chiều cao)
        </span>
        <Button
          type="primary"
          ghost
          onClick={addColumn}
          icon={<PlusOutlined />}
        >
          Thêm cột
        </Button>
      </div>

      <div className="ag-theme-alpine w-full mb-3">
        <AgGridReact
          columnDefs={gridColumnDefs}
          rowData={tableData.rows}
          getRowId={(params) => params.data.id}
          getRowHeight={(params) => params.data.customHeight || 60}
          headerHeight={45}
          suppressRowClickSelection={true}
          suppressCellFocus={true}
          rowDragManaged={true}
          domLayout="autoHeight"
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
        className="text-blue-600 border-blue-300"
      >
        Thêm hàng mới
      </Button>
    </div>
  );
};

export default TableSchemaBuilder;
