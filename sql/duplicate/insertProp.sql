INSERT INTO
    KPDBA.DYMCHK_PROT_PROP (
        PROT_ID,
        TOPIC_ID,
        PROP_ID,
        PROP_TYPE,
        PROP_VALUE,
        PROP_LIST,
        PROP_NO,
        CR_DATE,
        CR_UID,
        CR_OID,
        CANCEL_FLAG
    )
VALUES
    (
        :S_PROT_ID,
        :S_TOPIC_ID,
        :S_PROP_ID,
        :S_PROP_TYPE,
        :S_PROP_VALUE,
        :S_PROP_LIST,
        :S_PROP_NO,
        :S_CR_DATE,
        :S_CR_UID,
        :S_CR_OID,
        'F'
    )