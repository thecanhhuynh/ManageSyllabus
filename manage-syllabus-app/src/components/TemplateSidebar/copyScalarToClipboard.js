export const copyScalarToClipboard = async (tag) => {
  const token = `[[${tag}]]`;
  try {
    await navigator.clipboard.writeText(token);
    return true;
  } catch (err) {
    console.error("Lỗi copy văn bản:", err);
    return false;
  }
};
