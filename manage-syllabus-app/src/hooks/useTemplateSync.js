import { useEffect, useRef } from "react";
import { notification } from "antd";

const useTemplateSync = (templateId, onSync) => {
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!templateId) return;

    const baseUrl = process.env.REACT_APP_BASE_URL || "";
    const sseUrl = `${baseUrl}/sse/sync-stream/`;

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        if (!event?.data) return;
        try {
          const payload = JSON.parse(event.data);
          const isTargetTemplate = String(payload?.template_id) === String(templateId);
          if (!isTargetTemplate) return;

          notification.info({
            message: "Mẫu đề cương đã cập nhật",
            description: payload.message || "Chuyên viên vừa ban hành cấu hình định dạng mới.",
            placement: "topRight",
            duration: 4,
          });

          if (onSync) onSync(payload);
        } catch {
          // Ignore invalid parse
        }
      };

      es.onerror = () => {
        es.close();
      };
    } catch {
      // EventSource fallback
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [templateId, onSync]);
};

export default useTemplateSync;
