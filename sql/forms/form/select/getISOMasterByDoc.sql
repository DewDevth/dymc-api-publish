SELECT
    DOC_CODE,
    DOC_REVISION,
    DOC_NAME,
    DYMC_FLAG
FROM
    ISO_MASTER
WHERE
    DOC_CODE = :S_DOC_CODE
    AND DOC_REVISION = :S_DOC_REVISION