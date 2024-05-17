const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");



const getTasksApproval = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ message: "Missing required fields." });
    // console.log("getTasksApproval",userId);

    // get รายการ form ที่มีสิทธิ์ อนุมัติ
    const dataUserApp = await GetUserApprove(userId)
    const approvalField = await GetApprovalField(userId);
    

    const formIdsArray = [];
    dataUserApp.forEach((item) => {
      formIdsArray.push(item.FORM_ID);
    });
    // console.log("FORM_IDs Array:", formIdsArray);

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/task/getTaskApproval.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);

    // GET data is_approval check sheet 
    const approvals = await GetApprovals();
    // console.log("approvals = ", approvals)

    // ปิดการเชื่อมต่อ
    await connection.close();
    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });


      const matchingApproval = approvals.filter(approval =>
        approval.FORM_ID === rowData.FORM_ID &&
        approval.SEQ === rowData.SEQ &&
        approval.IS_APPROVAL === 'T' &&
        approval.TOPIC_TYPE === 'ApprovalField'
      );

      rowData.isApproval = matchingApproval.length > 0 ? true : false


      return rowData;
    });

    // console.log("rows = ", rows)

    // // Filter rows to include only those with FORM_ID in formIdsArray
    // const filteredRows = rows.filter((row) => formIdsArray.includes(row.FORM_ID));

    // Filter rows to include only those with FORM_ID in formIdsArray or matching approvalField
    const filteredRows = rows.filter(row =>
      formIdsArray.includes(row.FORM_ID) ||
      approvalField.some(item =>
        item.FORM_ID === row.FORM_ID &&
        item.SEQ === row.SEQ
      )
    );

    const newformat = formatTask(filteredRows);
    // console.log("data=", newformat)
    // Sort the formatted data by CR_DATE in descending order
    const sortedData = newformat.sort((a, b) => {
      const dateA = new Date(a.CR_DATE);
      const dateB = new Date(b.CR_DATE);
      return dateB - dateA;
    });



    res.status(200).json(sortedData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};


const GetApprovalField = async (userId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/task/getApprovalField.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_USER_ID: userId
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

const GetUserApprove = async (userId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/task/getUserApproval.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_USER_ID: userId
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

const getTasks = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ message: "Missing required fields." });
    // console.log("getTasks",userId);
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/task/getForms.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_USER_ID: userId,
    });

    // GET data is_approval check sheet 
    const approvals = await GetApprovals();

    // ปิดการเชื่อมต่อ
    await connection.close();
    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });
      const matchingApproval = approvals.filter(approval =>
        approval.FORM_ID === rowData.FORM_ID &&
        approval.SEQ === rowData.SEQ &&
        approval.IS_APPROVAL === 'T' &&
        approval.TOPIC_TYPE === 'ApprovalField'
      );
      rowData.isApproval = matchingApproval.length > 0 ? true : false
      return rowData;
    });

    const newformat = formatTask(rows);
    // console.log("data=", newformat)

    // Sort the formatted data by CR_DATE in descending order
    const sortedData = newformat.sort((a, b) => {
      const dateA = new Date(a.CR_DATE);
      const dateB = new Date(b.CR_DATE);
      return dateB - dateA;
    });
    res.status(200).json(sortedData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};

//get Topic
const GetApprovals = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/task/getApproval.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);

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
    //4 get options

    // 3 get prop

    //2 get topic
    const TopicData = await GetTopicByFormId(protId);

    //1 get form
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
    return {
      PROT_ID: item.PROT_ID,
      FORM_CODE: item.FORM_CODE,
      FORM_REVISION: item.FORM_REVISION,
      FORM_TITLE: item.FORM_TITLE,
      FORM_DESC: item.FORM_DESC,
      ISO_DOC_CODE: item.ISO_DOC_CODE,
      ISO_DOC_REVISION: item.ISO_DOC_REVISION,
      APPV_FLAG: item.APPV_FLAG === "F" ? false : true,
      APPV_DATE: item.APPV_DATE,
      APPV_OID: item.APPV_OID,
      APPV_UID: item.APPV_UID,
      CR_DATE: item.CR_DATE,
      CR_OID: item.CR_OID,
      CR_UID: item.CR_UID,
      UPDATE_DATE: item.UPDATE_DATE,
      UPDATE_OID: item.UPDATE_OID,
      UPDATE_UID: item.UPDATE_UID,
      content: [],
    };
  });
};

const formatDataForm = (data, topic) => {
  // console.log(data)
  return data.map((item) => {
    return {
      id: item.PROT_ID,
      // FORM_CODE: item.FORM_CODE,
      // FORM_REVISION: item.FORM_REVISION,
      // FORM_TITLE: item.FORM_TITLE,
      // FORM_DESC: item.FORM_DESC,
      // ISO_DOC_CODE: item.ISO_DOC_CODE,
      // ISO_DOC_REVISION: item.ISO_DOC_REVISION,
      // APPV_FLAG: item.APPV_FLAG,
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

//FORMATTED DATA
const formatTask = (data) => {
  // console.log(data)
  return data.map((item) => {
    // console.log(item.STATUS)
    return {
      FORM_ID: item.FORM_ID,
      URL: item.URL,
      SEQ: item.SEQ,
      USER_ID: item.USER_ID,
      CR_DATE: item.CR_DATE,
      CR_OID: item.CR_OID,
      CR_UID: item.CR_UID,
      UPDATE_DATE: item.UPDATE_DATE,
      UPDATE_UID: item.UPDATE_UID,
      FORM_TITLE: item.FORM_TITLE,
      FORM_DESC: item.FORM_DESC,
      STATUS: item.STATUS,
      START_DATE: item.START_DATE,
      END_DATE: item.END_DATE,
      FORM_CODE: item.FORM_CODE,
      FORM_REVISION: item.FORM_REVISION,
      ISO_DOC_CODE: item.ISO_DOC_CODE,
      ISO_DOC_REVISION: item.ISO_DOC_REVISION,
      CODE_REV: (item.FORM_CODE
        ? `${item.FORM_CODE}/${item.FORM_REVISION}`
        : item.ISO_DOC_CODE
          ? `${item.ISO_DOC_CODE}/${item.ISO_DOC_REVISION}`
          : ""
      ).trim(),
      isApproval: item.isApproval,
      CANCEL_FLAG: item.CANCEL_FLAG,
      CANCEL_DATE: item.CANCEL_DATE,
      CANCEL_UID: item.CANCEL_UID,
      CANCEL_OID: item.CANCEL_OID,


    };
  });
};
module.exports = {
  getTasks,
  GetFormByProtId,
  getTasksApproval,
};
