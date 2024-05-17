select DOC_CODE,DOC_REVISION
from iso_master
where regexp_replace(DOC_CODE, '-|/|:|;','') = :doc_code and DOC_REVISION = :DOC_REVISION