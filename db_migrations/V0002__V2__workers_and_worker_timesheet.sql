CREATE TABLE workers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  phone VARCHAR(50),
  object_id INTEGER REFERENCES objects(id),
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE worker_timesheet (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER NOT NULL REFERENCES workers(id),
  object_id INTEGER REFERENCES objects(id),
  work_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'work' CHECK (status IN ('work','off','sick','vacation','absent')),
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(worker_id, work_date)
);
