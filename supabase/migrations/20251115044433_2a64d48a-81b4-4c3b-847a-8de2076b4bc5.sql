-- Add auto-assign function for pending reviews
CREATE OR REPLACE FUNCTION auto_assign_pending_reviews()
RETURNS jsonb AS $$
DECLARE
  v_pending_reviews UUID[];
  v_reviewers UUID[];
  v_reviewer_index INTEGER := 0;
  v_assigned_count INTEGER := 0;
  v_current_review UUID;
  v_current_reviewer UUID;
BEGIN
  -- Get pending reviews ordered by priority
  SELECT ARRAY_AGG(id ORDER BY 
    CASE priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'normal' THEN 3 
      ELSE 4 
    END, 
    assigned_at ASC
  ) INTO v_pending_reviews
  FROM lesson_reviews
  WHERE status = 'pending' AND reviewer_id IS NULL;
  
  -- Get active reviewers ordered by workload (least reviews assigned)
  SELECT ARRAY_AGG(reviewer_id ORDER BY total_reviews ASC)
  INTO v_reviewers
  FROM reviewer_performance
  WHERE total_reviews < 20; -- Cap at 20 active reviews per reviewer
  
  -- If no reviewers available, return error
  IF v_reviewers IS NULL OR array_length(v_reviewers, 1) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No reviewers available',
      'assigned_count', 0
    );
  END IF;
  
  -- Round-robin assignment
  FOREACH v_current_review IN ARRAY v_pending_reviews LOOP
    v_current_reviewer := v_reviewers[(v_reviewer_index % array_length(v_reviewers, 1)) + 1];
    
    UPDATE lesson_reviews
    SET reviewer_id = v_current_reviewer,
        auto_assigned_at = NOW(),
        status = 'in_review'
    WHERE id = v_current_review;
    
    v_assigned_count := v_assigned_count + 1;
    v_reviewer_index := v_reviewer_index + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reviews assigned successfully',
    'assigned_count', v_assigned_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;