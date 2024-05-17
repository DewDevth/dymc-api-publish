SELECT
    DOC_CODE,
    DOC_REVISION,
    DOC_NAME,
    DAR_STATUS
FROM
    ISO_DAR
WHERE
    DOC_CODE = :S_DOC_CODE
    AND DOC_REVISION = :S_DOC_REVISION