CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  babyName TEXT NOT NULL,
  fatherName TEXT NOT NULL,
  motherName TEXT NOT NULL,
  invitationTitle TEXT NOT NULL,
  greeting TEXT NOT NULL,
  eventDate TEXT NOT NULL,
  eventTime TEXT NOT NULL,
  venueName TEXT NOT NULL,
  venueAddress TEXT NOT NULL,
  parkingInfo TEXT NOT NULL,
  heroImageUrl TEXT,
  galleryImageUrls TEXT,
  accountInfo TEXT NOT NULL,
  isPublished INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guestbook_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invitationId INTEGER NOT NULL,
  authorName TEXT NOT NULL,
  companionNames TEXT NOT NULL DEFAULT '[]',
  message TEXT NOT NULL,
  isHidden INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rsvp_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invitationId INTEGER NOT NULL,
  editToken TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  companionNames TEXT NOT NULL DEFAULT '[]',
  attendeeDetails TEXT NOT NULL DEFAULT '[]',
  attendance TEXT NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  meal INTEGER NOT NULL DEFAULT 1,
  contact TEXT,
  note TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Initial seed data
INSERT OR REPLACE INTO invitations (
  id, slug, babyName, fatherName, motherName, invitationTitle, greeting,
  eventDate, eventTime, venueName, venueAddress, parkingInfo,
  heroImageUrl, galleryImageUrls, accountInfo, isPublished
) VALUES (
  1,
  'invite-peach-ribbon-x7k2p',
  '채원',
  '강호성',
  'NGUYEN HONG NGOC',
  '채원의 첫 번째 생일에 소중한 분들을 초대합니다.',
  '저희에게 찾아온 가장 빛나는 선물, 채원이가 어느덧 첫 번째 생일을 맞았습니다. 그동안 보내주신 따뜻한 사랑에 감사드리며, 소중한 분들과 함께 채원이의 첫걸음을 축복하는 자리를 마련했습니다.',
  '2026. 10. 18 SUN',
  '12:00 PM',
  '코트야드 메리어트 서울 명동
3층 한양 1+2홀',
  '서울특별시 중구 남대문로 9',
  '호텔 지하 주차장을 이용하실 수 있습니다. 행사 당일 주차 등록 및 세부 안내는 호텔 데스크에서 확인해 주세요.',
  '{"url":"/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png","kind":"image","mimeType":"image/png","fileName":"chaewon-hotel-hero.png"}',
  '[{"url":"/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png","kind":"image","mimeType":"image/png","fileName":"chaewon-hotel-hero.png"}]',
  '강호성 | 카카오뱅크 3333-19-8058955',
  1
);
