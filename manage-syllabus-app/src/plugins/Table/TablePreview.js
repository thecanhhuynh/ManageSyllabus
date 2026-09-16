import React from "react";
import {AgGridReact} from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const TablePreview = ({item}) => {
  let schema = {columns: [], rows: []};

  if (item.table_schema) {
    schema =
      typeof item.table_schema === "string"
        ? JSON.parse(item.table_schema)
        : item.table_schema;
  }

  const columnDefs = schema.columns.map((col) => ({
    headerName: col.headerName,
    field: col.field,
    flex: 1,
    minWidth: 150,
  }));

  if (schema.firstColumnHeader) {
    columnDefs.unshift({
      headerName: schema.firstColumnHeader,
      field: "rowTitle",
      width: 180,
      pinned: "left",
    });
  }

  return (
    <div className="w-full">
      <div className="font-semibold text-gray-700 mb-2">
        {item.place_holder}
      </div>
      <div className="ag-theme-alpine w-full">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={schema.rows}
          headerHeight={40}
          getRowHeight={(params) => params.data.customHeight || 60}
          suppressRowClickSelection={true}
          suppressCellFocus={true}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
};

export default TablePreview;
