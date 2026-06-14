
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'foreman')),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE objects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','paused','done')),
  tag VARCHAR(100),
  progress INTEGER DEFAULT 0,
  deadline DATE,
  budget NUMERIC(15,2),
  foreman_id INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE timesheet (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER NOT NULL REFERENCES users(id),
  object_id INTEGER REFERENCES objects(id),
  work_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'work' CHECK (status IN ('work','off','sick','vacation','absent')),
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(worker_id, work_date)
);

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  file_url TEXT,
  file_size VARCHAR(50),
  file_type VARCHAR(20),
  category VARCHAR(100),
  object_id INTEGER REFERENCES objects(id),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  caption VARCHAR(500),
  photo_url TEXT NOT NULL,
  stage VARCHAR(100),
  object_id INTEGER REFERENCES objects(id),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed users: MASALOV (manager), Panteelev (foreman), Teh (foreman)
-- passwords: MASALOV1, panteleev1, Teh228
INSERT INTO users (login, password_hash, full_name, role) VALUES
  ('MASALOV',   'MASALOV1',   'Масалов (Управленец)', 'manager'),
  ('Panteelev', 'panteleev1', 'Пантелеев (Прораб)',   'foreman'),
  ('Teh',       'Teh228',     'Тех (Прораб)',         'foreman');
