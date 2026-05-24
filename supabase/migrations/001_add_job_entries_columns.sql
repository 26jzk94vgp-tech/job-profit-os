-- 2026-05-24: 给 job_entries 加报价单关联列
ALTER TABLE job_entries ADD COLUMN IF NOT EXISTS item_group text;
ALTER TABLE job_entries ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE job_entries ADD COLUMN IF NOT EXISTS quote_id uuid;
ALTER TABLE job_entries ADD COLUMN IF NOT EXISTS quote_index integer;
