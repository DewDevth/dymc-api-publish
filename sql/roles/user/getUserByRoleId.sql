SELECT ur.org_id,ur.user_id, ur.role_no,em.emp_id, em.TITLE_NAME || ' ' || em.EMP_FNAME  || ' ' || em.EMP_LNAME as USERNAME, pt.pos_desc
,em.UNIT_ID
FROM 
KPDBA.DYMCHK_USERS_ROLES  ur
LEFT JOIN KPDBA.EMPLOYEE  em ON em.emp_id = ur.user_id
LEFT JOIN KPDBA.position pt ON pt.pos_id = em.pos_id
WHERE ROLE_NO = :S_ROLE_NO