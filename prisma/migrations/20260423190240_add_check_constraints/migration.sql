ALTER TABLE leases 
  ADD CONSTRAINT chk_billing_day 
  CHECK (billing_day BETWEEN 1 AND 28);

ALTER TABLE rent_invoices 
  ADD CONSTRAINT chk_paid_not_exceeds_total 
  CHECK (paid_amount >= 0 AND paid_amount <= total_amount);

ALTER TABLE payments 
  ADD CONSTRAINT chk_payment_positive 
  CHECK (amount > 0);

ALTER TABLE units 
  ADD CONSTRAINT chk_unit_rent_positive 
  CHECK (rent_amount > 0);

ALTER TABLE leases 
  ADD CONSTRAINT chk_lease_rent_positive 
  CHECK (monthly_rent > 0);

ALTER TABLE rent_invoices 
  ADD CONSTRAINT chk_period_ordering 
  CHECK (billing_period_end > billing_period_start);

ALTER TABLE leases 
  ADD CONSTRAINT chk_lease_date_ordering 
  CHECK (end_date IS NULL OR end_date > start_date);