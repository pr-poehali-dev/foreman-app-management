import json
import os
import uuid
import psycopg2
from datetime import datetime, timedelta

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Api-Path',
}

def get_conn():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={schema}')
    return conn

def get_header(event, name):
    """Регистронезависимое чтение заголовка (прокси меняет регистр)."""
    headers = event.get('headers', {}) or {}
    name_lower = name.lower()
    for k, v in headers.items():
        if k.lower() == name_lower:
            return v
    return ''

def handler(event: dict, context) -> dict:
    """Auth: login, logout, me, register foreman. Маршрутизация по __action в body или path."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    params = event.get('queryStringParameters') or {}
    session_id = (
        get_header(event, 'X-Session-Id')
        or body.get('__session_id', '')
        or params.get('__session_id', '')
    )
    action = body.get('__action', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET → /me
        if method == 'GET':
            if not session_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Нет сессии'})}
            cur.execute(
                "SELECT u.id, u.login, u.full_name, u.role, u.phone FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW()",
                (session_id,)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}
            user = {'id': row[0], 'login': row[1], 'full_name': row[2], 'role': row[3], 'phone': row[4]}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        if method == 'POST':
            # logout
            if action == 'logout':
                if session_id:
                    cur.execute("DELETE FROM sessions WHERE id = %s", (session_id,))
                    conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

            # register foreman
            if action == 'register':
                if not session_id:
                    return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Нет сессии'})}
                cur.execute(
                    "SELECT u.id, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW()",
                    (session_id,)
                )
                row = cur.fetchone()
                if not row or row[1] != 'manager':
                    return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Только управленец может добавлять прорабов'})}
                manager_id = row[0]
                login = body.get('login', '').strip()
                password = body.get('password', '').strip()
                full_name = body.get('full_name', '').strip()
                phone = body.get('phone', '').strip()
                if not login or not password or not full_name:
                    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
                cur.execute("SELECT id FROM users WHERE login = %s", (login,))
                if cur.fetchone():
                    return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Такой логин уже существует'})}
                cur.execute(
                    "INSERT INTO users (login, password_hash, full_name, role, phone, created_by) VALUES (%s, %s, %s, 'foreman', %s, %s) RETURNING id",
                    (login, password, full_name, phone or None, manager_id)
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'id': new_id, 'login': login, 'full_name': full_name})}

            # login (default POST)
            login_val = body.get('login', '').strip()
            password_val = body.get('password', '').strip()
            if not login_val:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите логин'})}
            cur.execute(
                "SELECT id, login, full_name, role, phone FROM users WHERE login = %s AND password_hash = %s AND is_active = TRUE",
                (login_val, password_val)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}
            user = {'id': row[0], 'login': row[1], 'full_name': row[2], 'role': row[3], 'phone': row[4]}
            sid = str(uuid.uuid4())
            expires = datetime.now() + timedelta(days=30)
            cur.execute(
                "INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)",
                (sid, user['id'], expires)
            )
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'session_id': sid, 'user': user})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()