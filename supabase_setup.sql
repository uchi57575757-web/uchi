-- UCHI OFFICIAL — Supabase 셋업 (표 생성 + 접근 권한)
-- 사용법: Supabase → SQL Editor → 아래 전체 붙여넣기 → Run. 여러 번 다시 실행해도 안전합니다.
--
-- 실행 순서
--   1) Authentication → Users → Add user 로 관리자 계정을 먼저 만듭니다 (Auto Confirm User 켜기)
--   2) 이 파일을 실행합니다
--   순서를 반대로 하면 쓰기 권한이 authenticated 로 잠겨 본인도 관리자에서 저장할 수 없습니다.
--
-- 권한
--   읽기           : 누구나
--   등록·수정·삭제 : 로그인한 관리자만
--   inquiries      : 전송은 누구나, 열람은 관리자만
--
-- 이미지는 링크 방식이라 Storage(버킷) 없이 동작합니다.


-- 프로필 (id = 1 한 줄에 JSON 으로 저장)
CREATE TABLE IF NOT EXISTS profile (
  id         BIGINT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_all"    ON profile;
DROP POLICY IF EXISTS "profile_read"   ON profile;
DROP POLICY IF EXISTS "profile_insert" ON profile;
DROP POLICY IF EXISTS "profile_update" ON profile;
DROP POLICY IF EXISTS "profile_delete" ON profile;
CREATE POLICY "profile_read"   ON profile FOR SELECT USING (true);
CREATE POLICY "profile_insert" ON profile FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profile_update" ON profile FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "profile_delete" ON profile FOR DELETE TO authenticated USING (true);


-- 공지
CREATE TABLE IF NOT EXISTS notice (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT,
  pinned     BOOLEAN DEFAULT FALSE,
  image_url  TEXT,
  images     JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notice ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE notice ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE notice ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notice_all"    ON notice;
DROP POLICY IF EXISTS "notice_read"   ON notice;
DROP POLICY IF EXISTS "notice_insert" ON notice;
DROP POLICY IF EXISTS "notice_update" ON notice;
DROP POLICY IF EXISTS "notice_delete" ON notice;
CREATE POLICY "notice_read"   ON notice FOR SELECT USING (true);
CREATE POLICY "notice_insert" ON notice FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notice_update" ON notice FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "notice_delete" ON notice FOR DELETE TO authenticated USING (true);


-- 업보: 시청자
CREATE TABLE IF NOT EXISTS viewers (
  id         BIGSERIAL PRIMARY KEY,
  nickname   TEXT NOT NULL,
  soop_id    TEXT,
  memo       TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE viewers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "viewers_all"    ON viewers;
DROP POLICY IF EXISTS "viewers_read"   ON viewers;
DROP POLICY IF EXISTS "viewers_insert" ON viewers;
DROP POLICY IF EXISTS "viewers_update" ON viewers;
DROP POLICY IF EXISTS "viewers_delete" ON viewers;
CREATE POLICY "viewers_read"   ON viewers FOR SELECT USING (true);
CREATE POLICY "viewers_insert" ON viewers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "viewers_update" ON viewers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "viewers_delete" ON viewers FOR DELETE TO authenticated USING (true);


-- 업보: 종류
CREATE TABLE IF NOT EXISTS upbo_types (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT DEFAULT '일반',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE upbo_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upbo_types_all"    ON upbo_types;
DROP POLICY IF EXISTS "upbo_types_read"   ON upbo_types;
DROP POLICY IF EXISTS "upbo_types_insert" ON upbo_types;
DROP POLICY IF EXISTS "upbo_types_update" ON upbo_types;
DROP POLICY IF EXISTS "upbo_types_delete" ON upbo_types;
CREATE POLICY "upbo_types_read"   ON upbo_types FOR SELECT USING (true);
CREATE POLICY "upbo_types_insert" ON upbo_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upbo_types_update" ON upbo_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "upbo_types_delete" ON upbo_types FOR DELETE TO authenticated USING (true);


-- 업보: 횟수 (시청자 × 종류)
CREATE TABLE IF NOT EXISTS upbo_counts (
  id         BIGSERIAL PRIMARY KEY,
  viewer_id  BIGINT NOT NULL,
  type_id    BIGINT NOT NULL,
  count      INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (viewer_id, type_id)
);
ALTER TABLE upbo_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upbo_counts_all"    ON upbo_counts;
DROP POLICY IF EXISTS "upbo_counts_read"   ON upbo_counts;
DROP POLICY IF EXISTS "upbo_counts_insert" ON upbo_counts;
DROP POLICY IF EXISTS "upbo_counts_update" ON upbo_counts;
DROP POLICY IF EXISTS "upbo_counts_delete" ON upbo_counts;
CREATE POLICY "upbo_counts_read"   ON upbo_counts FOR SELECT USING (true);
CREATE POLICY "upbo_counts_insert" ON upbo_counts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upbo_counts_update" ON upbo_counts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "upbo_counts_delete" ON upbo_counts FOR DELETE TO authenticated USING (true);


-- 옷장 (이미지는 image_url 링크)
CREATE TABLE IF NOT EXISTS public.dress_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL DEFAULT 'hair',   -- 세 곳이 같은 값: 옷장 페이지 CATS, admin select#dr-cat, admin DRESS_CATS
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  badges      JSONB DEFAULT '[]',             -- 새 옷이면 [{"label":"NEW"}]
  is_event    BOOLEAN DEFAULT FALSE,
  glow_color  TEXT DEFAULT '',
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dress_items_category ON public.dress_items(category);
ALTER TABLE public.dress_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dress_all"          ON public.dress_items;
DROP POLICY IF EXISTS "dress_items_read"   ON public.dress_items;
DROP POLICY IF EXISTS "dress_items_insert" ON public.dress_items;
DROP POLICY IF EXISTS "dress_items_update" ON public.dress_items;
DROP POLICY IF EXISTS "dress_items_delete" ON public.dress_items;
CREATE POLICY "dress_items_read"   ON public.dress_items FOR SELECT USING (true);
CREATE POLICY "dress_items_insert" ON public.dress_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dress_items_update" ON public.dress_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dress_items_delete" ON public.dress_items FOR DELETE TO authenticated USING (true);


-- 다시보기 (SOOP VOD)
CREATE TABLE IF NOT EXISTS original_songs (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  vod_id     TEXT,
  thumbnail  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE original_songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "original_songs_all"    ON original_songs;
DROP POLICY IF EXISTS "original_songs_read"   ON original_songs;
DROP POLICY IF EXISTS "original_songs_insert" ON original_songs;
DROP POLICY IF EXISTS "original_songs_update" ON original_songs;
DROP POLICY IF EXISTS "original_songs_delete" ON original_songs;
CREATE POLICY "original_songs_read"   ON original_songs FOR SELECT USING (true);
CREATE POLICY "original_songs_insert" ON original_songs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "original_songs_update" ON original_songs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "original_songs_delete" ON original_songs FOR DELETE TO authenticated USING (true);


-- 문의함 (전송은 누구나, 열람은 관리자만)
CREATE TABLE IF NOT EXISTS inquiries (
  id         BIGSERIAL PRIMARY KEY,
  nickname   TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inquiries_all"         ON inquiries;
DROP POLICY IF EXISTS "inquiries_read"        ON inquiries;
DROP POLICY IF EXISTS "inquiries_anon_insert" ON inquiries;
DROP POLICY IF EXISTS "inquiries_insert"      ON inquiries;
DROP POLICY IF EXISTS "inquiries_update"      ON inquiries;
DROP POLICY IF EXISTS "inquiries_delete"      ON inquiries;
CREATE POLICY "inquiries_read"        ON inquiries FOR SELECT TO authenticated USING (true);
CREATE POLICY "inquiries_anon_insert" ON inquiries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "inquiries_insert"      ON inquiries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inquiries_update"      ON inquiries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inquiries_delete"      ON inquiries FOR DELETE TO authenticated USING (true);


-- 프로필 기본 행 보장
-- 이 Supabase 프로젝트는 우치 한 사람에게만 씁니다. 다른 사람 데이터가 남아 있는 프로젝트를
-- 재사용하면 아래 INSERT 가 DO NOTHING 때문에 옛 데이터를 덮어쓰지 않습니다.
-- 그럴 때만 아래 줄의 맨 앞 -- 를 지우고 한 번 실행하세요.
-- DELETE FROM profile WHERE id = 1;
INSERT INTO profile (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
