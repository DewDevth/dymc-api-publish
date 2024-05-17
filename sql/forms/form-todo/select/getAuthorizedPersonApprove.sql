SELECT DU.FORM_ID, DF.PROT_ID, DU.USER_ID, EM.UNIT_ID, DT.TOPIC_NO, DP.PROP_VALUE AS FORM_ROLE_NO, RL.USER_ID AS APPV_USER_ID,DT.TOPIC_ID
FROM KPDBA.DYMCHK_FORM_USER DU
JOIN KPDBA.DYMCHK_FORM DF ON DU.FORM_ID = DF.FORM_ID 
JOIN KPDBA.DYMCHK_PROT_TOPIC DT ON DF.PROT_ID = DT.PROT_ID
JOIN KPDBA.DYMCHK_PROT_PROP DP ON DT.PROT_ID = DP.PROT_ID AND DT.TOPIC_ID = DP.TOPIC_ID
--join new_table on form_id + seq + topic_id
JOIN KPDBA.DYMCHK_FORM_APPROVAL DFA ON DF.FORM_ID  = DFA.FORM_ID AND DU.SEQ = DFA.SEQ  AND  DP.TOPIC_ID = DFA.TOPIC_ID 
LEFT JOIN KPDBA.EMPLOYEE EM ON DU.USER_ID = EM.EMP_ID
JOIN (
    SELECT RL.ROLE_NO, RU.UNIT_ID, RU.USER_ID 
    FROM KPDBA.DYMCHK_ROLES RL
    JOIN KPDBA.DYMCHK_ROLES_USERS RU ON RL.ROLE_NO = RU.ROLE_NO 
    UNION ALL
    SELECT RL.ROLE_NO, 'NONE' AS UNIT_ID, RU.USER_ID 
    FROM KPDBA.DYMCHK_ROLES RL
    JOIN KPDBA.DYMCHK_USERS_ROLES RU ON RL.ROLE_NO = RU.ROLE_NO 
) RL ON DP.PROP_VALUE = RL.ROLE_NO AND NVL(EM.UNIT_ID, 'NONE') = RL.UNIT_ID
WHERE DT.TOPIC_TYPE = 'ApprovalField' AND DP.PROP_TYPE = 'roleIdText'
--and du.form_id = 'DYD67026526' and  dt.topic_id = 'aa9939da-84eb-4'
AND RL.USER_ID = :S_USER_ID