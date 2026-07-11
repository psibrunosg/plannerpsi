-- Proposal decisions are RPC-only. The sender remains task owner and the
-- recipient becomes assignee, preserving visibility for both participants.
drop policy if exists "Recipients decide pending proposals" on public.task_proposals;
revoke update on public.task_proposals from anon, authenticated;

create or replace function public.respond_to_task_proposal(p_proposal_id uuid, p_decision text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare proposal public.task_proposals; created_task public.tasks;
current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if (select auth.uid()) is null or p_decision not in ('accepted','rejected') then raise exception 'invalid proposal response'; end if;
  select * into proposal from public.task_proposals where id=p_proposal_id and lower(receiver_email)=current_email for update;
  if not found then raise exception 'proposal not found or not permitted'; end if;
  if proposal.status='accepted' and proposal.accepted_task_id is not null then
    select * into created_task from public.tasks where id=proposal.accepted_task_id;
    return jsonb_build_object('proposal',to_jsonb(proposal),'task',to_jsonb(created_task));
  end if;
  if proposal.status <> 'pending' then raise exception 'proposal was already decided'; end if;
  if p_decision='rejected' then
    update public.task_proposals set status='rejected',decided_at=now(),decided_by=auth.uid() where id=proposal.id returning * into proposal;
    return jsonb_build_object('proposal',to_jsonb(proposal),'task',null);
  end if;
  insert into public.tasks (title,description,status,priority,tags,user_id,assignee_id,kanban_column,completion_percentage,created_at,updated_at)
  values (proposal.title,proposal.description,'todo','p3',jsonb_build_array('proposta'),proposal.sender_id,auth.uid(),'todo',0,now(),now()) returning * into created_task;
  update public.task_proposals set status='accepted',accepted_task_id=created_task.id,decided_at=now(),decided_by=auth.uid() where id=proposal.id returning * into proposal;
  return jsonb_build_object('proposal',to_jsonb(proposal),'task',to_jsonb(created_task));
end; $$;

revoke all on function public.respond_to_task_proposal(uuid,text) from public, anon;
grant execute on function public.respond_to_task_proposal(uuid,text) to authenticated;
