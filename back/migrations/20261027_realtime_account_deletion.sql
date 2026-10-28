-- Apply to an existing PostgreSQL database before deploying the updated API:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20261027_realtime_account_deletion.sql
-- Use a PostgreSQL connection URL (postgresql://, not postgresql+asyncpg://).
-- New databases receive these rules from Base.metadata.create_all().
BEGIN;

-- Preserve existing constraint names, including names assigned by deployments.
DO $$
DECLARE
    fk record;
BEGIN
    FOR fk IN
        SELECT c.conrelid::regclass AS table_name, c.conname, a.attname AS column_name
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f'
          AND c.confrelid = 'users'::regclass
          AND array_length(c.conkey, 1) = 1
          AND (
              (c.conrelid = 'notifications'::regclass AND a.attname IN ('user_id', 'actor_id'))
              OR (c.conrelid = 'conversation_participants'::regclass AND a.attname = 'user_id')
              OR (c.conrelid = 'messages'::regclass AND a.attname = 'sender_id')
              OR (c.conrelid = 'pending_messages'::regclass AND a.attname = 'user_id')
          )
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.table_name, fk.conname);
        EXECUTE format(
            'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES users(id) ON DELETE CASCADE',
            fk.table_name, fk.conname, fk.column_name
        );
    END LOOP;
END $$;

COMMIT;
