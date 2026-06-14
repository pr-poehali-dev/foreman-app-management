import json
import os
import uuid
import base64
import psycopg2
import boto3
from datetime import datetime

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

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

def ok(data):
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    """Загрузка файлов (документы и фото) в S3. Принимает base64 в теле запроса."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    session_id = event.get('headers', {}).get('x-session-id', '')
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user(cur, session_id)
        if not user:
            return err('Необходима авторизация', 401)

        file_data_b64 = body.get('file_data', '')
        file_name = body.get('file_name', 'file')
        file_type = body.get('file_type', 'application/octet-stream')
        upload_type = body.get('upload_type', 'document')  # 'document' или 'photo'
        object_id = body.get('object_id')
        category = body.get('category', 'Прочее')
        caption = body.get('caption', '')
        stage = body.get('stage', 'Прочее')

        if not file_data_b64:
            return err('Файл не передан')

        # Декодируем base64
        if ',' in file_data_b64:
            file_data_b64 = file_data_b64.split(',', 1)[1]
        file_bytes = base64.b64decode(file_data_b64)
        file_size_bytes = len(file_bytes)

        # Форматируем размер
        if file_size_bytes < 1024:
            size_str = f"{file_size_bytes} Б"
        elif file_size_bytes < 1024 * 1024:
            size_str = f"{file_size_bytes // 1024} КБ"
        else:
            size_str = f"{file_size_bytes / (1024*1024):.1f} МБ"

        # Генерируем уникальное имя
        ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else ''
        unique_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
        folder = 'photos' if upload_type == 'photo' else 'documents'
        key = f"{folder}/{unique_name}"

        # Загружаем в S3
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        s3.put_object(
            Bucket='files',
            Key=key,
            Body=file_bytes,
            ContentType=file_type,
        )

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        # Сохраняем в БД
        if upload_type == 'photo':
            cur.execute(
                "INSERT INTO photos (caption, photo_url, stage, object_id, uploaded_by) VALUES (%s,%s,%s,%s,%s) RETURNING id, caption, photo_url, stage, created_at",
                (caption or file_name, cdn_url, stage, object_id or None, user['id'])
            )
            row = cur.fetchone()
            conn.commit()
            return ok({
                'id': row[0], 'caption': row[1], 'photo_url': row[2],
                'stage': row[3], 'created_at': row[4].isoformat(),
                'uploader': user['full_name'], 'object_name': None,
                'cdn_url': cdn_url,
            })
        else:
            file_ext = ext.upper() if ext else 'FILE'
            cur.execute(
                "INSERT INTO documents (name, file_url, file_size, file_type, category, object_id, uploaded_by) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id, name, file_url, file_size, file_type, category, created_at",
                (file_name, cdn_url, size_str, ext or 'file', category, object_id or None, user['id'])
            )
            row = cur.fetchone()
            conn.commit()
            return ok({
                'id': row[0], 'name': row[1], 'file_url': row[2],
                'file_size': row[3], 'file_type': row[4], 'category': row[5],
                'created_at': row[6].isoformat(),
                'uploader': user['full_name'], 'object_name': None,
                'cdn_url': cdn_url, 'file_ext': file_ext,
            })

    finally:
        cur.close()
        conn.close()
