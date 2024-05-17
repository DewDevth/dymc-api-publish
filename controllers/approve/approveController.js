const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");
const {
  genUid15Digit,
  genUid11Digit,
  generateProtId,
} = require("../../utils/genId");

// create new revision
const CreateNewRevision = async (req, res) => {
  try {
    const { protId, userId, OID } = req.body;

    if (!protId || !userId || !OID)
      return res.status(400).json({ message: "Missing required fields." });

    const genFormId = await generateProtId();
    const dateNow = new Date();
    const connection = await connectToDatabase();

    // get prot by protId
    const dataProt = await GetProtById(protId, userId);
    // get topic by prot id
    const dataTopics = await getTopicByProtId(protId);
    const dataProps = await getPropByProtId(protId);
    const dataOptions = await getOptionByProtId(protId);
    const dataExtras = await getExtraByProtId(protId);

    if (!dataProt)
      return res.status(400).json({ message: "Prot data not found" });
    // console.log(dataProt)
    // create and copy prot data
    const formTitle = dataProt.FORM_TITLE;
    const formDescription = dataProt.FORM_DESC;
    const FORM_CODE = dataProt.FORM_CODE;
    const FORM_REVISION = dataProt.FORM_REVISION;
    const ISO_DOC_CODE = dataProt.ISO_DOC_CODE;
    const ISO_DOC_REVISION = dataProt.ISO_DOC_REVISION;
    // status Draft
    const approveFlag = "W";

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveForm.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // console.log(genFormId)
    // console.log(FORM_CODE)
    // console.log(FORM_REVISION)
    // console.log(formTitle)
    // console.log(formDescription)
    // console.log(ISO_DOC_CODE)
    // console.log(ISO_DOC_REVISION)
    // console.log(approveFlag)
    // console.log(dateNow)
    // console.log(userId)
    // console.log(OID)

    const result = await connection.execute(sql, {
      S_PROT_ID: genFormId,
      S_FORM_CODE: FORM_CODE,
      S_FORM_REVISION: FORM_REVISION,
      S_FORM_TITLE: formTitle,
      S_FORM_DESC: formDescription,
      S_ISO_DOC_CODE: ISO_DOC_CODE,
      S_ISO_DOC_REVISION: ISO_DOC_REVISION,
      S_APPV_FLAG: approveFlag,
      S_CR_DATE: dateNow,
      S_CR_UID: userId,
      S_CR_OID: OID,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: OID,
      S_UPDATE_UID: userId,
    });

    await connection.commit();

    //  new prot
    const formateData = {
      id: genFormId,
      userId: userId,
      createdAt: dateNow,
      published: false,
      name: formTitle,
      description: formDescription,
      APPV_FLAG: approveFlag,
      FORM_CODE: FORM_CODE,
      FORM_REVISION: FORM_REVISION,
      ISO_DOC_CODE: ISO_DOC_CODE,
      ISO_DOC_REVISION: ISO_DOC_REVISION,
      CANCEL_FLAG: dataProt.CANCEL_FLAG,
      CODE_REV: (FORM_CODE
        ? `${FORM_CODE}/${FORM_REVISION}`
        : ISO_DOC_CODE
        ? `${ISO_DOC_CODE}/${ISO_DOC_REVISION}`
        : ""
      ).trim(),
    };
    if (dataTopics.length > 0) {
      await CreateNewTopic(
        genFormId,
        userId,
        OID,
        dateNow,
        dataTopics,
        dataProps,
        dataOptions,
        dataExtras
      );
      // console.log("dataTopics=", dataTopics.length)
    }
    // console.log("dataTopics=",dataTopics)
    // console.log("dataProps=",dataProps)
    // console.log("dataOptions=",dataOptions)
    // console.log("dataExtras=",dataExtras)

    // res.status(200).json({ message: "Create New Revision Successfully" });
    res.status(200).json(formateData);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error Create New Revision ");
  }
};

// create 5 table

const CreateNewTopic = async (
  protId,
  userId,
  OID,
  dateNow,
  topics,
  props,
  options,
  extras
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveTopic.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = topics.map(async (item) => {
      // Filter props based on PROT_ID and TOPIC_ID
      const filteredProps = props.filter(
        (prop) =>
          prop.PROT_ID === item.PROT_ID && prop.TOPIC_ID === item.TOPIC_ID
      );

      const genTopicID = genUid15Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: protId,
        S_TOPIC_ID: genTopicID,
        S_TOPIC_TYPE: item.TOPIC_TYPE,
        S_TOPIC_NO: item.TOPIC_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: userId,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: userId,
        S_UPDATE_OID: OID,
      });

      // console.log(filteredProps)

      if (filteredProps.length > 0) {
        await CreateNewProp(
          protId,
          userId,
          OID,
          dateNow,
          genTopicID,
          filteredProps,
          options,
          extras
        );

        // console.log("dataProps=", filteredProps.length)
      }

      return finalResult;
    });

    // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    // console.log("result InsertTopicByProtId = ", results);
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const CreateNewProp = async (
  protId,
  userId,
  OID,
  dateNow,
  topicId,
  props,
  options,
  extras
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prop/insert/savePropTablefield.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = props.map(async (item) => {
      // Filter props based on PROT_ID and TOPIC_ID
      const filteredOptions = options.filter(
        (option) =>
          option.PROT_ID === item.PROT_ID &&
          option.TOPIC_ID === item.TOPIC_ID &&
          option.PROP_ID === item.PROP_ID
      );
      // Filter props based on PROT_ID and TOPIC_ID
      const filteredExtras = extras.filter(
        (option) =>
          option.PROT_ID === item.PROT_ID &&
          option.TOPIC_ID === item.TOPIC_ID &&
          option.PROP_ID === item.PROP_ID
      );

      // console.log(filteredOptions)

      const genPropID = genUid15Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: protId,
        S_TOPIC_ID: topicId,
        S_PROP_ID: genPropID,
        S_PROP_TYPE: item.PROP_TYPE,
        S_PROP_VALUE: item.PROP_VALUE,
        S_PROP_LIST: item.PROP_LIST,
        S_PROP_NO: item.PROP_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: userId,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: userId,
        S_UPDATE_OID: OID,
      });

      if (filteredOptions.length > 0) {
        await CreateNewOption(
          protId,
          userId,
          OID,
          dateNow,
          topicId,
          genPropID,
          filteredOptions
        );
        // console.log("dataOptions=", filteredOptions.length)
      }

      if (filteredExtras.length > 0) {
        await CreateNewExtra(
          protId,
          userId,
          OID,
          dateNow,
          topicId,
          genPropID,
          filteredExtras
        );
        // console.log("dataExtras=", filteredExtras.length)
      }
      return finalResult;
    });

    // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const CreateNewOption = async (
  protId,
  userId,
  OID,
  dateNow,
  topicId,
  propId,
  options
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveOption.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = options.map(async (item) => {
      const genOptionID = genUid11Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: protId,
        S_TOPIC_ID: topicId,
        S_PROP_ID: propId,
        S_OPTION_ID: genOptionID,
        S_OPTION_DES: item.OPTION_DES,
        S_OPTION_NO: item.OPTION_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: userId,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: userId,
        S_UPDATE_OID: OID,
      });

      return finalResult;
    });

    // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const CreateNewExtra = async (
  protId,
  userId,
  OID,
  dateNow,
  topicId,
  propId,
  extras
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/extra/insert/saveExtra.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = extras.map(async (item) => {
      const genExtraID = genUid15Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: protId,
        S_TOPIC_ID: topicId,
        S_PROP_ID: propId,
        S_EXTRA_ID: genExtraID,
        S_EXTRA_TYPE: item.EXTRA_TYPE,
        S_EXTRA_DESC: item.EXTRA_DESC,
        S_EXTRA_NO: item.EXTRA_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: userId,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: userId,
        S_UPDATE_OID: OID,
      });

      return finalResult;
    });

    // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
// get data for New Revision
const GetProtById = async (protId, userId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prot/select/getProtById.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
      S_CR_UID: userId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData;
    });

    return rows[0];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getTopicByProtId = async (protId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/topic/select/getTopicByProtId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData;
    });

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getPropByProtId = async (protId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prop/select/getPropsByProtId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData;
    });

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getOptionByProtId = async (protId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/option/select/getOptionByProtId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData;
    });

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getExtraByProtId = async (protId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/extra/select/getExtrasById.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData;
    });

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const UpdateApproveByProtId = async (req, res) => {
  try {
    const { protId, userId, OID } = req.body;

    if (!protId || !userId || !OID)
      return res.status(400).json({ message: "Missing required fields." });

    const dateNow = new Date();
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prot/updated/UpdateApprovalByProtId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const Approveflag = "A";

    const result = await connection.execute(sql, {
      S_APPV_FLAG: Approveflag,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: OID,
      S_UPDATE_UID: userId,
      S_PROT_ID: protId,
      S_CR_UID: userId,
    });

    await connection.commit();

    res.status(200).json({ message: "Approve data Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error Approve data");
  }
};

const UpdateRecoverByProtId = async (req, res) => {
  try {
    const { protId, userId, OID } = req.body;

    if (!protId || !userId || !OID)
      return res.status(400).json({ message: "Missing required fields." });

    const dateNow = new Date();
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prot/updated/UpdateRecoverByProtId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const Cancelflag = "F";
    const Draftflag = "W";

    const result = await connection.execute(sql, {
      S_CANCEL_FLAG: Cancelflag,
      S_APPV_FLAG: Draftflag,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: OID,
      S_UPDATE_UID: userId,
      S_PROT_ID: protId,
      S_CR_UID: userId,
    });

    await connection.commit();

    res.status(200).json({ message: "Recover data Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error Recover data");
  }
};

const UpdateRequestApprovalByProtId = async (req, res) => {
  try {
    const {
      protId,
      userId,
      OID,
      formCode,
      formRevision,
      isoCode,
      isoRevision,
      Draftflag,
    } = req.body;

    if (!protId || !userId || !OID || !Draftflag)
      return res.status(400).json({ message: "Missing required fields." });

    const dateNow = new Date();
    const connection = await connectToDatabase();

    // console.log(req.body)
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prot/updated/UpdateApprovalByProtId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const dataDuplicateCodeRev = await CheckIsDuplicateCodeRev();

    let filteredArray, field;
    if (formCode) {
      // Filter the array based on formCode and formRevision
      filteredArray = dataDuplicateCodeRev.filter(
        (item) =>
          item.FORM_CODE === formCode &&
          item.FORM_REVISION === formRevision &&
          item.PROT_ID !== protId
      );
      field = "Code และ Revision";
    } else if (isoCode) {
      // Filter the array based on isoCode and isoRevision
      filteredArray = dataDuplicateCodeRev.filter(
        (item) =>
          item.ISO_DOC_CODE === isoCode &&
          item.ISO_DOC_REVISION === isoRevision &&
          item.PROT_ID !== protId
      );
      field = "Code และ Revision";
    }

    // console.log(`filteredArray: ${field}`, filteredArray);
    if (Draftflag !== "N") {
      // Check if there are any matching values in the filtered array
      const hasMatchingValues = filteredArray && filteredArray.length > 0;
      // console.log("hasMatchingValues", hasMatchingValues);

      if (hasMatchingValues) {
        return res.status(401).json({ message: `${field} ถูกใช้ไปแล้ว` });
      }
    }

    // console.log("Draftflag", Draftflag);

    // const Draftflag = "P";
    const result = await connection.execute(sql, {
      S_APPV_FLAG: Draftflag,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: OID,
      S_UPDATE_UID: userId,
      S_PROT_ID: protId,
      S_CR_UID: userId,
    });

    await connection.commit();
    res.status(200).json({ message: "Recover data Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error Recover data");
  }
};

const CheckIsDuplicateCodeRev = async () => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getAllForms.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql);
    await connection.close();

    const rows = await Promise.all(
      result.rows.map(async (row) => {
        const rowData = {};
        result.metaData.forEach((meta, index) => {
          rowData[meta.name] = row[index];
        });

        return rowData;
      })
    );

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
const getIsoMaster = async (req, res) => {
  try {
    const { iso, revision } = req.body;

    if (!iso || !revision)
      return res.status(400).json({ message: "Missing required fields." });

    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prot/select/getIsoMaster.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql, {
      doc_code: iso,
      DOC_REVISION: revision,
    });
    await connection.close();

    const rows = await Promise.all(
      result.rows.map(async (row) => {
        const rowData = {};
        result.metaData.forEach((meta, index) => {
          rowData[meta.name] = row[index];
        });

        // rowData.ANNOU_DATE = AnnouDate ? AnnouDate : "";

        return rowData;
      })
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching   iso data");
  }
};

const getProtByISO = async (req, res) => {
  try {
    const { iso, revision } = req.body;

    if (!iso || !revision)
      return res.status(400).json({ message: "Missing required fields." });

    // console.log("iso code",iso)
    // console.log("iso revision",revision)
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prot/select/getProtByIso.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql, {
      S_ISO_DOC_CODE: iso,
      S_ISO_DOC_REVISION: revision,
    });
    await connection.close();

    const rows = await Promise.all(
      result.rows.map(async (row) => {
        const rowData = {};
        result.metaData.forEach((meta, index) => {
          rowData[meta.name] = row[index];
        });
        const AnnouDate = await GetISOAnnouDate(
          rowData.ISO_DOC_CODE,
          rowData.ISO_DOC_REVISION
        );
        rowData.ANNOU_DATE = AnnouDate ? AnnouDate : "";

        return rowData;
      })
    );

    const formattedData = formatDataGetForms(rows);

    const filterData = formattedData.filter((form) => {
      return (
        (form.APPV_FLAG === "W" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "P" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "A" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "R" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "D" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "P" && form.CANCEL_FLAG === "T")
      );
    });

    const sortedData = filterData.sort(
      (a, b) => new Date(b.CR_DATE) - new Date(a.CR_DATE)
    );

    res.status(200).json(sortedData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching prot by iso data");
  }
};

const getFormNotApprove = async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getFormNotApprove.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql);
    await connection.close();

    const rows = await Promise.all(
      result.rows.map(async (row) => {
        const rowData = {};
        result.metaData.forEach((meta, index) => {
          rowData[meta.name] = row[index];
        });

        if (
          rowData.ISO_DOC_CODE !== null &&
          rowData.ISO_DOC_REVISION !== null
        ) {
          // console.log("rowData.ISO_DOC_CODE", rowData.ISO_DOC_CODE)
          // console.log("rowData.ISO_DOC_REVISION", rowData.ISO_DOC_REVISION)
          const AnnouDate = await GetISOAnnouDate(
            rowData.ISO_DOC_CODE,
            rowData.ISO_DOC_REVISION
          );
          rowData.ANNOU_DATE = AnnouDate ? AnnouDate.toString() : "";
        } else {
          if (rowData.APPV_FLAG === "R" || rowData.APPV_FLAG === "N") {
            rowData.ANNOU_DATE =
              rowData.APPV_DATE !== null
                ? rowData.APPV_DATE
                : rowData.UPDATE_DATE;
          } else {
            rowData.ANNOU_DATE = "";
          }
        }

        return rowData;
      })
    );

    const formattedData = formatDataGetForms(rows);

    const filterData = formattedData.filter((form) => {
      return (
        (form.APPV_FLAG === "W" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "P" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "A" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "R" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "D" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "N" && form.CANCEL_FLAG === "F") ||
        (form.APPV_FLAG === "P" && form.CANCEL_FLAG === "T")
      );
    });

    // console.log(filterData.find((item) => item.PROT_ID === "DFD67040015"));

    const sortedData = filterData.sort(
      (a, b) => new Date(b.CR_DATE) - new Date(a.CR_DATE)
    );

    res.status(200).json(sortedData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};

const GetISOAnnouDate = async (isoCode, isoRevision) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getAnnouDate.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql, {
      S_DOC_CODE: isoCode,
      S_DOC_REVISION: isoRevision,
    });
    await connection.close();

    const rows = result.rows.map((row) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    const formattedData = rows[0]?.ANNOU_DATE || "";
    // console.log(formattedData);
    return formattedData;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error fetching iso date data");
  }
};

const GetFormByProtId = async (req, res) => {
  try {
    const { protId } = req.body;

    if (!protId)
      return res.status(400).json({ message: "Missing required fields." });

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getFormByProtId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
      rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ
      return rowData;
    });

    const TopicData = await GetTopicByFormId(protId);

    const formattedData = formatDataForm(rows, TopicData);

    res.status(200).json(...formattedData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form list data");
  }
};

//get Topic
const GetTopicByFormId = async (formId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getTopicByFormId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: formId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const PropData = await getProp(formId);
    // console.log("Props data= ", PropData);

    const OptionData = await getOptions(formId);
    // console.log("OptionData data= ", OptionData);

    const rows = await Promise.all(
      result.rows.map(async (row, index) => {
        const rowData = {};
        result.metaData.forEach((meta, index) => {
          rowData[meta.name] = row[index];
        });
        // Find all matching property data in PropData based on TOPIC_ID
        const matchingProps = PropData.filter(
          (prop) => prop.TOPIC_ID === rowData.TOPIC_ID
        );
        const matchingOptions = OptionData.filter(
          (prop) => prop.TOPIC_ID === rowData.TOPIC_ID
        );

        // Extract properties from matchingProps and structure into a new object
        const extraAttributes = {};

        matchingProps.forEach((prop) => {
          if (prop.PROP_TYPE === "options") {
            extraAttributes[prop.PROP_TYPE] =
              matchingOptions.map((option) => option.OPTION_DES) || [];
          } else if (prop.PROP_TYPE === "required") {
            extraAttributes[prop.PROP_TYPE] =
              prop.PROP_VALUE === "T" ? true : false;
          } else if (prop.PROP_TYPE === "rows") {
            extraAttributes[prop.PROP_TYPE] =
              parseInt(prop.PROP_VALUE, 10) || 0;
          } else {
            extraAttributes[prop.PROP_TYPE] = prop.PROP_VALUE;
          }

          if (rowData.TOPIC_TYPE !== "TableField") {
            extraAttributes.defaultValue = "";
          }
        });

        // Add extraAttributes to rowData
        rowData.extraAttributes = extraAttributes;
        rowData.status = "old";

        // ถ้าเป็น topic  = TableField
        if (rowData.TOPIC_TYPE === "TableField") {
          // console.log("TableField=", rowData)
          // console.log("matchingProps=", matchingProps)

          const filteredPropRows = matchingProps.filter(
            (obj) =>
              obj.PROP_TYPE === "Rows" && rowData.TOPIC_ID === obj.TOPIC_ID
          );
          const filteredPropColumns = matchingProps.filter(
            (obj) =>
              obj.PROP_TYPE === "Columns" && rowData.TOPIC_ID === obj.TOPIC_ID
          );

          const RowSortNo = filteredPropRows.sort(
            (a, b) => a.PROP_NO - b.PROP_NO
          );
          const ColSortNo = filteredPropColumns.sort(
            (a, b) => a.PROP_NO - b.PROP_NO
          );
          // console.log("RowSortNo = ", RowSortNo)

          // console.log("matchingDefaultsRow=", matchingDefaultsRow)

          const updatedRowSortNo = RowSortNo.map((row) => {
            const matchingRow = [];

            // console.log("row=", row)
            // console.log("matchingRow=", matchingRow)
            if (matchingRow) {
              return {
                ...row,
                DefaultData: [],
              };
            }
            return row;
          });

          // console.log("updatedRowSortNo = ", updatedRowSortNo)

          rowData.extraAttributes = {
            ...rowData.extraAttributes, // Keep existing properties in extraAttributes
            Rows: formatDataRows(updatedRowSortNo),
            Columns: formatDataColumns(ColSortNo),
          };
        }

        // ถ้าเป็น topic  = SelectDBField
        if (rowData.TOPIC_TYPE === "SelectDBField") {
          const sqlTabText = rowData.extraAttributes.sqlTabText;

          // console.log("sqlTabText = ", sqlTabText)

          const dataSqlTab = await getDataBySqlTabList(sqlTabText);

          // console.log("dataSqlTab = ", dataSqlTab)

          rowData.extraAttributes = {
            ...rowData.extraAttributes, // Keep existing properties in extraAttributes
            columns: dataSqlTab.data,
            headColumns: { head: dataSqlTab.head },
          };
          // console.log("SelectDBField extraAttributes=", rowData)
        }
        // ถ้าเป็น topic  = StaticSelectDBField
        if (rowData.TOPIC_TYPE === "StaticSelectDBField") {
          const sqlTabText = rowData.extraAttributes.sqlTabText;

          // console.log("sqlTabText = ", sqlTabText)

          const dataSqlTab = await getDataBySqlTabList(sqlTabText);

          // console.log("dataSqlTab = ", dataSqlTab)

          rowData.extraAttributes = {
            ...rowData.extraAttributes, // Keep existing properties in extraAttributes
            columns: dataSqlTab.data,
            headColumns: { head: dataSqlTab.head },
          };
          // console.log("StaticSelectDBField extraAttributes=", rowData)
        }
        // ถ้าเป็น topic  = ApprovalField
        if (rowData.TOPIC_TYPE === "ApprovalField") {
          const sqlTabText = rowData.extraAttributes.sqlTabText;

          // console.log("sqlTabText = ", sqlTabText)

          const dataSqlTab = await getListDataByRoleId(sqlTabText);

          // console.log("dataSqlTab = ", dataSqlTab)

          rowData.extraAttributes = {
            ...rowData.extraAttributes, // Keep existing properties in extraAttributes
            columns: dataSqlTab.data,
            headColumns: { head: dataSqlTab.head },
          };
          // console.log("ApprovalField extraAttributes=", rowData)
        }
        return rowData;
      })
    );

    // console.log("rows =", rows)
    const TopicSortNo = rows.sort((a, b) => a.TOPIC_NO - b.TOPIC_NO);
    const formattedDataTopic = formatDataTopic(TopicSortNo);
    // console.log("formattedDataTopic =", formattedDataTopic)

    return formattedDataTopic;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

//get prop
const getProp = async (formId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getPropByFormId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: formId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const ExtraData = await getExtraByPropId(formId);
    const OptionsData = await getOptionsForColumn(formId);

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
      // rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ

      if (rowData.PROP_TYPE === "Rows") {
        const filteredExtraRows = ExtraData.filter(
          (obj) =>
            rowData.TOPIC_ID === obj.TOPIC_ID && rowData.PROP_ID === obj.PROP_ID
        );
        const ExtraSortNo = filteredExtraRows.sort(
          (a, b) => a.EXTRA_NO - b.EXTRA_NO
        );
        // console.log(ExtraSortNo)
        rowData.ExtraType = formatDataExtra(ExtraSortNo);
      }

      if (rowData.PROP_TYPE === "Columns" && rowData.PROP_LIST === "dropdown") {
        // console.log("rowData = ", rowData)
        const filteredOptions = OptionsData.filter(
          (obj) =>
            rowData.TOPIC_ID === obj.TOPIC_ID && rowData.PROP_ID === obj.PROP_ID
        );
        const OptionSortNo = filteredOptions.sort(
          (a, b) => a.OPTION_NO - b.OPTION_NO
        );

        rowData.Dropdown = formatDataOptionsForColumns(OptionSortNo);
      }

      return rowData;
    });

    const formattedData = formatDataProp(rows);
    return formattedData;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

//get options
const getOptions = async (formId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getOptionByFormId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: formId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
      // rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ
      return rowData;
    });

    const OptionSortNo = rows.sort((a, b) => a.OPTION_NO - b.OPTION_NO);
    const formattedData = formatDataOption(OptionSortNo);
    // console.log(formattedData)
    return formattedData;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getExtraByPropId = async (formId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/extra/select/getExtraByPropId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: formId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
      // rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ
      return rowData;
    });

    // get NameExtra
    const extraList = await getExtraTypeAll();

    // console.log(extraList)

    const formattedRows = rows.map((row) => {
      const { EXTRA_TYPE } = row;
      const matchingExtra = extraList.find(
        (extra) => extra.EXTRA_TYPE_ID === EXTRA_TYPE
      );

      if (matchingExtra) {
        return {
          ...row,
          EXTRA_TYPE: matchingExtra.label,
        };
      } else {
        // Handle the case when no matchingExtra is found
        return row;
      }
    });

    // console.log(formattedRows);

    return formattedRows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getExtraTypeAll = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/extra/select/getExtras.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
      // rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ
      return rowData;
    });

    // console.log(rows)

    const formattedData = rows.map((row) => {
      return {
        EXTRA_TYPE_ID: row.EXTRA_TYPE_ID,
        label: row.LABEL,
      };
    });

    return formattedData;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getOptionsForColumn = async (formId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getOptionByFormId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: formId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
      // rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ
      return rowData;
    });

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// get data by role_id

const getListDataByRoleId = async (sqlTab) => {
  try {
    if (!sqlTab) res.status(400).json("error role_id not found!");

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // // หาที่อยู่ของไฟล์ .sql
    // const sqlFilePath = path.join(__dirname, sqlTab);
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/sqltab/select/getRolesByRoleId.sql"
    );
    // // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_ROLE_NO: sqlTab,
    });

    // console.log("new result", result)

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    const formattedData = {
      head: [],
      data: rows,
    };

    // // Extracting keys from the first object in the rows array
    if (rows.length > 0) {
      formattedData.head = Object.keys(rows[0]);
    }
    //   res.status(200).json(formattedData);
    return formattedData;
  } catch (error) {
    console.error("Error:", error);
    //   return res.status(500).send("Error fetching data");
    throw error;
  }
};

//get sql tab data

const getDataBySqlTabList = async (sqlTab) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // // หาที่อยู่ของไฟล์ .sql
    // const sqlFilePath = path.join(__dirname, sqlTab);

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/sqltab/select/getDataBySqlTab.sql"
    );
    // // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_SQL_NO: sqlTab,
    });

    // console.log("new result", result)

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    // console.log("rows =",rows)

    if (!rows) res.status(400).json("data not found!");

    const newSqlData = rows[0].SQL_STMT;
    if (!newSqlData) res.status(400).json("newSqlData not found!");
    const newData = await GetDataBySqlTab(newSqlData);

    const formattedData = {
      head: [],
      data: newData,
    };

    // // Extracting keys from the first object in the rows array
    if (rows.length > 0) {
      formattedData.head = Object.keys(newData[0]);
    }
    return formattedData;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const GetDataBySqlTab = async (sql) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

//FORMATTED DATA
const formatDataGetForms = (data) => {
  // console.log(data)
  return data.map((item) => {
    let status = item.APPV_FLAG;
    if (item.APPV_FLAG === "N" && item.CANCEL_FLAG === "F") {
      status = "R";
    } else if (item.APPV_FLAG === "P" && item.CANCEL_FLAG === "T") {
      status = "Cancelled";
    }

    const codeRev = item.FORM_CODE
      ? `${item.FORM_CODE}/${item.FORM_REVISION}`
      : item.ISO_DOC_CODE
      ? `${item.ISO_DOC_CODE}/${item.ISO_DOC_REVISION}`
      : "";

    return {
      PROT_ID: item.PROT_ID,
      FORM_CODE: item.FORM_CODE,
      FORM_REVISION: item.FORM_REVISION,
      FORM_TITLE: item.FORM_TITLE,
      FORM_DESC: item.FORM_DESC,
      ISO_DOC_CODE: item.ISO_DOC_CODE,
      ISO_DOC_REVISION: item.ISO_DOC_REVISION,
      // APPV_FLAG: item.APPV_FLAG === "F" ? false : true,
      APPV_FLAG: item.APPV_FLAG,
      APPV_DATE: item.APPV_DATE,
      APPV_OID: item.APPV_OID,
      APPV_UID: item.APPV_UID,
      CR_DATE: item.CR_DATE,
      CR_OID: item.CR_OID,
      CR_UID: item.CR_UID,
      UPDATE_DATE: item.UPDATE_DATE,
      UPDATE_OID: item.UPDATE_OID,
      UPDATE_UID: item.UPDATE_UID,
      ANNOU_DATE: item.ANNOU_DATE,
      Status: status,
      CANCEL_FLAG: item.CANCEL_FLAG,
      CODE_REV: codeRev.trim(),
    };
  });
};

const formatDataForm = (data, topic) => {
  // console.log(data)
  return data.map((item) => {
    return {
      id: item.PROT_ID,
      FORM_CODE: item.FORM_CODE,
      FORM_REVISION: item.FORM_REVISION,
      // FORM_TITLE: item.FORM_TITLE,
      // FORM_DESC: item.FORM_DESC,
      // ISO_DOC_CODE: item.ISO_DOC_CODE,
      // ISO_DOC_REVISION: item.ISO_DOC_REVISION,
      APPV_FLAG: item.APPV_FLAG,
      // APPV_DATE: item.APPV_DATE,
      // APPV_OID: item.APPV_OID,
      // APPV_UID: item.APPV_UID,
      // CR_DATE: item.CR_DATE,
      // CR_OID: item.CR_OID,
      // CR_UID: item.CR_UID,
      // CANCEL_FLAG: item.CANCEL_FLAG,
      // CANCEL_DATE: item.CANCEL_DATE,
      // CANCEL_OID: item.CANCEL_OID,
      // CANCEL_UID: item.CANCEL_UID,
      // UPDATE_DATE: item.UPDATE_DATE,
      // UPDATE_OID: item.UPDATE_OID,
      // UPDATE_UID: item.UPDATE_UID,

      userId: item.CR_UID,
      createdAt: "2023-12-08T07:54:57.587Z",
      published: false,
      name: item.FORM_TITLE,
      description: item.FORM_DESC,
      content: topic,
      visits: 0,
      submissions: 0,
      shareURL: "ada29273-f42d-4907-84d5-d77a0e2439d9",
      iso_code: item.ISO_DOC_CODE,
      iso_revistion: item.ISO_DOC_REVISION,
    };
  });
};

const formatDataRows = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      ROW_ID: item.PROP_ID,
      ROW_DESC: item.PROP_VALUE,
      ROW_NO: +item.PROP_NO,
      ExtraType: item.ExtraType || [],
      DefaultData: item.DefaultData || [],
    };
  });
};
const formatDataColumns = (data) => {
  return data.map((item) => {
    return {
      COL_ID: item.PROP_ID,
      COL_DESC: item.PROP_VALUE,
      COL_NO: +item.PROP_NO,
      Type: item.PROP_LIST,
      Dropdown: item.Dropdown || [],
    };
  });
};

const formatDataTopic = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      id: item.TOPIC_ID,
      type: item.TOPIC_TYPE,
      extraAttributes: item.extraAttributes,
      status: item.status,
    };
  });
};

const formatDataExtra = (data) => {
  // console.log(data)

  return data.map((item) => {
    return {
      EXTRA_TYPE_NO: item.EXTRA_NO,
      EXTRA_TYPE_ID: +item.EXTRA_ID,
      EXTRA_TYPE_TITLE: item.EXTRA_TYPE,
      valueText: item.EXTRA_DESC,
    };
  });
};

const formatDataOptionsForColumns = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      no: +item.OPTION_NO,
      value: item.OPTION_DES,
    };
  });
};
const formatDataProp = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      TOPIC_ID: item.TOPIC_ID,
      PROP_ID: item.PROP_ID,
      PROP_TYPE: item.PROP_TYPE,
      PROP_VALUE: item.PROP_VALUE,
      PROP_LIST: item.PROP_LIST,
      PROP_NO: item.PROP_NO,
      ExtraType: item.ExtraType,
      Dropdown: item.Dropdown,
    };
  });
};

const formatDataOption = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      TOPIC_ID: item.TOPIC_ID,
      OPTION_ID: item.OPTION_ID,
      OPTION_DES: item.OPTION_DES,
      OPTION_NO: item.OPTION_NO,
    };
  });
};

module.exports = {
  getFormNotApprove,
  GetFormByProtId,
  UpdateRecoverByProtId,
  UpdateRequestApprovalByProtId,
  CreateNewRevision,
  UpdateApproveByProtId,
  getProtByISO,
  getIsoMaster,
};
