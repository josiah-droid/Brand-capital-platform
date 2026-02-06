-- Migration: Add phase column to tasks for grouping
-- This supports the Deal -> Phase -> Task hierarchy

ALTER TABLE tasks ADD COLUMN phase text DEFAULT 'General';

-- Define standard agency phases as a comment for reference
-- Standard phases: Strategy, Creative, Production, Revisions, Admin

-- Add index for phase filtering
CREATE INDEX idx_tasks_phase ON tasks(phase);

-- Update existing tasks to have a default phase
UPDATE tasks SET phase = 'General' WHERE phase IS NULL;

COMMENT ON COLUMN tasks.phase IS 'Work phase grouping: Strategy, Creative, Production, Revisions, Admin, or custom';
