SELECT PROP_ID 
FROM KPDBA.DYMCHK_PROT_PROP
WHERE PROT_ID = :S_PROT_ID 
  AND TOPIC_ID = :S_TOPIC_ID 
  AND PROP_TYPE = :S_PROP_TYPE
  AND ROWNUM <= 1