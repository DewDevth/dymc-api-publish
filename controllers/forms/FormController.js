const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");
const {
  genUid15Digit,
  generateProtId,
  genUid11Digit,
} = require("../../utils/genId");

// UPDATE CANCEL FLAG = F  ยกเลิกฟอร์ม checksheet
// table form
const UpdateCancelFlagFormById = async (req, res) => {
  try {
    const { formId, userId, oid, flag, cancel_date, cancel_uid, cancel_oid } =
      req.body;

    if (!formId || !userId || !oid)
      return res.status(400).json({ message: "Missing required fields." });

    const dateNow = new Date();
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/form/updated/cancelFlag.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // console.log(req.body)
    const newCanceldate = new Date(cancel_date);

    const result = await connection.execute(sql, {
      S_CANCEL_FLAG: flag ? "T" : "F",
      S_CANCEL_DATE: flag ? dateNow : newCanceldate,
      S_CANCEL_UID: flag ? userId : cancel_uid,
      S_CANCEL_OID: flag ? oid : cancel_oid,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: oid,
      S_UPDATE_UID: userId,
      S_FORM_ID: formId,
    });

    await connection.commit();

    res.status(200).json({ message: "Update CancelFlag Form Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error CancelFlag Form");
  }
};
// table form user
const UpdateCancelFlagFormUserById = async (req, res) => {
  try {
    const {
      formId,
      seq,
      userId,
      oid,
      flag,
      cancel_date,
      cancel_uid,
      cancel_oid,
    } = req.body;

    if (!formId || !seq || !userId || !oid)
      return res.status(400).json({ message: "Missing required fields." });

    const dateNow = new Date();
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/form/updated/cancelFlagFormUser.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // console.log(req.body)
    const newCanceldate = new Date(cancel_date);

    const result = await connection.execute(sql, {
      S_CANCEL_FLAG: flag ? "T" : "F",
      S_CANCEL_DATE: flag ? dateNow : newCanceldate,
      S_CANCEL_UID: flag ? userId : cancel_uid,
      S_CANCEL_OID: flag ? oid : cancel_oid,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: oid,
      S_UPDATE_UID: userId,
      S_FORM_ID: formId,
      S_SEQ: seq,
    });

    await connection.commit();

    res
      .status(200)
      .json({ message: "Update CancelFlag Form User Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error CancelFlag Form User");
  }
};

// CREATE FORM POTOTYPE
const CreateForm = async (req, res) => {
  try {
    const { data } = req.body;
    const name = data.name;
    const description = data.description;
    const userId = data.userId;
    const OID = data.OID;
    const isoCode = data.isoCode;
    const isoRev = data.isoRev;
    const code = data.code;
    const Rev = data.Rev;
    // console.log(description)
    if (!name || !userId || !OID)
      return res.status(400).json({ message: "Missing required fields." });

    // check ค่า title ชื่อฟอร์ม ซ้ำไหม
    const DataTitle = await GetFormByTitle(name);
    // console.log(DataTitle)

    if (DataTitle.length > 0)
      return res.status(401).json({ message: "Duplicate form name data" });

    const genFormId = await generateProtId();
    console.log("genFormId=", genFormId);

    const dateNow = new Date();
    const connection = await connectToDatabase();

    const FORM_CODE = code;
    const FORM_REVISION = Rev;
    const ISO_DOC_CODE = isoCode;
    const ISO_DOC_REVISION = isoRev;
    const UID = userId;
    const OID_data = OID;
    // status Draft
    const approveFlag = "W";

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveForm.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_PROT_ID: genFormId,
      S_FORM_CODE: FORM_CODE,
      S_FORM_REVISION: FORM_REVISION,
      S_FORM_TITLE: name,
      S_FORM_DESC: description,
      S_ISO_DOC_CODE: ISO_DOC_CODE,
      S_ISO_DOC_REVISION: ISO_DOC_REVISION,
      S_APPV_FLAG: approveFlag,
      S_CR_DATE: dateNow,
      S_CR_UID: UID,
      S_CR_OID: OID_data,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: OID_data,
      S_UPDATE_UID: UID,
    });

    await connection.commit();

    const formateData = {
      FormId: genFormId,
    };

    res.status(200).json({ message: "Save Form Successfully", formateData });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error save form");
  }
};

const GetFormByTitle = async (titleText) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getFormByTitle.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FORM_TITLE: titleText,
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

// CREATE TOPIC POTOTYPE
const CreateProtTopic = async (req, res) => {
  try {
    const { UID, OID, PROT_ID, TOPICS } = req.body;
    if (!UID || !OID || !PROT_ID || !TOPICS)
      return res.status(400).json({ message: "Missing required fields." });
    const dateNow = new Date();
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveTopic.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = TOPICS.map(async (item) => {
      // const genTopicID = generateRandomNumber3Digit()
      const genTopicID = genUid15Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: PROT_ID,
        S_TOPIC_ID: genTopicID,
        S_TOPIC_TYPE: item.type,
        S_TOPIC_NO: item.TOPIC_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: UID,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: UID,
        S_UPDATE_OID: OID,
      });

      if (item.extraAttributes) {
        // Add extra attributes to the topicAttributes
        // Object.assign(topicAttributes, item.extraAttributes);
        let itemDataOptions;
        const propObjects = Object.entries(item.extraAttributes).map(
          ([key, value]) => {
            if (key === "required") {
              value = value ? "T" : "F";
            }
            if (key === "options") {
              itemDataOptions = value;
              value = "options";
            }
            return {
              PROP_TYPE: key,
              PROP_VALUE: value,
            };
          }
        );

        // const itemDataOptions = item.extraAttributes;
        // console.log(",itemDataOptions= ", itemDataOptions)
        const saveProp = await CreateProtProp(
          dateNow,
          UID,
          OID,
          PROT_ID,
          genTopicID,
          propObjects,
          itemDataOptions
        );
      }

      return finalResult;
    });

    // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    // console.log("result DYMCHK_HEAD_TOPIC = ", results);
    res.status(200).json({ message: "Save Topic Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error Create Topics data");
  }
};

const CreateProtProp = async (
  dateNow,
  UID,
  OID,
  PROT_ID,
  genTopicID,
  extraAttributes,
  itemDataOptions
) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveTopicProp.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // console.log("Transformed props =", extraAttributes);

    // Execute the main checklist update
    const promises = extraAttributes.map(async (item) => {
      // const genPropID = generateRandomNumber3Digit()
      const genPropID = genUid15Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: PROT_ID,
        S_TOPIC_ID: genTopicID,
        S_PROP_ID: genPropID,
        S_PROP_TYPE: item.PROP_TYPE,
        S_PROP_VALUE: item.PROP_VALUE,
        S_CR_DATE: dateNow,
        S_CR_UID: UID,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: UID,
        S_UPDATE_OID: OID,
      });

      if (item.PROP_TYPE === "options") {
        const options = itemDataOptions;
        // console.log("CreateProtProp =", options)
        const saveOptions = await CreateProtOption(
          dateNow,
          UID,
          OID,
          PROT_ID,
          genTopicID,
          genPropID,
          options
        );
      }

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("result DYMCHK_PROT_PROP = ", results);

    return;
  } catch (error) {
    console.error("Error creating topic property:", error);
    throw error; // Handle the error according to your application's needs
  }
};

const CreateProtOption = async (
  dateNow,
  UID,
  OID,
  PROT_ID,
  genTopicID,
  genPropID,
  options
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveOption.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // console.log("options= ", options)
    // Execute the main checklist update
    const promises = options.map(async (item) => {
      // const genOptionID = generateRandomNumber3Digit()
      const genOptionID = genUid11Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: PROT_ID,
        S_TOPIC_ID: genTopicID,
        S_PROP_ID: genPropID,
        S_OPTION_ID: genOptionID,
        S_OPTION_DES: item.OPTION_DESC,
        S_OPTION_NO: item.OPTION_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: UID,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: UID,
        S_UPDATE_OID: OID,
      });

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("result DYMCHK_PROT_OPTION = ", results);
    return;
  } catch (error) {
    console.error("Error creating topic property:", error);
    throw error; // Handle the error according to your application's needs
  }
};

// UPDATE FORM
const UpdateTitleFormById = async (req, res) => {
  try {
    const {
      id,
      title,
      userId,
      OID,
      desc,
      formCode,
      formRevision,
      isoCode,
      isoRevision,
    } = req.body;

    if (!id || !userId || !OID)
      return res.status(400).json({ message: "Missing required fields." });

    const dateNow = new Date();
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/updated/updateTitleForm.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_FORM_TITLE: title,
      S_FORM_CODE: formCode,
      S_FORM_REVISION: formRevision,
      S_ISO_DOC_CODE: isoCode,
      S_ISO_DOC_REVISION: isoRevision,
      S_FORM_DESC: desc,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: OID,
      S_UPDATE_UID: userId,
      S_PROT_ID: id,
      S_CR_UID: userId,
    });

    await connection.commit();

    res.status(200).json({ message: "Update Title Form Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error Update Title Form");
  }
};

//CreateAndUpdateAndClear Topic pototype
const CreateAndUpdateProtTopic = async (req, res) => {
  try {
    const { UID, OID, PROT_ID, TOPICS } = req.body;
    if (!UID || !OID || !PROT_ID || !TOPICS)
      return res.status(400).json({ message: "Missing required fields." });
    const dateNow = new Date();
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveTopic.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ถ้า TOPICS ไม่มีค่า -------------------------------------
    // console.log("TOPICS ===", TOPICS)
    // ถ้า TOPICS ไม่มีค่า เลย ส่งไปก็จะ ล้างค่าเดิมทั้งหมด ด้วย PROT_ID
    const countTopics = TOPICS.length > 0;
    if (!countTopics) {
      // console.log("test count")
      await ClearTopics(PROT_ID);
      await ClearProps(PROT_ID);
      await ClearOptions(PROT_ID);
      await ClearExtra(PROT_ID);
    } else {
      // ถ้ามีค่า----------------------------------
      // filter topics status edit and old
      const oldAndEditTopics = TOPICS.filter(
        (item) => item.status === "old" || item.status === "edit"
      );
      const topicDataDb = await GetTopicByProtId(PROT_ID);
      // เช็ค ค่า เเตกต่างกันของ web  ค่า oldAndEditTopics    เเละจาก db topicDataDb
      const differentTopics = topicDataDb.filter(
        (dbItem) =>
          !oldAndEditTopics.some((oldItem) => oldItem.id === dbItem.id)
      );
      // ถ้ามีค่า  topic ที่ส่งมา ไม่ตรงกับใน topic db จะ ให้ นำค่าที่ไม่ตรง ไปลบ
      if (differentTopics.length > 0) {
        await DeleteTopic(PROT_ID, differentTopics);
        await DeleteProp(PROT_ID, differentTopics);
        await DeleteOption(PROT_ID, differentTopics);
        await DeleteExtra(PROT_ID, differentTopics);
        // console.log("test PROT_ID : ", PROT_ID)
        // console.log("test differentTopics : ", differentTopics)
      }

      // Filter topics with status 'edit'
      const oldTopics = TOPICS.filter((item) => item.status === "old");
      const editTopics = TOPICS.filter((item) => item.status === "edit");
      const newTopics = TOPICS.filter((item) => item.status === "new");

      // const dateNow = new Date();

      // 1
      // หาค่าสักอันใน topics ว่ามี  status = 'edit' ไหม
      const isEditTopic = editTopics.length > 0;
      if (isEditTopic) {
        // console.log("edit,= ", isEditTopic)

        // 1.ให้ update TOPIC_NO ของ oldTopics ทุกอัน
        //topic status old
        await UpdateTopicNoByID(PROT_ID, UID, OID, dateNow, oldTopics);

        // 2. ให้ เอาข้อมูล editTopics ไป update
        //topic status edit
        if (editTopics) {
          await UpdateTopicEditByID(PROT_ID, UID, OID, dateNow, editTopics);
          // console.log("editTopics = true")
        }

        // 3. ถ้ามี ค่าของ  newTopics ให้ เอาไป insert ข้อมูล
        //topic status new
        if (newTopics) {
          await InsertTopicByProtId(PROT_ID, UID, OID, dateNow, newTopics);
        }
      } else {
        //topic status old
        if (editTopics) {
          await UpdateTopicNoByID(PROT_ID, UID, OID, dateNow, oldTopics);
        }
        //topic status new
        if (newTopics) {
          await InsertTopicByProtId(PROT_ID, UID, OID, dateNow, newTopics);
        }
      }
    }

    res.status(200).json({ message: "Save Topic Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error Create Topics data");
  }
};

// get TopicByProtId
const GetTopicByProtId = async (protId) => {
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

    const formattedDataTopic = formatDataTopic(rows);
    return formattedDataTopic;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getOptionByProtIdAndTopicId = async (formId, topicId) => {
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
    console.log(formattedData);
    return formattedData;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

//update topic  topic_no
const UpdateTopicNoByID = async (PROT_ID, UID, OID, dateNow, topicsOld) => {
  try {
    if (!PROT_ID || !UID || !OID || !topicsOld)
      return res.status(400).json({ message: "Missing required fields." });

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/topic/updated/updateTopicNo.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // console.log("topicsOld", topicsOld)

    // Execute the main checklist update
    const promises = topicsOld.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_TOPIC_NO: item.TOPIC_NO,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_OID: OID,
        S_UPDATE_UID: UID,
        S_PROT_ID: PROT_ID,
        S_TOPIC_ID: item.id,
      });

      return finalResult;
    });

    // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    // console.log("result update topic status = old = ", results);
    // console.log("result update topic status = old = ");
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

//update  topic edit  table topic,prop,option
const UpdateTopicEditByID = async (PROT_ID, UID, OID, dateNow, topicsEdit) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/topic/updated/updateTopicNo.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = topicsEdit.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_TOPIC_NO: item.TOPIC_NO,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_OID: OID,
        S_UPDATE_UID: UID,
        S_PROT_ID: PROT_ID,
        S_TOPIC_ID: item.id,
      });

      // ถ้า type topic = TableField
      if (item.type === "TableField") {
        await DeleteProp(PROT_ID, topicsEdit);
        await DeleteOption(PROT_ID, topicsEdit);
        await DeleteExtra(PROT_ID, topicsEdit);

        const propObjects = [];

        // Process Rows
        // Process Rows
        if (item.extraAttributes.Rows) {
          const rowsEntries = item.extraAttributes.Rows.map((row) => ({
            PROP_TYPE: "Rows",
            PROP_NO: row.ROW_NO,
            DESC: row.ROW_DESC,
            PROP_LIST: "",
            ExtraType: row.ExtraType,
          }));

          propObjects.push(...rowsEntries);
        }

        // Process Columns
        if (item.extraAttributes.Columns) {
          const columnsEntries = item.extraAttributes.Columns.map((column) => ({
            PROP_TYPE: "Columns",
            PROP_NO: column.COL_NO,
            DESC: column.COL_DESC,
            PROP_LIST: column.Type,
            Dropdown: column.Dropdown,
          }));

          propObjects.push(...columnsEntries);
        }

        // console.log("TableField => propObjects= ", propObjects);
        // save prop  type table field

        // console.log("item.extraAttributes = ", item.extraAttributes)
        await CreateProtPropTableField(
          dateNow,
          UID,
          OID,
          PROT_ID,
          item.id,
          propObjects
        );

        // case type label
        if (item.extraAttributes) {
          const labelObject = Object.entries(item.extraAttributes).map(
            ([key, value]) => {
              if (key === "label") {
                value = value;
              }

              return {
                PROP_TYPE: key,
                PROP_VALUE: value,
              };
            }
          );

          // console.log(labelObject)
          const filteredLabelObject = labelObject.filter(
            (obj) => obj.PROP_TYPE === "label"
          );
          // console.log(filteredLabelObject);
          const itemDataEmpty = [];
          const saveProp = await CreateProtProp(
            dateNow,
            UID,
            OID,
            PROT_ID,
            item.id,
            filteredLabelObject,
            itemDataEmpty
          );
        }
      } else {
        // console.log("item.extraAttributes =", item.extraAttributes)
        if (item.extraAttributes) {
          // Add extra attributes to the topicAttributes
          // Object.assign(topicAttributes, item.extraAttributes);
          let itemDataOptions;
          const propObjects = Object.entries(item.extraAttributes).map(
            ([key, value]) => {
              if (key === "required") {
                value = value ? "T" : "F";
              }
              if (key === "options") {
                itemDataOptions = value;
                value = "options";
              }
              return {
                PROP_TYPE: key,
                PROP_VALUE: value,
              };
            }
          );

          // const itemDataOptions = item.extraAttributes;
          // console.log(",itemDataOptions test======= ", itemDataOptions)
          const updateProp = await UpdateTopicEditProp(
            dateNow,
            UID,
            OID,
            PROT_ID,
            item.id,
            propObjects,
            itemDataOptions
          );

          // const saveProp = await CreateProtProp(dateNow, UID, OID, PROT_ID, genTopicID, genPropID, options);
        }
      }

      return finalResult;
    });

    // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    // console.log("result update topic status = old = ", results);
    // console.log("result update topic status = old = ");
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const UpdateTopicEditProp = async (
  dateNow,
  UID,
  OID,
  PROT_ID,
  TOPIC_ID,
  propObjects,
  itemDataOptions
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prop/updated/updatePropById.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // console.log("UpdateTopicEditProp propObjects ====", propObjects);
    // console.log("UpdateTopicEditProp itemDataOptions====", itemDataOptions);

    // Execute the main checklist update
    const promises = propObjects.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_PROP_VALUE: item.PROP_VALUE,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_OID: OID,
        S_UPDATE_UID: UID,
        S_PROT_ID: PROT_ID,

        S_TOPIC_ID: TOPIC_ID,
        S_PROP_TYPE: item.PROP_TYPE,
      });

      if (item.PROP_TYPE === "options") {
        const options = itemDataOptions;

        // console.log("CreateProtProp =", options)
        // ไปหา prop_id ของ table prop ด้วย prot_id,topic_id,PROP_TYPE

        const PropId = await getPropId(PROT_ID, TOPIC_ID, item.PROP_TYPE);
        // console.log("PropId =", PropId)
        //CLEAR OPTION
        const HandleClearOptionData = await clearOptionByPropId(
          PROT_ID,
          TOPIC_ID,
          PropId
        );

        // Save new Option
        const saveOptions = await CreateProtOption(
          dateNow,
          UID,
          OID,
          PROT_ID,
          TOPIC_ID,
          PropId,
          options
        );
      }

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("result updated prop = ", results);

    return;
  } catch (error) {
    console.error("Error updated topic property:", error);
    throw error; // Handle the error according to your application's needs
  }
};

//get prop_id
const getPropId = async (PROT_ID, TOPIC_ID, PROP_TYPE) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prop/select/getPropIdByProtId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: PROT_ID,
      S_TOPIC_ID: TOPIC_ID,
      S_PROP_TYPE: PROP_TYPE,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData.PROP_ID; // Extracting only PROP_ID
    });

    return rows[0];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// clear option  by id prop
const clearOptionByPropId = async (PROT_ID, TOPIC_ID, PROP_ID) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/option/delete/deletePropByPropIdAndTopicIdAndPropId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute
    const result = await connection.execute(sql, {
      S_PROT_ID: PROT_ID,
      S_TOPIC_ID: TOPIC_ID,
      S_PROP_ID: PROP_ID,
    });

    // Wait for the execute operation to complete
    await connection.commit();
    // console.log("Deleted topics:", result);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// insert topic new
const InsertTopicByProtId = async (PROT_ID, UID, OID, dateNow, topicsNew) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/insert/saveTopic.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = topicsNew.map(async (item) => {
      // const genTopicID = generateRandomNumber3Digit()
      const genTopicID = genUid15Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: PROT_ID,
        S_TOPIC_ID: genTopicID,
        S_TOPIC_TYPE: item.type,
        S_TOPIC_NO: item.TOPIC_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: UID,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: UID,
        S_UPDATE_OID: OID,
      });

      // ถ้า type topic = TableField
      if (item.type === "TableField") {
        const propObjects = [];

        // Process Rows
        // Process Rows
        if (item.extraAttributes.Rows) {
          const rowsEntries = item.extraAttributes.Rows.map((row) => ({
            PROP_TYPE: "Rows",
            PROP_NO: row.ROW_NO,
            DESC: row.ROW_DESC,
            PROP_LIST: "",
            ExtraType: row.ExtraType,
          }));

          propObjects.push(...rowsEntries);
        }

        // Process Columns
        if (item.extraAttributes.Columns) {
          const columnsEntries = item.extraAttributes.Columns.map((column) => ({
            PROP_TYPE: "Columns",
            PROP_NO: column.COL_NO,
            DESC: column.COL_DESC,
            PROP_LIST: column.Type,
            Dropdown: column.Dropdown,
          }));

          propObjects.push(...columnsEntries);
        }

        // console.log("TableField => propObjects= ", propObjects);
        // save prop  type table field

        // console.log("item.extraAttributes = ", item.extraAttributes)
        await CreateProtPropTableField(
          dateNow,
          UID,
          OID,
          PROT_ID,
          genTopicID,
          propObjects
        );

        // case type label
        if (item.extraAttributes) {
          const labelObject = Object.entries(item.extraAttributes).map(
            ([key, value]) => {
              if (key === "label") {
                value = value;
              }

              return {
                PROP_TYPE: key,
                PROP_VALUE: value,
              };
            }
          );

          // console.log(labelObject)
          const filteredLabelObject = labelObject.filter(
            (obj) => obj.PROP_TYPE === "label"
          );
          // console.log(filteredLabelObject);
          const itemDataEmpty = [];
          const saveProp = await CreateProtProp(
            dateNow,
            UID,
            OID,
            PROT_ID,
            genTopicID,
            filteredLabelObject,
            itemDataEmpty
          );
        }
      } else if (item.type === "SelectDBField") {
        // console.log("SelectDBField type")

        // console.log(item)

        if (item.extraAttributes) {
          // Add extra attributes to the topicAttributes
          // Object.assign(topicAttributes, item.extraAttributes);

          const propObjects = Object.entries(item.extraAttributes).map(
            ([key, value]) => {
              if (key === "required") {
                value = value ? "T" : "F";
              }

              return {
                PROP_TYPE: key,
                PROP_VALUE: value,
              };
            }
          );

          const itemDataOptions = item.extraAttributes;

          // console.log(",propObjects= ", propObjects)
          const filteredPropObjects = propObjects.filter(
            (entry) =>
              entry.PROP_TYPE !== "columns" && entry.PROP_TYPE !== "headColumns"
          );
          // console.log(",filteredPropObjects= ", filteredPropObjects)

          // table field
          // console.log(",table = ", item.extraAttributes)

          const saveProp = await CreateProtProp(
            dateNow,
            UID,
            OID,
            PROT_ID,
            genTopicID,
            filteredPropObjects,
            itemDataOptions
          );
        }
      } else {
        if (item.extraAttributes) {
          // Add extra attributes to the topicAttributes
          // Object.assign(topicAttributes, item.extraAttributes);
          let itemDataOptions;
          const propObjects = Object.entries(item.extraAttributes).map(
            ([key, value]) => {
              if (key === "required") {
                value = value ? "T" : "F";
              }
              if (key === "options") {
                itemDataOptions = value;
                value = "options";
              }
              return {
                PROP_TYPE: key,
                PROP_VALUE: value,
              };
            }
          );

          // const itemDataOptions = item.extraAttributes;
          // console.log(",itemDataOptions= ", itemDataOptions)
          // console.log(",propObjects= ", propObjects)

          // table field
          // console.log(",table = ", item.extraAttributes)

          const saveProp = await CreateProtProp(
            dateNow,
            UID,
            OID,
            PROT_ID,
            genTopicID,
            propObjects,
            itemDataOptions
          );
        }
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

const CreateProtPropTableField = async (
  dateNow,
  UID,
  OID,
  PROT_ID,
  genTopicID,
  extraAttributes
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prop/insert/savePropTablefield.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // console.log("Transformed props =", extraAttributes);

    // Execute the main checklist update
    const promises = extraAttributes.map(async (item) => {
      // const genPropID = generateRandomNumber3Digit()
      const genPropID = genUid15Digit();

      finalResult = await connection.execute(sql, {
        S_PROT_ID: PROT_ID,
        S_TOPIC_ID: genTopicID,
        S_PROP_ID: genPropID,
        S_PROP_TYPE: item.PROP_TYPE,
        S_PROP_VALUE: item.DESC,
        S_PROP_LIST: item.PROP_LIST,
        S_PROP_NO: item.PROP_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: UID,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: UID,
        S_UPDATE_OID: OID,
      });

      if (item.PROP_LIST === "dropdown") {
        //     const options = itemDataOptions;
        //     // console.log("CreateProtProp =", options)

        // console.log("save dropdown to option table")

        if (item.Dropdown) {
          const formattedOptions = item.Dropdown.map((option) => ({
            OPTION_DESC: option.value,
            OPTION_NO: option.no,
          }));

          // console.log("item.Dropdown=", item.Dropdown)
          // console.log("formattedOptions=", formattedOptions)
          const saveOptions = await CreateProtOption(
            dateNow,
            UID,
            OID,
            PROT_ID,
            genTopicID,
            genPropID,
            formattedOptions
          );
        }
      }

      // ถ้า Row มี  ค่า ExtraType  ให้บันทึกลง db Extra
      if (item.PROP_TYPE === "Rows" && item.ExtraType) {
        // console.log("ExtraType = ", item.ExtraType)
        await InsertExtra(
          dateNow,
          UID,
          OID,
          PROT_ID,
          genTopicID,
          genPropID,
          item.ExtraType
        );
      }

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("result DYMCHK_PROT_PROP = ", results);

    return;
  } catch (error) {
    console.error("Error creating topic property type tablefield:", error);
    throw error; // Handle the error according to your application's needs
  }
};

const InsertExtra = async (
  dateNow,
  UID,
  OID,
  PROT_ID,
  genTopicID,
  genPropID,
  extraList
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/extra/insert/saveExtra.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // console.log("extraList= ", extraList)
    // Execute the main checklist update
    const promises = extraList.map(async (item) => {
      // const genExtraID = generateRandomNumber3Digit()
      const genExtraID = genUid15Digit();
      finalResult = await connection.execute(sql, {
        S_PROT_ID: PROT_ID,
        S_TOPIC_ID: genTopicID,
        S_PROP_ID: genPropID,
        S_EXTRA_ID: genExtraID,
        S_EXTRA_TYPE: item.EXTRA_TYPE_TITLE,
        S_EXTRA_DESC: item.valueText,
        S_EXTRA_NO: item.EXTRA_TYPE_NO,
        S_CR_DATE: dateNow,
        S_CR_UID: UID,
        S_CR_OID: OID,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_UID: UID,
        S_UPDATE_OID: OID,
      });

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("result DYMCHK_PROT_OPTION = ", results);
    return;
  } catch (error) {
    console.error("Error creating row extra:", error);
    throw error; // Handle the error according to your application's needs
  }
};

//delete topic
const DeleteTopic = async (protId, topics) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/topic/delete/deleteTopicById.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = topics.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_PROT_ID: protId,
        S_TOPIC_ID: item.id,
      });

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("delete topic old", results)
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
//delete Prop
const DeleteProp = async (protId, topics) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prop/delete/deletePropByProtIdAndTopicId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = topics.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_PROT_ID: protId,
        S_TOPIC_ID: item.id,
      });

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("delete prop old", results)
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
//delete option

const DeleteOption = async (protId, topics) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/option/delete/deleteOptionByProtIdAndTopicId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = topics.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_PROT_ID: protId,
        S_TOPIC_ID: item.id,
      });

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("delete option old", results)
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const DeleteExtra = async (protId, topics) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/extra/delete/deleteExtra.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = topics.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_PROT_ID: protId,
        S_TOPIC_ID: item.id,
      });

      return finalResult;
    });

    const results = await Promise.all(promises);
    await connection.commit();
    // console.log("delete option old", results)
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

//clear Topics
const ClearTopics = async (protId) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/topic/delete/deleteTopicByProtId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // Wait for the execute operation to complete
    await connection.commit();

    // console.log("Deleted topics:", result);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to clear topics");
  }
};

const ClearProps = async (protId) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/prop/delete/deletePropByProtId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // Wait for the execute operation to complete
    await connection.commit();

    // console.log("Deleted prop:", result);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to clear topics");
  }
};

const ClearOptions = async (protId) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/option/delete/deleteOptionByProtId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // Wait for the execute operation to complete
    await connection.commit();

    // console.log("Deleted option:", result);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to clear topics");
  }
};

const ClearExtra = async (protId) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/extra/delete/deleteExtraByProtId.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // Wait for the execute operation to complete
    await connection.commit();

    // console.log("Deleted option:", result);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to clear Extra");
  }
};

//GET FORMS
const getForms = async (req, res) => {
  try {
    const { userId } = req.body;
    // console.log("getForms", userId);

    if (!userId)
      return res.status(400).json({ message: "Missing required fields." });

    const isoMaster = await getCheckISOMaster();
    const isoDar = await getCheckISODar();
    // console.log(isoMaster)
    // console.log(isoDar.length)

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getForms.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_CR_UID: userId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      // ใส่ค่า DYMC_FLAG จาก isoMaster โดยใช้ ISO_DOC_CODE และ ISO_DOC_REVISION
      const { ISO_DOC_CODE, ISO_DOC_REVISION } = rowData;
      const matchingIso = isoMaster.find(
        (iso) =>
          iso.DOC_CODE == ISO_DOC_CODE && iso.DOC_REVISION == ISO_DOC_REVISION
      );
      rowData.DYMC_FLAG = matchingIso ? matchingIso.DYMC_FLAG : "";

      const matchingIsoDar = isoDar.find(
        (iso) =>
          iso.DOC_CODE == ISO_DOC_CODE && iso.DOC_REVISION == ISO_DOC_REVISION
      );
      rowData.DAR_STATUS = matchingIsoDar ? matchingIsoDar.DAR_STATUS : "";
      // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
      rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ
      return rowData;
    });

    const formattedData = formatDataGetForms(rows);
    // เรียงลำดับข้อมูลตาม createdAt โดยเรียงจากมากไปน้อย
    const sortedData = formattedData.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    // console.log(formattedData)
    res.status(200).json(sortedData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form list data");
  }
};

const getCheckISOMaster = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getISOMaster.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);

    // ปิดการเชื่อมต่อ
    await connection.close();

    // console.log(result.rows)
    // console.log(result.rows.length)
    if (!result.rows || result.rows.length === 0) {
      return []; // ถ้าไม่มี rows ให้ส่ง [] ออกไป
    }

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

const getCheckISODar = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getISODar.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);

    // ปิดการเชื่อมต่อ
    await connection.close();

    // console.log(result.rows)
    // console.log(result.rows.length)
    if (!result.rows || result.rows.length === 0) {
      return []; // ถ้าไม่มี rows ให้ส่ง [] ออกไป
    }

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

const getCheckISOMasterByDoc = async (doc, revision) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getISOMasterByDoc.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_DOC_CODE: doc,
      S_DOC_REVISION: revision,
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

const getCheckISODarByDoc = async (doc, revision) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getISOMasterByDoc.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_DOC_CODE: doc,
      S_DOC_REVISION: revision,
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

//เเก้ เอาform and Topic มาด้วย
const GetFormById = async (req, res) => {
  try {
    const { userId, formId } = req.body;

    if (!userId || !formId)
      return res.status(400).json({ message: "Missing required fields." });
    // console.log("test")
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form/select/getFormById.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql, {
      S_CR_UID: userId,
      S_PROT_ID: formId,
    });
    await connection.close();

    const rows = await Promise.all(
      result.rows.map(async (row, index) => {
        const rowData = {};
        result.metaData.forEach(
          (meta, index) => (rowData[meta.name] = row[index])
        );
        const { ISO_DOC_CODE, ISO_DOC_REVISION } = rowData;
        const iso = await getCheckISOMasterByDoc(
          ISO_DOC_CODE,
          ISO_DOC_REVISION
        );
        rowData.DYMC_FLAG = iso?.DYMC_FLAG || "";
        const isoDar = await getCheckISODarByDoc(
          ISO_DOC_CODE,
          ISO_DOC_REVISION
        );
        rowData.DAR_STATUS = isoDar?.DAR_STATUS || "";
        rowData.ID = index + 1;
        return rowData;
      })
    );

    const TopicData = await GetTopicByFormId(formId);
    const formattedData = formatDataForm(rows, TopicData);
    // console.log(formattedData)
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
          // console.log("RowSortNo=", RowSortNo)

          rowData.extraAttributes = {
            ...rowData.extraAttributes, // Keep existing properties in extraAttributes
            Rows: formatDataRows(RowSortNo),
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

    // console.log(formattedData)
    return rows;
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

//FORMATTED DATA
const formatDataGetForms = (data) => {
  // console.log(data)
  return data.map((item) => {
    const codeRev = item.FORM_CODE
      ? `${item.FORM_CODE}/${item.FORM_REVISION}`
      : item.ISO_DOC_CODE
      ? `${item.ISO_DOC_CODE}/${item.ISO_DOC_REVISION}`
      : "";
    return {
      id: item.PROT_ID,
      userId: item.CR_UID,
      createdAt: !item.UPDATE_DATE ? item.CR_DATE : item.UPDATE_DATE,
      published: false,
      name: item.FORM_TITLE,
      description: item.FORM_DESC,
      APPV_FLAG: item.APPV_FLAG,
      FORM_CODE: item.FORM_CODE,
      FORM_REVISION: item.FORM_REVISION,
      ISO_DOC_CODE: item.ISO_DOC_CODE,
      ISO_DOC_REVISION: item.ISO_DOC_REVISION,
      CANCEL_FLAG: item.CANCEL_FLAG,
      CODE_REV: codeRev.trim(),
      DYMC_FLAG: item.DYMC_FLAG,
      DAR_STATUS: item.DAR_STATUS,
    };
  });
};

const formatDataForm = (data, topic) => {
  return data.map((item) => {
    return {
      id: item.PROT_ID,
      FORM_CODE: item.FORM_CODE,
      FORM_REVISION: item.FORM_REVISION,
      // FORM_TITLE: item.FORM_TITLE,
      // FORM_DESC: item.FORM_DESC,
      ISO_DOC_CODE: item.ISO_DOC_CODE,
      ISO_DOC_REVISION: item.ISO_DOC_REVISION,
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
      DYMC_FLAG: item.DYMC_FLAG,
      DAR_STATUS: item.DAR_STATUS,
      CODE_REV: (item.FORM_CODE
        ? `${item.FORM_CODE}/${item.FORM_REVISION}`
        : item.ISO_DOC_CODE
        ? `${item.ISO_DOC_CODE}/${item.ISO_DOC_REVISION}`
        : ""
      ).trim(),
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

const formatDataProp = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      TOPIC_ID: item.TOPIC_ID,
      PROP_ID: item.PROP_ID,
      PROP_TYPE: item.PROP_TYPE,
      PROP_VALUE:
        item.PROP_TYPE === "height" || item.PROP_TYPE === "width"
          ? +item.PROP_VALUE
          : item.PROP_VALUE,
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

const formatDataExtra = (data) => {
  // console.log(data)

  return data.map((item) => {
    return {
      EXTRA_TYPE_NO: item.EXTRA_NO,
      EXTRA_TYPE_ID: item.EXTRA_ID,
      EXTRA_TYPE_TITLE: item.EXTRA_TYPE,
      valueText: item.EXTRA_DESC,
    };
  });
};

const formatDataRows = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      ROW_DESC: item.PROP_VALUE,
      ROW_NO: +item.PROP_NO,
      // ROW_PROP_ID: item.PROP_ID,
      ExtraType: item.ExtraType || [],
    };
  });
};
const formatDataColumns = (data) => {
  return data.map((item) => {
    return {
      COL_DESC: item.PROP_VALUE,
      COL_NO: +item.PROP_NO,
      // COL_PROP_ID: item.PROP_ID,
      Type: item.PROP_LIST,
      Dropdown: item.Dropdown || [],
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

module.exports = {
  CreateForm,
  getForms,
  GetFormById,
  CreateProtTopic,
  UpdateTitleFormById,
  CreateAndUpdateProtTopic,
  UpdateCancelFlagFormById,
  UpdateCancelFlagFormUserById,
};
