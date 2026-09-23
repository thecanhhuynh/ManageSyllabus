export const copyTableToClipboard = async (tag, schema) => {
  let headerHtml = `<tr style="background-color: #e8e8e8; font-weight: bold; text-align: center;">`;
  let loopHtml = `<tr>`;

  if (Array.isArray(schema) && schema.length > 0) {
    schema.forEach((col) => {
      const label = col.label || col.key;
      headerHtml += `<td style="border: 1px solid #000; padding: 5px;">${label}</td>`;
      loopHtml += `<td style="border: 1px solid #000; padding: 5px;">[[ROW.${col.key}]]</td>`;
    });
  } else {
    headerHtml += `<td style="border: 1px solid #000; padding: 5px;">Nội dung</td>`;
    loopHtml += `<td style="border: 1px solid #000; padding: 5px;">[[ROW.content]]</td>`;
  }

  headerHtml += `</tr>`;
  loopHtml += `</tr>`;

  const tableHtml = `
      <table style="border-collapse: collapse; width: 100%; border: 1px solid #000; font-family: 'Times New Roman', serif; font-size: 12pt;">
        ${headerHtml}
        ${loopHtml}
      </table>
      <p><br/></p>
    `;

  try {
    const blobHtml = new Blob([tableHtml], {type: "text/html"});
    const blobText = new Blob([`[Bảng: ${tag}]`], {type: "text/plain"});

    const clipboardItem = new window.ClipboardItem({
      "text/html": blobHtml,
      "text/plain": blobText,
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.error("Lỗi copy bảng:", err);
    return false;
  }
};
