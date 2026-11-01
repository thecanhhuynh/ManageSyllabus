export const DEFAULT_HEADER_MAIN_LINES = [
  {
    id: "main_0",
    text: "BỘ GIÁO DỤC VÀ ĐÀO TẠO",
    style: { font_name: "Times New Roman", font_size_pt: 12, bold: false, alignment: "CENTER" },
  },
  {
    id: "main_1",
    text: "MINISTRY OF EDUCATION AND TRAINING",
    style: { font_name: "Times New Roman", font_size_pt: 11, bold: false, alignment: "CENTER" },
  },
  {
    id: "main_2",
    text: "TRƯỜNG ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH",
    style: { font_name: "Times New Roman", font_size_pt: 12, bold: true, alignment: "CENTER" },
  },
  {
    id: "main_3",
    text: "HO CHI MINH CITY OPEN UNIVERSITY",
    style: { font_name: "Times New Roman", font_size_pt: 12, bold: true, alignment: "CENTER" },
  },
];

export const DEFAULT_TITLE_LINES = [
  {
    id: "title_0",
    text: "ĐỀ CƯƠNG MÔN HỌC",
    style: { font_name: "Times New Roman", font_size_pt: 14, bold: true, alignment: "CENTER" },
  },
  {
    id: "title_1",
    text: "COURSE SPECIFICATION",
    style: { font_name: "Times New Roman", font_size_pt: 13, bold: true, alignment: "CENTER" },
  },
];

export const DEFAULT_SIG_COLUMNS = [
  {
    title_lines: [
      { text: "PHỤ TRÁCH KHOA CNTT", style: { bold: true, font_size_pt: 12, alignment: "CENTER" } },
      { text: "DEPUTY DEAN", style: { bold: true, font_size_pt: 12, alignment: "CENTER" } },
    ],
    subtitle: "(Ký và ghi rõ họ tên-Signed with fullname)",
    name: "TS. Trương Hoàng Vinh",
    name_style: { bold: true, font_size_pt: 12, alignment: "CENTER" },
  },
  {
    title_lines: [
      { text: "GIẢNG VIÊN BIÊN SOẠN", style: { bold: true, font_size_pt: 12, alignment: "CENTER" } },
      { text: "ACADEMIC", style: { bold: true, font_size_pt: 12, alignment: "CENTER" } },
    ],
    subtitle: "(Ký và ghi rõ họ tên-Signed with fullname)",
    name: "ThS. Dương Hữu Thành",
    name_style: { bold: true, font_size_pt: 12, alignment: "CENTER" },
  },
];

export const DEFAULT_CONFIG = {
  header: {
    logo_url: null,
    logo_width_pt: 80,
    logo_alignment: "LEFT",
    appendix_text: "Phụ lục 7-Appendix 7",
    appendix_style: { italic: true, font_size_pt: 11, alignment: "RIGHT" },
    main_lines: DEFAULT_HEADER_MAIN_LINES,
    title_lines: DEFAULT_TITLE_LINES,
  },
  footer: {
    date_line: {
      text: "Thành phố Hồ Chí Minh, ngày 15 tháng 09 năm 2023",
      style: { italic: true, font_size_pt: 12, alignment: "RIGHT" },
    },
    signature_table: {
      columns: DEFAULT_SIG_COLUMNS,
    },
  },
};

export const normalizeHeaderConfig = (raw = {}) => {
  const h = raw?.header || raw || {};
  const rawMain = h.main_lines || (h.line1 || h.line2 ? [
    { text: h.line1 || "", style: { bold: false, font_size: 12 } },
    { text: h.line2 || "", style: { bold: true, font_size: 12 } },
  ] : null);

  const mainLines = (rawMain || DEFAULT_HEADER_MAIN_LINES).map((item, idx) => {
    if (typeof item === "string") {
      return { id: `main_${idx}`, text: item, style: {} };
    }
    const style = { ...(item.style || {}) };
    if (style.font_size && !style.font_size_pt) {
      style.font_size_pt = style.font_size;
    }
    return {
      id: item.id || `main_${idx}`,
      text: item.text || "",
      style,
    };
  });

  const rawTitles = h.title_lines || (h.title ? [{ text: h.title, style: { bold: true, font_size: 14 } }] : null);
  const titleLines = (rawTitles || DEFAULT_TITLE_LINES).map((item, idx) => {
    if (typeof item === "string") {
      return { id: `title_${idx}`, text: item, style: {} };
    }
    const style = { ...(item.style || {}) };
    if (style.font_size && !style.font_size_pt) {
      style.font_size_pt = style.font_size;
    }
    return {
      id: item.id || `title_${idx}`,
      text: item.text || "",
      style,
    };
  });

  return {
    logo_url: h.logo_url || null,
    logo_width_pt: Number(h.logo_width_pt) || 80,
    logo_alignment: (h.logo_alignment || "LEFT").toUpperCase(),
    appendix_text: h.appendix_text !== undefined ? h.appendix_text : DEFAULT_CONFIG.header.appendix_text,
    appendix_style: h.appendix_style || DEFAULT_CONFIG.header.appendix_style,
    main_lines: mainLines,
    title_lines: titleLines,
  };
};

export const normalizeFooterConfig = (raw = {}) => {
  const f = raw?.footer || raw || {};
  let dateLine = f.date_line || f.date_location;
  if (!dateLine) {
    dateLine = DEFAULT_CONFIG.footer.date_line;
  } else if (typeof dateLine === "string") {
    dateLine = {
      text: dateLine,
      style: { italic: true, font_size_pt: 12, alignment: "RIGHT" },
    };
  } else {
    dateLine = {
      text: dateLine.text || "",
      style: {
        italic: true,
        font_size_pt: 12,
        alignment: "RIGHT",
        ...(dateLine.style || {}),
      },
    };
  }

  const rawCols = f.signature_table?.columns || DEFAULT_SIG_COLUMNS;
  const columns = rawCols.map((col) => {
    const rawTitles = col.title_lines || [{ text: "" }, { text: "" }];
    const titleLines = rawTitles.map((tl) => {
      if (typeof tl === "string") {
        return { text: tl, style: { bold: true, font_size_pt: 12, alignment: "CENTER" } };
      }
      const style = { bold: true, font_size_pt: 12, alignment: "CENTER", ...(tl.style || {}) };
      if (style.font_size && !style.font_size_pt) {
        style.font_size_pt = style.font_size;
      }
      return { text: tl.text || "", style };
    });

    return {
      title_lines: titleLines,
      subtitle: col.subtitle || "",
      name: col.name || "",
      name_style: { bold: true, font_size_pt: 12, alignment: "CENTER", ...(col.name_style || {}) },
    };
  });

  return {
    date_line: dateLine,
    signature_table: { columns },
  };
};

export const getMediaUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const baseUrl = process.env.REACT_APP_BASE_URL || "http://127.0.0.1:8000";
  return `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
};
