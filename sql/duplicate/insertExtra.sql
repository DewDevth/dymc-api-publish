INSERT INTO
    KPDBA.DYMCHK_PROT_EXTRA (
        PROT_ID,
        TOPIC_ID,
        PROP_ID,
        EXTRA_ID,
        EXTRA_TYPE,
        EXTRA_DESC,
        EXTRA_NO,
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
        :S_EXTRA_ID,
        :S_EXTRA_TYPE,
        :S_EXTRA_DESC,
        :S_EXTRA_NO,
        :S_CR_DATE,
        :S_CR_UID,
        :S_CR_OID,
        'F'
    )