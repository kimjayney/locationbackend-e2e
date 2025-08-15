
CREATE TABLE Devices(
    id VARCHAR(40) PRIMARY KEY,
    is_enabled BOOLEAN,
    authorization VARCHAR(15),
    created_at DATETIME,
    expired_at DATETIME,
    share_location INTEGER DEFAULT 0,
    shareControlKey VARCHAR(100)
);

CREATE TABLE AuditLogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  created_at TEXT NOT NULL,
  device_id INTEGER, 
  device_id_v2 TEXT
);

CREATE TABLE Locations (
    id integer PRIMARY KEY AUTOINCREMENT, 
    DeviceId VARCHAR(40), 
    lat TEXT, 
    lng TEXT , 
    IV TEXT, 
    created_at DATETIME,
    ip_addr VARCHAR(100),
    FOREIGN KEY (DeviceId) REFERENCES Devices(id) ON DELETE CASCADE ON UPDATE CASCADE ON INSERT RESTRICT
);
