-- Run in the Supabase SQL editor after enabling private Realtime channels.
-- The trusted incident-change channel is receive-only for browser clients;
-- only the backend's server-side Supabase key should publish to it.
create policy "Authenticated operators receive incident change events"
on realtime.messages
for select
to authenticated
using (realtime.topic() = 'workspace:incident-changes');

-- Operators can share presence and ephemeral typing events in the workspace
-- and incident rooms. Do not include note text, access tokens, or private data
-- in these payloads. Extend this policy if workspace/tenant scoping is added.
create policy "Authenticated operators use collaboration channels"
on realtime.messages
for all
to authenticated
using (
  realtime.topic() = 'workspace:ops'
  or realtime.topic() like 'incident:%'
)
with check (
  realtime.topic() = 'workspace:ops'
  or realtime.topic() like 'incident:%'
);
