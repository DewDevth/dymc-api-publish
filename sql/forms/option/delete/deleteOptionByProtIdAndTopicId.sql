DELETE FROM KPDBA.DYMCHK_PROT_OPTION
WHERE
  PROT_ID = :S_PROT_ID AND
  TOPIC_ID = :S_TOPIC_ID
