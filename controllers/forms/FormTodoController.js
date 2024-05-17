const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");
const {
  generateFormId,
  genUid,
  generateRandomNumber3Digit,
} = require("../../utils/genId");
const { statusFormUser } = require("../../utils/status");

const createTodoForm = async (req, res) => {
  try {
    const { PROT_ID, START_DATE, END_DATE, REQ_USER_FLAG, UID, OID, users } =
      req.body;

    if (!PROT_ID || !START_DATE || !END_DATE || !UID || !OID)
      return res.status(400).json({ message: "Missing required fields." });

    const countUsers = users.length > 0;
    if (REQ_USER_FLAG && !countUsers)
      return res.status(400).json({ message: "users required." });

    console.log(req.body);

    const dateNow = new Date();
    // console.log(" dateNow", dateNow)

    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/insert/insertFormNew.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const docId = await generateFormId();
    // console.log("docId=", docId);
    // console.log("PROT_ID=", PROT_ID);
    const genURL = genUid();

    const newStartDate = new Date(START_DATE);
    const newEndDate = new Date(END_DATE);

    const result = await connection.execute(sql, {
      S_FORM_ID: docId,
      S_PROT_ID: PROT_ID,
      S_URL: genURL,
      S_START_DATE: newStartDate,
      S_END_DATE: newEndDate,
      S_REQ_USER_FLAG: REQ_USER_FLAG ? "T" : "F",
      S_CANCEL_FLAG: "F",
      S_CR_DATE: dateNow,
      S_CR_UID: UID,
      S_CR_OID: OID,
    });

    await connection.commit();
    if (REQ_USER_FLAG && countUsers) {
      // save DYMCHK_FORM_USER
      // console.log(" save DYMCHK_FORM_USER")
      // console.log("  user", users)

      await createFormUser(docId, dateNow, UID, OID, users, PROT_ID);
    }

    res.status(200).json({ message: "Save Form  Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const createFormUser = async (docId, dateNow, UID, OID, users, PROT_ID) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/insert/insertFormUserNew.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // หา topics
    const dataTopics = await getTopicsByProtID(PROT_ID);
    // console.log("dataTopics=", dataTopics)
    // users = [ '660064', '660065', '660066', '660067', '660069' ]
    // Execute the main checklist update
    const promises = users.map(async (item) => {
      const genID = generateRandomNumber3Digit();

      // console.log(item)
      // console.log(genID)
      // console.log(dateNow)
      finalResult = await connection.execute(sql, {
        S_FORM_ID: docId,
        S_SEQ: genID,
        S_USER_ID: item,
        S_CR_DATE: dateNow,
        S_CR_UID: UID,
        S_CR_OID: OID,
        S_CANCEL_FLAG: "F",
        S_STATUS: statusFormUser.todo.message,
      });

      if (dataTopics) {
        // create ข้อ ไว้รอ ให้ทำ
        await createFormValue(
          docId,
          genID,
          dateNow,
          UID,
          OID,
          dataTopics,
          PROT_ID
        );
      }

      return finalResult;
    });

    // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    // console.log("save users = ", results);
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error to be caught in the calling function
  }
};

const createFormValue = async (
  docId,
  SEQ_ID,
  dateNow,
  UID,
  OID,
  dataTopics,
  PROT_ID
) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/insert/insertFormValue.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const filterDataTopics = dataTopics.filter(
      (obj) =>
        obj.TOPIC_TYPE === "TextField" ||
        obj.TOPIC_TYPE === "NumberField" ||
        obj.TOPIC_TYPE === "TextAreaField" ||
        obj.TOPIC_TYPE === "DateField" ||
        obj.TOPIC_TYPE === "TimeField" ||
        obj.TOPIC_TYPE === "SelectField" ||
        obj.TOPIC_TYPE === "CheckboxField" ||
        obj.TOPIC_TYPE === "RadioField" ||
        obj.TOPIC_TYPE === "TableField" ||
        obj.TOPIC_TYPE === "SelectDBField" ||
        obj.TOPIC_TYPE === "SingleChoiceField" ||
        obj.TOPIC_TYPE === "ImageField" ||
        obj.TOPIC_TYPE === "FileUploadField" ||
        obj.TOPIC_TYPE === "ApprovalField" ||
        obj.TOPIC_TYPE === "StaticSelectDBField"
    );

    // console.log("form filterDataTopics = ", filterDataTopics)

    const promises = filterDataTopics.map(async (item) => {
      // const RowId = item.TOPIC_TYPE === "TableField" ? "" : 0
      if (item.TOPIC_TYPE === "TableField") {
        // console.log("docId = ", PROT_ID)

        const PropData = await getPropsByTopicId(PROT_ID, item.TOPIC_ID);
        const filterPropRows = PropData.filter(
          (obj) => obj.PROP_TYPE === "Rows"
        );
        const filterPropColumns = PropData.filter(
          (obj) => obj.PROP_TYPE === "Columns"
        );

        // console.log("filterPropRows = ", filterPropRows)
        // console.log("filterPropColumns = ", filterPropColumns)
        createRowAndColumnValue(
          docId,
          SEQ_ID,
          dateNow,
          UID,
          OID,
          filterPropRows,
          filterPropColumns
        );
      } else {
        finalResult = await connection.execute(sql, {
          S_FORM_ID: docId,
          S_SEQ: SEQ_ID,
          S_TOPIC_ID: item.TOPIC_ID,
          S_ROW_ID: 0,
          S_COL_ID: 0,
          S_CR_DATE: dateNow,
          S_CR_UID: UID,
          S_CR_OID: OID,
        });

        return finalResult;
      }
    });

    // // Wait for all execute operations to complete
    const results = await Promise.all(promises);
    await connection.commit();

    return;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error to be caught in the calling function
  }
};

const createRowAndColumnValue = async (
  docId,
  SEQ_ID,
  dateNow,
  UID,
  OID,
  rows,
  columns
) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/insert/insertFormValue.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // console.log(rows)
    // console.log(columns)

    // console.log("user SEQ_ID = ", SEQ_ID)
    for (const row of rows) {
      // console.log("rows");
      // console.log("row id = ", row.PROP_ID);

      const promises = columns.map(async (col) => {
        // console.log("columns");

        const finalResult = await connection.execute(sql, {
          S_FORM_ID: docId,
          S_SEQ: SEQ_ID,
          S_TOPIC_ID: row.TOPIC_ID,
          S_ROW_ID: row.PROP_ID,
          S_COL_ID: col.PROP_ID,
          S_CR_DATE: dateNow,
          S_CR_UID: UID,
          S_CR_OID: OID,
        });

        return finalResult;
      });

      // Wait for all execute operations for the current row to complete
      await Promise.all(promises);
    }

    // // Wait for all execute operations to complete

    await connection.commit();

    return;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error to be caught in the calling function
  }
};

const getPropsByTopicId = async (PROT_ID, TOPIC_ID) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getPropByTopicId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: PROT_ID,
      S_TOPIC_ID: TOPIC_ID,
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

const getTopicsByProtID = async (PROT_ID) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getTopicsByProtId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: PROT_ID,
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

const getStatusForForm = (formId, tasks, endDate) => {
  // หา tasks ที่เกี่ยวข้องกับ FORM_ID
  const relatedTasks = tasks.filter((task) => task.FORM_ID === formId);
  if (relatedTasks.length > 0) {
    // ตรวจสอบว่าทุกรายการใน relatedTasks มี STATUS เป็น 'เสร็จ' หรือไม่
    const allTasksCompleted = relatedTasks.every(
      (task) => task.STATUS === "เสร็จ"
    );
    // หา tasks ที่มี STATUS เป็น 'กำลังทำ'
    const allTasksPending = relatedTasks.filter(
      (task) => task.STATUS === "กำลังทำ"
    );
    const someOneTasksCompleted = relatedTasks.filter(
      (task) => task.STATUS === "เสร็จ"
    );
    const someOneTasksWait = relatedTasks.filter(
      (task) => task.STATUS === "รอ"
    );

    if (allTasksCompleted) {
      return "เสร็จ";
    } else if (new Date(endDate) >= new Date() && allTasksPending.length > 0) {
      return "กำลังทำ";
    } else if (new Date(endDate) >= new Date() && someOneTasksWait.length > 0) {
      return "รอ";
    } else if (
      new Date(endDate) <= new Date() &&
      someOneTasksCompleted.length > 0
    ) {
      return "เสร็จ";
    } else if (new Date(endDate) <= new Date()) {
      return "หมดเวลา";
    } else {
      return "รอ";
    }
  } else {
    return "รอ";
  }
};

const getListFormTodo = async (req, res) => {
  try {
    const { protId } = req.body;
    if (!protId) return res.status(400).json({ message: "userId required." });
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getForm.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    // // ปิดการเชื่อมต่อ
    // await connection.close();

    const tasks = await getTaskForListTodo();
    // const criterias = await getCriteriasByProtId(protId);

    const rows = await Promise.all(
      result.rows.map(async (row, index) => {
        const rowData = {};
        result.metaData.forEach((meta, index) => {
          rowData[meta.name] = row[index];
        });
        rowData.CODE_REV = (
          rowData.FORM_CODE
            ? `${rowData.FORM_CODE}/${rowData.FORM_REVISION}`
            : rowData.ISO_DOC_CODE
            ? `${rowData.ISO_DOC_CODE}/${rowData.ISO_DOC_REVISION}`
            : ""
        ).trim();

        if (rowData.CANCEL_FLAG === "T") {
          rowData.STATUS = "ยกเลิก";
        } else {
          rowData.STATUS = getStatusForForm(
            rowData.FORM_ID,
            tasks,
            rowData.END_DATE
          );
        }

        // Call getCriterias to fetch criteria data
        rowData.criteriasSearch = await getCriterias(rowData.FORM_ID, protId); // Using await inside Promise.all

        return rowData;
      })
    );

    // Sort the formatted data by CR_DATE in descending order
    const sortedData = rows.sort((a, b) => {
      const dateA = new Date(a.CR_DATE);
      const dateB = new Date(b.CR_DATE);
      return dateB - dateA;
    });

    res.status(200).json(sortedData);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const getCriterias = async (formId, protId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getCriteriaTopic.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FORM_ID: formId,
    });

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData;
    });

    // Filter out duplicate objects based on TOPIC_ID
    const uniqueRows = rows.reduce((acc, current) => {
      const x = acc.find((item) => item.TOPIC_ID === current.TOPIC_ID);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    const topicSubs = await getCriteriasTopicSub(protId);
    const topicValues = await getCriteriasTopicValue(formId);

    // console.log(topicValues);

    const newRows = uniqueRows.map((row) => {
      const topicSub = topicSubs.find(
        (topic) => topic.TOPIC_ID === row.TOPIC_ID
      );
      const topicValue = topicValues.find(
        (topic) => topic.TOPIC_ID === row.TOPIC_ID
      );

      let newRow = { ...row };

      if (topicSub) {
        newRow.PROP_TYPE = topicSub.PROP_TYPE;
        newRow.SQL_NO = topicSub.SQL_NO;
        newRow.SQL_DESC = topicSub.SQL_DESC;
      } else {
        newRow.PROP_TYPE = "";
        newRow.SQL_NO = "";
        newRow.SQL_DESC = "";
      }

      if (topicValue) {
        newRow.TOPIC_VALUE = topicValue.TOPIC_VALUE;
      } else {
        newRow.TOPIC_VALUE = "";
      }

      return newRow;
    });

    return newRows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getCriteriasTopicSub = async (protId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getCriteriaTopicSub.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

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

const getCriteriasTopicValue = async (formId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getCriteriaTopicValue.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FORM_ID: formId,
    });

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

const getCriteriasByProtId = async (req, res) => {
  try {
    const { protId } = req.body;
    if (!protId) return res.status(400).json({ message: "userId required." });
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getCriteria.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROT_ID: protId,
    });

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData;
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};
const getTaskForListTodo = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getFormTasks.sql"
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

      return rowData;
    });

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getListUsersFormTodo = async (req, res) => {
  try {
    const { formId } = req.body;
    if (!formId) return res.status(400).json({ message: "formId required." });
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getFormUsers.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FORM_ID: formId,
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

    const formattedRows = await Promise.all(
      rows.map(async (row) => {
        const portId = row.PROT_ID;
        const SEQ = row.SEQ;

        const contentData = await getFormContentPreview(portId, formId, SEQ);
        const newCriteriaItems = contentData.filter(
          (item) => item.type === "SelectDBField"
        );
        return {
          ...row,
          content: contentData || [],
          criteriaItem: newCriteriaItems.length > 0 ? newCriteriaItems : [],
        };
      })
    );

    res.status(200).json(formattedRows);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

//get content result view and  value to show
const getFormContentPreview = async (portId, formId, SEQ) => {
  try {
    // หาค่า topic db
    const TopicData = await GetTopicByFormId(portId, formId, SEQ);

    return TopicData;
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching form view and value data");
  }
};

// Function to get authorized person approves
const getAuthorizedPersonApprove = async (userId) => {
  try {
    // Connect to the database
    const connection = await connectToDatabase();

    // Read the SQL file
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getAuthorizedPersonApprove.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute SQL query
    const result = await connection.execute(sql, { S_USER_ID: userId });

    // Close the database connection
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    // Map the rows to objects
    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
// get content show form topic todo

const GetApprovalFieldByUser = async (formId, seq, userId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/task/getApprovalByUserField.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_USER_ID: userId,
      S_FORM_ID: formId,
      S_SEQ: seq,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = await Promise.all(
      result.rows.map(async (row, index) => {
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

// Function to get form for approval contents by URL
const getFormForApprovalContentsByUrl = async (req, res) => {
  try {
    // Destructure request body
    const { userId, form_id, OID, seq } = req.body;

    // Validate request parameters
    if (!form_id || !userId || !OID || !seq)
      return res.status(400).json({ message: "Required field missing." });

    // Get authorized person approves
    const userAuthApprove = await getAuthorizedPersonApprove(userId);
    // console.log("userAuthApprove", userAuthApprove);

    const usersApprovalField = await GetApprovalFieldByUser(
      form_id,
      seq,
      userId
    );
    // console.log("usersApprovalField", usersApprovalField);

    // Extract role_id and topicId
    const { FORM_ROLE_NO: role_id, TOPIC_ID: topicId } =
      userAuthApprove[0] || {};

    // // Validate authorization
    // if (!role_id || !topicId)
    //   return res.status(400).json({ message: "Authorization data missing." });

    // Validate authorization if usersApprovalField does not exist
    if (!usersApprovalField && (!role_id || !topicId))
      return res.status(400).json({ message: "Authorization data missing." });
    // console.log("role_id", role_id);
    // console.log("topicId", topicId);

    // Connect to the database
    const connection = await connectToDatabase();

    // Read the SQL file
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getFormApprovalById.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute SQL query
    const result = await connection.execute(sql, {
      S_FORM_ID: form_id,
      S_SEQ: seq,
    });

    // Close the database connection
    await connection.close();

    // Map the rows to objects
    const dataForm = result.rows.map((row) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      return rowData;
    })[0];

    // Validate form data
    if (!dataForm)
      return res.status(400).json({ message: "Form data not found." });

    // Get topic data
    const TopicData = await GetTopicByFormId(
      dataForm.PROT_ID,
      dataForm.FORM_ID,
      dataForm.SEQ
    );

    // console.log("TopicData=", TopicData);

    // Modify the topic data
    const newTopicData = TopicData.map((item) => ({
      ...item,
      is_approval: item.type === "ApprovalField" && item.id === topicId,
    }));
    // console.log(dataForm);
    // Send response
    res.status(200).json({ ...dataForm, content: newTopicData });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const getFormContentsByUrl = async (req, res) => {
  try {
    const { userId, formUrl, OID } = req.body;

    if (!formUrl || !userId)
      return res.status(400).json({ message: "formUrl or userId required." });

    // console.log(userId)

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getFormByUrl.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_URL: formUrl,
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

    const formattedData = rows[0];
    // console.log("formattedData=", formattedData);

    // เช็คว่า req user ที่ทำเเบบฟอร์ม ไหม
    if (formattedData.REQ_USER_FLAG === "T") {
      const users = await getFormUserByUrl(formUrl);
      // console.log(formattedData.REQ_USER_FLAG)

      // console.log(users)
      // นำ user ที่ login มาเช็คกับ user ที่ assign ไว้ ว่ามีตรงกันไหม ถ้ามีถึงจะทำได้
      const userWithId = users.find((user) => user.USER_ID === userId);
      if (!userWithId)
        return res
          .status(400)
          .json({ message: "คุณไม่มีสิทธิ์ทำแบบฟอร์มนี้." });
      // console.log(userWithId)
      const portId = userWithId.PROT_ID;
      const formId = userWithId.FORM_ID;
      const SEQ = userWithId.SEQ;

      // หาค่า topic db
      //1 get topic
      const TopicData = await GetTopicByFormId(portId, formId, SEQ);
      // console.log("1 =", userWithId);

      const newFormatted = {
        ...userWithId,
        content: TopicData,
      };

      res.status(200).json(newFormatted);
    } else {
      // กรณีที่ ไม่ required user
      const PortData = await getPortByURL(formUrl);
      if (!PortData)
        return res.status(400).json({ message: "PortData not found." });
      // console.log("PortData= ", PortData)

      const users = await getFormUserByUrl(formUrl);
      // console.log("users= ", users)

      // นำ user ที่ login มาเช็คกับ user ที่ assign ไว้ ว่ามีตรงกันไหม ถ้ามีถึงจะทำได้
      const userWithId = users.find((user) => user.USER_ID === userId);
      // if (!userWithId) return res.status(400).json({ message: "คุณไม่มีสิทธิ์ทำแบบฟอร์มนี้." });

      // ไม่มีข้ออยู่ เเล้วต้องสร้างใหม่
      if (!userWithId) {
        const formIdOnly = PortData.FORM_ID;
        const portIdOnly = PortData.PROT_ID;
        const dateNow = new Date();
        const seqId = await createFormUserOnly(
          formIdOnly,
          dateNow,
          userId,
          OID,
          userId,
          portIdOnly
        );
        if (!seqId)
          return res.status(400).json({ message: "seqId not found." });

        // console.log("PortData=", PortData);

        const newFormattedData = {
          FORM_ID: formIdOnly,
          SEQ: seqId,
          URL: PortData.URL,
          USER_ID: userId,
          REQ_USER_FLAG: PortData.REQ_USER_FLAG,
          PROT_ID: portIdOnly,
          START_DATE: PortData.START_DATE,
          END_DATE: PortData.END_DATE,
        };

        // get topic
        const TopicData = await GetTopicByFormId(portIdOnly, formIdOnly, seqId);
        //get topics
        const newFormatted = {
          ...newFormattedData,
          content: TopicData,
        };
        res.status(200).json(newFormatted);
      } else {
        const portId = userWithId.PROT_ID;
        const formId = userWithId.FORM_ID;
        const SEQ = userWithId.SEQ;
        // get topic
        const TopicData = await GetTopicByFormId(portId, formId, SEQ);
        // console.log("มีข้อไม่ต้องสร้างใหม่=", userWithId)

        //get topics
        const newFormatted = {
          ...userWithId,
          content: TopicData,
        };

        res.status(200).json(newFormatted);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const getPortByURL = async (url) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getProtByUrl.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_URL: url,
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

const createFormUserOnly = async (
  formId,
  dateNow,
  UID,
  OID,
  userId,
  PROT_ID
) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/insert/insertFormUserNew.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // หา topics
    const dataTopics = await getTopicsByProtID(PROT_ID);

    // console.log("dataTopics=", dataTopics)
    // console.log("createFormUserOnly=", )
    const genID = generateRandomNumber3Digit();
    // Execute the main checklist update
    const result = await connection.execute(sql, {
      S_FORM_ID: formId,
      S_SEQ: genID,
      S_USER_ID: userId,
      S_CR_DATE: dateNow,
      S_CR_UID: UID,
      S_CR_OID: OID,
      S_CANCEL_FLAG: "F",
      S_STATUS: statusFormUser.todo.message,
    });

    await connection.commit();

    if (dataTopics) {
      // create ข้อ ไว้รอ ให้ทำ
      await createFormValue(
        formId,
        genID,
        dateNow,
        UID,
        OID,
        dataTopics,
        PROT_ID
      );
    }

    // console.log("save users = ", results);
    return genID;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error to be caught in the calling function
  }
};

const getFormUserByUrl = async (formUrl) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/select/getFormUserByUrl.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_URL: formUrl,
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

//get Topic
const GetTopicByFormId = async (portId, formId, SEQ) => {
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
      S_PROT_ID: portId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const PropData = await getProp(portId);
    // console.log("Props data= ", PropData);

    const formValueData = await getListFormValue(formId, SEQ);

    // console.log("formId data= ", formId);
    // console.log("SEQ data= ", SEQ);
    // console.log("formValueData data= ", formValueData);

    const OptionData = await getOptions(portId);
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

            // หาค่า form value มาใส่
            const matchingDefaults = formValueData.filter(
              (Fvalue) =>
                Fvalue.FORM_ID === formId &&
                Fvalue.SEQ === SEQ &&
                Fvalue.TOPIC_ID === rowData.TOPIC_ID &&
                Fvalue.ROW_ID === "0" &&
                Fvalue.COL_ID === "0"
            );
            // console.log("test", matchingDefaults[0])
            if (rowData.TOPIC_TYPE !== "TableField") {
              const newValueDefault = matchingDefaults[0]
                ? matchingDefaults[0].TOPIC_VALUE
                : "";

              // console.log("test", newValueDefault);

              extraAttributes.defaultValue = newValueDefault;

              // add update_date and updateBy
              const newUpdateAtDefault = matchingDefaults[0]
                ? matchingDefaults[0].UPDATE_DATE
                : "";
              const newUpdateByDefault = matchingDefaults[0]
                ? matchingDefaults[0].UPDATE_UID
                : "";
              extraAttributes.updateAt = newUpdateAtDefault;
              extraAttributes.updateBy = newUpdateByDefault;
            }
          }
        });

        // console.log("rowData =", rowData)
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

          const matchingDefaultsRow = formValueData.filter(
            (Fvalue) =>
              Fvalue.FORM_ID === formId &&
              Fvalue.SEQ === SEQ &&
              Fvalue.TOPIC_ID === rowData.TOPIC_ID &&
              Fvalue.ROW_ID !== "0" &&
              Fvalue.COL_ID !== "0"
          );

          // console.log("matchingDefaultsRow=", matchingDefaultsRow)

          const RowSortNo = filteredPropRows.sort(
            (a, b) => a.PROP_NO - b.PROP_NO
          );

          const updatedRowSortNo = RowSortNo.map((row) => {
            const matchingRow = matchingDefaultsRow.filter(
              (match) => match.ROW_ID === row.PROP_ID
            );

            // console.log("row=", row)
            // console.log("matchingRow=", matchingRow)
            if (matchingRow) {
              return {
                ...row,
                DefaultData: formatDefaultValue(matchingRow),
              };
            }
            return row;
          });

          // console.log("updatedRowSortNo = ", updatedRowSortNo)

          const ColSortNo = filteredPropColumns.sort(
            (a, b) => a.PROP_NO - b.PROP_NO
          );

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
    // console.log("rows TopicSortNo=", TopicSortNo)

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

    const newSqlData = rows[0].SQL_STMT;
    if (!newSqlData) res.status(400).json("data not found!");
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

// get form value
const getListFormValue = async (formId, SEQ) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/formValue/select/getFormvalueBySEQ.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FORM_ID: formId,
      S_SEQ: SEQ,
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

// Update value form

const UpdateValueFormByUserId = async (req, res) => {
  try {
    const { formId, userId, OID, seq, data } = req.body;

    // console.log(req.body)

    if (!formId || !userId || !OID || !seq)
      return res.status(400).json({ message: "Missing required fields." });

    const dateNow = new Date();
    // console.log(" dateNow", dateNow)

    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/formValue/updated/updateFormValue.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const countdata = data.length > 0;

    if (countdata) {
      // Execute the main checklist update
      const promises = data.map(async (item) => {
        if (item.type === "TableField") {
          if (item.extraAttributes.valueTable) {
            await UpdateValueFormTypeTableField(
              formId,
              userId,
              OID,
              seq,
              item.extraAttributes.valueTable,
              dateNow,
              item.topicId
            );
          }
        } else {
          finalResult = await connection.execute(sql, {
            S_TOPIC_VALUE: item.extraAttributes.value,
            S_UPDATE_DATE: dateNow,
            S_UPDATE_OID: OID,
            S_UPDATE_UID: userId,
            S_FORM_ID: formId,
            S_SEQ: seq,
            S_TOPIC_ID: item.topicId,
          });
        }
        return finalResult;
      });

      // Wait for all execute operations to complete
      const results = await Promise.all(promises);
      await connection.commit();
    }

    //update status form user = in progress
    await UpdateStatusFormUser(formId, userId, OID, seq, dateNow);

    res.status(200).json({ message: "บันทึกข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error update data");
  }
};

const ClearRadioValue = async (formId, seq, data, dateNow, userId, OID) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/formValue/updated/clearFormValueRadio.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the main checklist update
    const promises = data.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_TOPIC_VALUE: "", //item.TOPIC_VALUE,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_OID: OID,
        S_UPDATE_UID: userId,
        S_TOPIC_ID: item.TOPIC_ID,
        S_COL_ID: item.COL_ID,
        S_ROW_ID: item.ROW_ID,
        S_SEQ: seq,
        S_FORM_ID: formId,
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

const getRadioByTopicId = async (formId, seq, topicId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/formValue/select/getFormValueRadio.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FORM_ID: formId,
      S_SEQ: seq,
      S_TOPIC_ID: topicId,
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

const UpdateValueFormTypeTableField = async (
  formId,
  userId,
  OID,
  seq,
  data,
  dateNow,
  topicId
) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/formValue/updated/updateFormValueTypeTable.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // console.log(data)
    // ไปหาค่า เก่า ที่ rowId เดียวกัน เเละ ให้เป็น ""
    const radios = await getRadioByTopicId(formId, seq, topicId);
    // console.log(radios)

    if (radios.length > 0) {
      await ClearRadioValue(formId, seq, radios, dateNow, userId, OID);
    }

    // Execute the main checklist update
    const promises = data.map(async (item) => {
      finalResult = await connection.execute(sql, {
        S_TOPIC_VALUE: item.value,
        S_UPDATE_DATE: dateNow,
        S_UPDATE_OID: OID,
        S_UPDATE_UID: userId,
        S_FORM_ID: formId,
        S_SEQ: seq,
        S_TOPIC_ID: topicId,
        S_ROW_ID: item.rowId,
        S_COL_ID: item.colId,
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

const UpdateStatusFormUser = async (formId, userId, OID, seq, dateNow) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,

      "../../sql/forms/formValue/updated/updateFormUserStatus.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_STATUS: statusFormUser.inprogress.message,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: OID,
      S_UPDATE_UID: userId,
      S_FORM_ID: formId,
      S_SEQ: seq,
    });

    await connection.commit();

    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// formatted data

const formatDataTopic = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      id: item.TOPIC_ID,
      type: item.TOPIC_TYPE,
      extraAttributes: item.extraAttributes,
      status: item.status,
      // updateAt: item.UPDATE_DATE,
      // updateBy: item.UPDATE_UID,
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

const formatDataOptionsForColumns = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      no: +item.OPTION_NO,
      value: item.OPTION_DES,
    };
  });
};

const formatDefaultValue = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      TOPIC_ID: item.TOPIC_ID,
      ROW_ID: item.ROW_ID,
      COL_ID: item.COL_ID,
      TOPIC_VALUE: item.TOPIC_VALUE,
    };
  });
};

module.exports = {
  createTodoForm,
  getListFormTodo,
  getListUsersFormTodo,
  getFormContentsByUrl,
  UpdateValueFormByUserId,
  getFormForApprovalContentsByUrl,
  getCriteriasByProtId,
};
