import json
import os
import psycopg2
from datetime import datetime

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Api-Path',
}

def get_conn():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}')
    return conn

def get_user(cur, session_id):
    if not session_id:
        return None
    cur.execute(
        "SELECT u.id, u.login, u.full_name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'login': row[1], 'full_name': row[2], 'role': row[3]}

def to_list(cur, rows):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in rows]

def to_dict(cur, row):
    cols = [d[0] for d in cur.description]
    return dict(zip(cols, row))

def fix(obj):
    if isinstance(obj, dict):
        return {k: fix(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [fix(i) for i in obj]
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return obj

def ok(data):
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(fix(data), ensure_ascii=False)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_header(event, name):
    """Регистронезависимое чтение заголовка (прокси меняет регистр)."""
    headers = event.get('headers', {}) or {}
    name_lower = name.lower()
    for k, v in headers.items():
        if k.lower() == name_lower:
            return v
    return ''

def handler(event: dict, context) -> dict:
    """Главное API: объекты, табель, документы, фото, команда, чат, статистика"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if raw_body.strip() else {}
    # Сессия: из заголовка (регистронезависимо) или из body как запасной вариант
    session_id = get_header(event, 'X-Session-Id') or body.get('__session_id', '')
    # Query-параметры (GET передаёт сюда фильтры)
    params = event.get('queryStringParameters') or {}

    # Путь берём из заголовка X-Api-Path (фронтенд всегда ставит)
    # Для POST/PUT/DELETE также принимаем из body.__path как запасной вариант
    path = (
        get_header(event, 'X-Api-Path')
        or body.get('__path', '')
        or params.get('__path', '')
        or '/'
    )

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user(cur, session_id)
        if not user:
            return err('Необходима авторизация', 401)

        # ===== OBJECTS =====
        if path.startswith('/objects'):
            parts = path.split('/')
            obj_id = parts[2] if len(parts) > 2 and parts[2].isdigit() else None

            if method == 'GET' and not obj_id:
                if user['role'] == 'manager':
                    cur.execute("SELECT o.*, u.full_name as foreman_name FROM objects o LEFT JOIN users u ON u.id = o.foreman_id ORDER BY o.created_at DESC")
                else:
                    cur.execute("SELECT o.*, u.full_name as foreman_name FROM objects o LEFT JOIN users u ON u.id = o.foreman_id WHERE o.foreman_id = %s ORDER BY o.created_at DESC", (user['id'],))
                return ok(to_list(cur, cur.fetchall()))

            if method == 'POST':
                if user['role'] != 'manager':
                    return err('Только управленец', 403)
                cur.execute(
                    "INSERT INTO objects (name, address, status, tag, progress, deadline, budget, foreman_id, created_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('name'), body.get('address'), body.get('status','active'), body.get('tag'), body.get('progress',0), body.get('deadline') or None, body.get('budget') or None, body.get('foreman_id') or None, user['id'])
                )
                row = cur.fetchone(); conn.commit()
                return ok(to_dict(cur, row))

            if method == 'PUT' and obj_id:
                if user['role'] == 'manager':
                    cur.execute(
                        "UPDATE objects SET name=%s, address=%s, status=%s, tag=%s, progress=%s, deadline=%s, budget=%s, foreman_id=%s WHERE id=%s RETURNING *",
                        (body.get('name'), body.get('address'), body.get('status','active'), body.get('tag'), body.get('progress',0), body.get('deadline') or None, body.get('budget') or None, body.get('foreman_id') or None, obj_id)
                    )
                else:
                    cur.execute(
                        "UPDATE objects SET progress=%s, status=%s WHERE id=%s AND foreman_id=%s RETURNING *",
                        (body.get('progress'), body.get('status'), obj_id, user['id'])
                    )
                row = cur.fetchone(); conn.commit()
                return ok(to_dict(cur, row) if row else {})

            if method == 'DELETE' and obj_id:
                if user['role'] != 'manager':
                    return err('Только управленец', 403)
                cur.execute("DELETE FROM objects WHERE id=%s", (obj_id,))
                conn.commit()
                return ok({'ok': True})

        # ===== TIMESHEET =====
        if path.startswith('/timesheet'):
            month = params.get('month') or body.get('month') or datetime.now().strftime('%Y-%m')
            if method == 'GET':
                if user['role'] == 'manager':
                    cur.execute("""
                        SELECT t.*, u.full_name, u.login FROM timesheet t
                        JOIN users u ON u.id = t.worker_id
                        WHERE to_char(t.work_date,'YYYY-MM') = %s
                        ORDER BY u.full_name, t.work_date
                    """, (month,))
                else:
                    cur.execute("""
                        SELECT t.*, u.full_name, u.login FROM timesheet t
                        JOIN users u ON u.id = t.worker_id
                        WHERE to_char(t.work_date,'YYYY-MM') = %s AND t.worker_id = %s
                        ORDER BY t.work_date
                    """, (month, user['id']))
                return ok(to_list(cur, cur.fetchall()))

            if method == 'POST':
                worker_id = body.get('worker_id', user['id'])
                if user['role'] != 'manager' and int(worker_id) != user['id']:
                    return err('Нет доступа', 403)
                cur.execute("""
                    INSERT INTO timesheet (worker_id, object_id, work_date, status, note, created_by)
                    VALUES (%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (worker_id, work_date)
                    DO UPDATE SET status=EXCLUDED.status, note=EXCLUDED.note, updated_at=NOW()
                    RETURNING *
                """, (worker_id, body.get('object_id') or None, body.get('work_date'), body.get('status','work'), body.get('note'), user['id']))
                row = cur.fetchone(); conn.commit()
                return ok(to_dict(cur, row))

        # ===== DOCUMENTS =====
        if path.startswith('/documents'):
            parts = path.split('/')
            doc_id = parts[2] if len(parts) > 2 and parts[2].isdigit() else None

            if method == 'GET':
                obj_filter = params.get('object_id') or body.get('object_id')
                q = "SELECT d.*, u.full_name as uploader, o.name as object_name FROM documents d LEFT JOIN users u ON u.id=d.uploaded_by LEFT JOIN objects o ON o.id=d.object_id"
                if user['role'] == 'manager':
                    if obj_filter:
                        cur.execute(q + " WHERE d.object_id=%s ORDER BY d.created_at DESC", (obj_filter,))
                    else:
                        cur.execute(q + " ORDER BY d.created_at DESC")
                else:
                    cur.execute(q + " WHERE o.foreman_id=%s ORDER BY d.created_at DESC", (user['id'],))
                return ok(to_list(cur, cur.fetchall()))

            if method == 'POST':
                cur.execute(
                    "INSERT INTO documents (name, file_url, file_size, file_type, category, object_id, uploaded_by) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('name'), body.get('file_url'), body.get('file_size'), body.get('file_type'), body.get('category'), body.get('object_id') or None, user['id'])
                )
                row = cur.fetchone(); conn.commit()
                return ok(to_dict(cur, row))

            if method == 'DELETE' and doc_id:
                if user['role'] != 'manager':
                    return err('Только управленец', 403)
                cur.execute("DELETE FROM documents WHERE id=%s", (doc_id,))
                conn.commit()
                return ok({'ok': True})

        # ===== PHOTOS =====
        if path.startswith('/photos'):
            if method == 'GET':
                obj_filter = params.get('object_id') or body.get('object_id')
                q = "SELECT p.*, u.full_name as uploader, o.name as object_name FROM photos p LEFT JOIN users u ON u.id=p.uploaded_by LEFT JOIN objects o ON o.id=p.object_id"
                if user['role'] == 'manager':
                    if obj_filter:
                        cur.execute(q + " WHERE p.object_id=%s ORDER BY p.created_at DESC", (obj_filter,))
                    else:
                        cur.execute(q + " ORDER BY p.created_at DESC")
                else:
                    cur.execute(q + " WHERE o.foreman_id=%s ORDER BY p.created_at DESC", (user['id'],))
                return ok(to_list(cur, cur.fetchall()))

            if method == 'POST':
                cur.execute(
                    "INSERT INTO photos (caption, photo_url, stage, object_id, uploaded_by) VALUES (%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('caption'), body.get('photo_url'), body.get('stage'), body.get('object_id') or None, user['id'])
                )
                row = cur.fetchone(); conn.commit()
                return ok(to_dict(cur, row))

        # ===== TEAM =====
        if path.startswith('/team'):
            parts = path.split('/')
            uid = parts[2] if len(parts) > 2 and parts[2].isdigit() else None

            if method == 'GET':
                if user['role'] == 'manager':
                    cur.execute("SELECT id, login, full_name, role, phone, is_active, created_at FROM users ORDER BY role DESC, full_name")
                else:
                    cur.execute("SELECT id, login, full_name, role, phone, is_active, created_at FROM users WHERE is_active=TRUE ORDER BY role DESC, full_name")
                return ok(to_list(cur, cur.fetchall()))

            if method == 'PUT' and uid:
                if user['role'] != 'manager':
                    return err('Только управленец', 403)
                cur.execute(
                    "UPDATE users SET full_name=%s, phone=%s, is_active=%s WHERE id=%s RETURNING id, login, full_name, role, phone, is_active",
                    (body.get('full_name'), body.get('phone'), body.get('is_active', True), uid)
                )
                row = cur.fetchone(); conn.commit()
                return ok(to_dict(cur, row) if row else {})

        # ===== CHAT =====
        if path.startswith('/chat'):
            if method == 'GET':
                cur.execute("""
                    SELECT m.id, m.text, m.created_at, u.full_name, u.role, u.login
                    FROM messages m JOIN users u ON u.id=m.user_id
                    ORDER BY m.created_at DESC LIMIT 100
                """)
                msgs = to_list(cur, cur.fetchall())
                msgs.reverse()
                return ok(msgs)

            if method == 'POST':
                text = body.get('text', '').strip()
                if not text:
                    return err('Пустое сообщение')
                cur.execute(
                    "INSERT INTO messages (user_id, text) VALUES (%s,%s) RETURNING id, text, created_at",
                    (user['id'], text)
                )
                row = cur.fetchone(); conn.commit()
                return ok({'id': row[0], 'text': row[1], 'created_at': row[2].isoformat(), 'full_name': user['full_name'], 'role': user['role'], 'login': user['login']})

        # ===== WORKERS =====
        if path.startswith('/workers'):
            parts = path.split('/')
            wid = parts[2] if len(parts) > 2 and parts[2].isdigit() else None

            if method == 'GET':
                obj_filter = params.get('object_id') or body.get('object_id')
                if obj_filter:
                    cur.execute("""
                        SELECT w.*, o.name as object_name
                        FROM workers w LEFT JOIN objects o ON o.id = w.object_id
                        WHERE w.object_id = %s AND w.is_active = TRUE
                        ORDER BY w.full_name
                    """, (obj_filter,))
                elif user['role'] == 'manager':
                    cur.execute("""
                        SELECT w.*, o.name as object_name
                        FROM workers w LEFT JOIN objects o ON o.id = w.object_id
                        WHERE w.is_active = TRUE
                        ORDER BY w.full_name
                    """)
                else:
                    # Прораб видит рабочих своих объектов
                    cur.execute("""
                        SELECT w.*, o.name as object_name
                        FROM workers w LEFT JOIN objects o ON o.id = w.object_id
                        WHERE w.is_active = TRUE AND o.foreman_id = %s
                        ORDER BY w.full_name
                    """, (user['id'],))
                return ok(to_list(cur, cur.fetchall()))

            if method == 'POST' and not wid:
                full_name = body.get('full_name', '').strip()
                if not full_name:
                    return err('Укажите имя рабочего')
                cur.execute(
                    "INSERT INTO workers (full_name, specialty, phone, object_id, created_by) VALUES (%s,%s,%s,%s,%s) RETURNING *",
                    (full_name, body.get('specialty'), body.get('phone'), body.get('object_id') or None, user['id'])
                )
                row = cur.fetchone(); conn.commit()
                result = to_dict(cur, row)
                # Сразу добавляем запись в табель на сегодня если назначен на объект
                if result.get('object_id'):
                    from datetime import date
                    today = date.today().isoformat()
                    cur.execute("""
                        INSERT INTO worker_timesheet (worker_id, object_id, work_date, status, created_by)
                        VALUES (%s,%s,%s,'work',%s)
                        ON CONFLICT (worker_id, work_date) DO NOTHING
                    """, (result['id'], result['object_id'], today, user['id']))
                    conn.commit()
                return ok(result)

            if method == 'PUT' and wid:
                cur.execute(
                    "UPDATE workers SET full_name=%s, specialty=%s, phone=%s, object_id=%s, is_active=%s WHERE id=%s RETURNING *",
                    (body.get('full_name'), body.get('specialty'), body.get('phone'), body.get('object_id') or None, body.get('is_active', True), wid)
                )
                row = cur.fetchone(); conn.commit()
                return ok(to_dict(cur, row) if row else {})

            if method == 'DELETE' and wid:
                cur.execute("UPDATE workers SET is_active=FALSE WHERE id=%s", (wid,))
                conn.commit()
                return ok({'ok': True})

        # ===== WORKER TIMESHEET =====
        if path.startswith('/worker-timesheet'):
            month = params.get('month') or body.get('month') or datetime.now().strftime('%Y-%m')
            obj_filter = params.get('object_id') or body.get('object_id')

            if method == 'GET':
                if obj_filter:
                    cur.execute("""
                        SELECT wt.*, w.full_name, w.specialty
                        FROM worker_timesheet wt
                        JOIN workers w ON w.id = wt.worker_id
                        WHERE to_char(wt.work_date,'YYYY-MM') = %s AND wt.object_id = %s AND w.is_active = TRUE
                        ORDER BY w.full_name, wt.work_date
                    """, (month, obj_filter))
                elif user['role'] == 'manager':
                    cur.execute("""
                        SELECT wt.*, w.full_name, w.specialty
                        FROM worker_timesheet wt
                        JOIN workers w ON w.id = wt.worker_id
                        WHERE to_char(wt.work_date,'YYYY-MM') = %s AND w.is_active = TRUE
                        ORDER BY w.full_name, wt.work_date
                    """, (month,))
                else:
                    cur.execute("""
                        SELECT wt.*, w.full_name, w.specialty
                        FROM worker_timesheet wt
                        JOIN workers w ON w.id = wt.worker_id
                        JOIN objects o ON o.id = wt.object_id
                        WHERE to_char(wt.work_date,'YYYY-MM') = %s AND o.foreman_id = %s AND w.is_active = TRUE
                        ORDER BY w.full_name, wt.work_date
                    """, (month, user['id']))
                return ok(to_list(cur, cur.fetchall()))

            if method == 'POST':
                cur.execute("""
                    INSERT INTO worker_timesheet (worker_id, object_id, work_date, status, note, created_by)
                    VALUES (%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (worker_id, work_date)
                    DO UPDATE SET status=EXCLUDED.status, note=EXCLUDED.note, object_id=EXCLUDED.object_id, updated_at=NOW()
                    RETURNING *
                """, (body.get('worker_id'), body.get('object_id') or None, body.get('work_date'), body.get('status', 'work'), body.get('note'), user['id']))
                row = cur.fetchone(); conn.commit()
                return ok(to_dict(cur, row))

        # ===== STATS (обновлённый с рабочими) =====
        if path.startswith('/stats'):
            cur.execute("SELECT COUNT(*) FROM objects WHERE status='active'")
            active_obj = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE role='foreman' AND is_active=TRUE")
            foremans = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM worker_timesheet WHERE work_date = CURRENT_DATE AND status='work'")
            on_site = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM workers WHERE is_active=TRUE")
            workers_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM documents")
            docs_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM photos")
            photos_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM messages")
            msgs_count = cur.fetchone()[0]

            if user['role'] == 'manager':
                cur.execute("SELECT o.id, o.name, o.progress, o.status, o.budget, u.full_name as foreman_name FROM objects o LEFT JOIN users u ON u.id=o.foreman_id ORDER BY o.created_at DESC")
            else:
                cur.execute("SELECT o.id, o.name, o.progress, o.status, o.budget, u.full_name as foreman_name FROM objects o LEFT JOIN users u ON u.id=o.foreman_id WHERE o.foreman_id=%s ORDER BY o.created_at DESC", (user['id'],))
            objects_list = to_list(cur, cur.fetchall())

            return ok({
                'active_objects': active_obj,
                'foremans': foremans,
                'on_site_today': on_site,
                'workers': workers_count,
                'documents': docs_count,
                'photos': photos_count,
                'messages': msgs_count,
                'objects': objects_list,
            })

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()