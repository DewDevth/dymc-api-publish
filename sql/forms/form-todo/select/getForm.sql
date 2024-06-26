SELECT
    DF.PROT_ID,
    DF.FORM_ID,
    DF.URL,
    DF.START_DATE,
    DF.END_DATE,
    DF.REQ_USER_FLAG,
    DP.FORM_CODE,
    DP.FORM_DESC,
    DP.FORM_REVISION,
    DP.FORM_TITLE,
    DP.ISO_DOC_CODE,
    DP.ISO_DOC_REVISION,
    DF.CR_DATE,
    DF.CR_UID,
    DF.CANCEL_FLAG,
    DF.CANCEL_DATE,
    DF.CANCEL_UID,
    DF.CANCEL_OID
FROM
    KPDBA.DYMCHK_FORM DF
    LEFT JOIN KPDBA.DYMCHK_PROT DP ON DF.PROT_ID = DP.PROT_ID
    WHERE
    DF.PROT_ID = :S_PROT_ID
    AND DF.CANCEL_FLAG <> 'P'