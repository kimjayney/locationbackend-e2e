
CREATE TABLE Devices(
    id VARCHAR(40) PRIMARY KEY,
    is_enabled BOOLEAN,
    authorization VARCHAR(15),
    created_at DATETIME,
    expired_at DATETIME,
    share_location INTEGER DEFAULT 0,
    shareControlKey VARCHAR(100),
    os VARCHAR(10),
    setAllowNoti INTEGER DEFAULT 0,
    notificationControlKey VARCHAR(100),
    notiToken VARCHAR(400)
);

CREATE TABLE DeviceRelationNoti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  DeviceId VARCHAR(40) NOT NULL,
  toDeviceId VARCHAR(40),
  created_at DATETIME,
  FOREIGN KEY (DeviceId) REFERENCES Devices(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (toDeviceId) REFERENCES Devices(id) ON DELETE CASCADE ON UPDATE CASCADE
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

alter table Devices ADD column ip_collect boolean;
alter table Devices ADD column last_updated DATETIME;