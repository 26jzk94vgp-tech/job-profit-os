drop view if exists job_summary;

create view job_summary as
select
  j.id,
  j.name,
  j.client_name,
  j.status,
  j.owner_id,
  j.created_at,
  coalesce(sum(case when e.type = 'invoice' then e.amount else 0 end), 0) as revenue,
  coalesce(sum(case when e.type = 'labor' then e.hours * e.hourly_rate else 0 end), 0) as labor_cost,
  coalesce(sum(case when e.type = 'material' then e.amount else 0 end), 0) as material_cost,
  coalesce(sum(case when e.type = 'subcontract' then e.amount else 0 end), 0) as subcontract_cost,
  coalesce(sum(case when e.type = 'fuel' then e.amount else 0 end), 0) as fuel_cost,
  coalesce(sum(case when e.type = 'invoice' then e.amount else 0 end), 0)
  - coalesce(sum(case when e.type = 'labor' then e.hours * e.hourly_rate
                      when e.type in ('material','subcontract','fuel') then e.amount
                      else 0 end), 0) as profit,
  min(case when e.type = 'invoice' and e.payment_status != 'paid' then e.payment_due_date else null end) as earliest_due_date,
  coalesce(sum(case when e.type = 'invoice' and e.payment_status != 'paid' then e.amount else 0 end), 0) as unpaid_amount
from jobs j
left join job_entries e on e.job_id = j.id
where j.owner_id = auth.uid()
group by j.id, j.name, j.client_name, j.status, j.owner_id, j.created_at;
