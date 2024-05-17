const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");
const {
  genUid11Digit,
  generateFormId,
  genUid,
  generateRandomNumber3Digit,
} = require("../../utils/genId");
const { statusFormUser } = require("../../utils/status");

const UpdateFormFlag = async (req, res) => {
  try {
    const { formId, userId, OID, seq } = req.body;

    if (!userId || !userId || !OID || !seq)
      return res.status(400).json({ message: "Missing required fields." });

    // console.log("UpdateFormFlag")

    const dateNow = new Date();

    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,

      "../../sql/jobonweb/UpdateFormFlag.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_CANCEL_FLAG: "F",
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: OID,
      S_UPDATE_UID: userId,
      S_FORM_ID: formId,
    });

    await connection.commit();

    await UpdateFormUserFlag(formId, userId, OID, seq, dateNow);

    res.status(200).json("Updated form and form user Flag");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error Updated form and form user Flag data");
  }
};

const UpdateFormUserFlag = async (formId, userId, OID, seq, dateNow) => {
  try {
    const connection = await connectToDatabase();
    // console.log("UpdateFormUserFlag")

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/UpdateFormUserFlag.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_CANCEL_FLAG: "F",
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

// create new form by prot id start

const createNewFormByProt = async (req, res) => {
  try {
    const { userId, oid, productId, machineId, machineType } = req.body;

    if (!userId || !oid || !productId || !machineId || !machineType)
      return res.status(400).json({ message: "Missing required fields." });

    // console.log(userId);
    // console.log(oid);
    // console.log(productId);
    // console.log(machineId);
    // console.log(machineType);

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getPortIdGenForm.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_MACH_TYPE: machineType,
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
    const protId = rows[0]?.PROT_ID;
    if (!protId) {
      return res.status(404).json({ message: "protId is not found." });
    }

    // สร้าง form, form user ,form value  เเละ ต้องส่งออกมาด้วย
    const formData = await createForm(protId, userId, oid);

    if (!formData) {
      return res.status(404).json({ message: "formData is not found." });
    }
    const { formId, seq, url, startDate, endDate } = formData;

    // ส่ง prot and topics ออกไปแสดง
    const newFormattedData = {
      FORM_ID: formId,
      SEQ: seq,
      URL: url,
      USER_ID: userId,
      REQ_USER_FLAG: "T",
      PROT_ID: protId,
      START_DATE: startDate,
      END_DATE: endDate,
      STATUS: statusFormUser.todo.message,
    };

    // // get topic
    const TopicData = await GetTopicByFormId(protId, formId, seq);
    // //get topics
    const newFormatted = {
      ...newFormattedData,
      content: TopicData,
    };



    res.status(200).json(newFormatted);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error createNewFormByProt data");
  }
};

const createForm = async (protId, userId, oid) => {
  try {
    const dateNow = new Date();

    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/insert/insertFormNew.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const docId = await generateFormId();
    // console.log("docId createForm job on web=", docId);
    const genURL = genUid();

    const newStartDate = new Date(); //วันเวลาปัจจุบัน
    const newEndDate = new Date(); //วันเวลาปัจจุบัน+1ปี
    // +1ปี
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    const result = await connection.execute(sql, {
      S_FORM_ID: docId,
      S_PROT_ID: protId,
      S_URL: genURL,
      S_START_DATE: newStartDate,
      S_END_DATE: newEndDate,
      S_REQ_USER_FLAG: "F",
      S_CANCEL_FLAG: "P",
      S_CR_DATE: dateNow,
      S_CR_UID: userId,
      S_CR_OID: oid,
    });

    await connection.commit();

    const seqUserForm = await createFormUser(
      docId,
      dateNow,
      userId,
      oid,
      protId
    );

    const newData = {
      formId: docId,
      seq: seqUserForm,
      url: genURL,
      startDate: newStartDate,
      endDate: newEndDate,
    };
    return newData;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const createFormUser = async (docId, dateNow, UID, OID, protId) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/form-todo/insert/insertFormUserNew.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // หา topics
    const dataTopics = await getTopicsByProtID(protId);

    const genID = generateRandomNumber3Digit();
    await connection.execute(sql, {
      S_FORM_ID: docId,
      S_SEQ: genID,
      S_USER_ID: UID,
      S_CR_DATE: dateNow,
      S_CR_UID: UID,
      S_CR_OID: OID,
      S_CANCEL_FLAG: "P",
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
        protId
      );
    }

    await connection.commit();
    return genID;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error to be caught in the calling function
  }
};

const getTopicsByProtID = async (protId) => {
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
// create new form by prot id end



const getPototypeByType = async (machineType) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getPortIdGenForm.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_MACH_TYPE: machineType,
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

const GetProductById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id)
      return res.status(400).json({ message: "Missing required fields." });

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getProductById.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_PROD_ID: id,
    });
    // ปิดการเชื่อมต่อ
    await connection.close();


    // หาค่าว่ามี pototype ไหม 
    const machine = await getPototypeByType("เครื่องพิมพ์")
    const machinePump = await getPototypeByType("เครื่องปั้ม")
    const machineOil = await getPototypeByType("เครื่องอาบมัน")



    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      rowData.machine = machine.length;
      rowData.machinePump = machinePump.length;
      rowData.machineOil = machineOil.length;

      return rowData;
    });

    res.status(200).json(...rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form list data");
  }
};





const GetMachines = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId)
      return res.status(400).json({ message: "Missing required fields." });

    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getSqlTab.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql, {
      S_SQL_NO: "700790003",
    });
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    const sql_stmt = rows[0].SQL_STMT;
    if (!sql_stmt) {
      res.status(404).send("SQL statement not found");
      return;
    }

    // Call the GetMachinesByStmt function to retrieve machines
    const rowsMachine = await GetMachinesByStmt(sql_stmt);
    const newMachines = await formattedMachines(rowsMachine, productId);

    res.status(200).json(newMachines);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching machine data");
  }
};

const GetMachinesByStmt = async (sql_stmt) => {
  try {
    const connection = await connectToDatabase();
    const result = await connection.execute(sql_stmt);
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

const GetStatusMachine = async (productId, machineId) => {
  try {
    // console.log(machineId)

    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getStatusMachines.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql, {
      S_PROD_ID: productId,
      S_MACH_ID: machineId,
    });
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    // เรามีข้อมูลจำนวนเรคคอร์ดที่คืนมา
    const countData = rows[0];

    // เราสามารถเข้าถึงค่า COUNT(1) โดยใช้ชื่อคอลัมน์ที่ได้รับมาเป็น key
    const countValue = countData["COUNT(1)"];

    return countValue;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const GetPumpMachines = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId)
      return res.status(400).json({ message: "Missing required fields." });

    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getSqlTab.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // 700790006 เครื่องปั้ม
    const result = await connection.execute(sql, {
      S_SQL_NO: "700790006",
    });
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    const sql_stmt = rows[0].SQL_STMT;
    if (!sql_stmt) {
      res.status(404).send("SQL statement not found");
      return;
    }

    // Call the GetMachinesByStmt function to retrieve machines
    const rowsMachine = await GetMachinesByStmt(sql_stmt);
    const newMachines = await formattedMachines(rowsMachine, productId);

    res.status(200).json(newMachines);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching machine data");
  }
};
const GetOilBathingMachines = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId)
      return res.status(400).json({ message: "Missing required fields." });

    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getSqlTab.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // 700790006 เครื่องอาบมัน
    const result = await connection.execute(sql, {
      S_SQL_NO: "700790005",
    });
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    const sql_stmt = rows[0].SQL_STMT;
    if (!sql_stmt) {
      res.status(404).send("SQL statement not found");
      return;
    }

    // Call the GetMachinesByStmt function to retrieve machines
    const rowsMachine = await GetMachinesByStmt(sql_stmt);
    const newMachines = await formattedMachines(rowsMachine, productId);

    res.status(200).json(newMachines);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching machine data");
  }
};

const GetMachineById = async (req, res) => {
  try {
    const { machineId } = req.body;

    if (!machineId)
      return res.status(400).json({ message: "Missing required fields." });

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getMachByID.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_MACH_ID: machineId,
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

    res.status(200).json(...rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form list data");
  }
};

// ดึงข้อมูล checksheet ที่ทำไป  เเละ นำ content มาเเสดงด้วย
const GetCheckSheetsById = async (req, res) => {
  try {
    const { productId, machineId, machineType } = req.body;

    if (!productId || !machineId || !machineType)
      return res.status(400).json({ message: "Missing required fields." });

    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/jobonweb/getCheckSheet.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const result = await connection.execute(sql, {
      S_PROD_ID: productId,
      S_MACH_ID: machineId,
      S_MACH_TYPE: machineType,
    });
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
        const contentData = await getFormContentPreview(
          row.PROT_ID,
          row.FORM_ID,
          row.SEQ
        );

        return {
          ...row,
          content: contentData || [],
        };
      })
    );

    // console.log("formattedRows", formattedRows)

    const sortedRows = formattedRows.sort((a, b) => {
      const dateA = new Date(a.UPDATE_DATE);
      const dateB = new Date(b.UPDATE_DATE);
      return dateB - dateA; // เรียงจากวันที่ใหม่ไปวันที่เก่า
    });

    res.status(200).json(sortedRows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching machine data");
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

const formattedMachines = async (data, productId) => {
  return Promise.all(
    data.map(async (item) => {
      const StatusData = await GetStatusMachine(productId, item.ID);
      // ถ้า StatusData เป็น 0 ให้เปลี่ยนเป็น false มิฉะนั้นเป็น true
      const status = StatusData === 0 ? false : true;
      //console.log("status", status);
      return {
        genId: genUid11Digit(),
        id: item.ID,
        mach_name: item.MACH_NAME,
        status: status,
      };
    })
  );
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
    const newData = await getDataUseSql(newSqlData);

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

const getDataUseSql = async (sql) => {
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

module.exports = {
  GetProductById,
  GetMachines,
  GetPumpMachines,
  GetOilBathingMachines,
  GetCheckSheetsById,
  GetMachineById,
  createNewFormByProt,
  UpdateFormFlag,
};
