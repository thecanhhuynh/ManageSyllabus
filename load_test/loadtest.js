import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        sse_listeners: {
            executor: 'constant-vus',
            vus: 5, 
            duration: '30s',
            exec: 'listen_sse',
        },
        sync_triggers: {
            executor: 'constant-vus',
            vus: 1, 
            duration: '30s',
            exec: 'trigger_sync',
        }
    }
};

export function listen_sse() {
    const res = http.get('http://127.0.0.1:8000/sse/sync-stream/', {
        timeout: '60s' 
    });
    check(res, { 'SSE connected (200)': (r) => r.status === 200 });
}

export function trigger_sync() {

    const url = 'http://127.0.0.1:8000/templates/1/'; 
    
    // Đã cập nhật payload giống hệt với request của React frontend
    const payload = JSON.stringify({ 
        name: "Test k6 Template",
        version: "2.0",
        main_sections: [] 
    }); 
    
    const params = { 
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer aLEiLeU5AsSy0XRr2ZPKUxqEfSoy55' 
        } 
    };

    // Đã đổi từ http.post sang http.put
    const res = http.put(url, payload, params);
    if (res.status !== 200 && res.status !== 201) {
    console.log(`[Lỗi ${res.status}] Backend phản hồi: ${res.body}`);
	}
    check(res, { 
        'Sync triggered (200 or 201)': (r) => r.status === 200 || r.status === 201 
    });
    
    sleep(3); 
}