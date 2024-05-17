SELECT
    *
FROM
    KPDBA.DYMCHK_PROT
WHERE
    REPLACE(REPLACE(iso_doc_code, '/', ''), '-', '') = REPLACE(REPLACE(:S_ISO_DOC_CODE, '/', ''), '-', '')
    AND iso_doc_revision = :S_ISO_DOC_REVISION
    AND cancel_flag = 'F'