

import json
from datetime import datetime, timezone

import redis

_redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

TEMPLATE_STYLE_CHANNEL = 'template_style_channel'

class NotifyService:
    """
    Gửi event thông báo đến các client đang kết nối SSE.
    Tất cả method là classmethod — không cần khởi tạo instance.
    """

    @classmethod
    def notify_template_updated(cls, template_id: int, template_name: str, label_overrides: dict | None = None) -> None:
        """
        Publish event 'style_updated' lên Redis khi Specialist publish hoặc cập nhật block_layout.
        """
        payload = cls._build_style_updated_payload(template_id, template_name, label_overrides)
        try:
            _redis_client.publish(TEMPLATE_STYLE_CHANNEL, json.dumps(payload))
        except Exception:
            pass

    @staticmethod
    def _build_style_updated_payload(template_id: int, template_name: str, label_overrides: dict | None = None) -> dict:
        """Tạo payload JSON chuẩn cho event style_updated."""
        payload = {
            'action': 'style_updated',
            'template_id': template_id,
            'template_name': template_name,
            'updated_at': datetime.now(tz=timezone.utc).isoformat(),
        }
        if label_overrides:
            payload['label_overrides'] = label_overrides
        return payload
