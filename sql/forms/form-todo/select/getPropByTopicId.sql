SELECT
    PROT_ID,
    TOPIC_ID,
    PROP_ID,
    PROP_TYPE,
    PROP_VALUE,
    PROP_LIST,
    PROP_NO
FROM
    KPDBA.DYMCHK_PROT_PROP
WHERE
    PROT_ID = :S_PROT_ID
    AND TOPIC_ID = :S_TOPIC_ID