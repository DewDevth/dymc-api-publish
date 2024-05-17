INSERT INTO
    KPDBA.DYMCHK_PROT_OPTION (
        PROT_ID,
        TOPIC_ID,
        PROP_ID,
        OPTION_ID,
        OPTION_DES,
        OPTION_NO,
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
        :S_OPTION_ID,
        :S_OPTION_DES,
        :S_OPTION_NO,
        :S_CR_DATE,
        :S_CR_UID,
        :S_CR_OID,
        'F'
    )