const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");
const {
  genUid15Digit,
  generateFormId,
  genUid11Digit,
} = require("../../utils/genId");
const { statusFormUser } = require("../../utils/status");

const UpdateCheckSheetApproval = async (req, res) => {
  try {
    const {
      form_id,
      seq,
      topic_id,
      topic_value,
      oid,
      uid,
      isApproveNext,
      topic_id_next,
    } = req.body;

    if (!form_id || !seq || !uid || !oid || !topic_value || !topic_id)
      return res.status(400).json({ message: "Missing required fields." });

    const connection = await connectToDatabase();
    const dateNow = new Date();

    const sqlFilePath = path.join(
      __dirname,

      "../../sql/forms/formValue/updated/updateFormValueApproval.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_TOPIC_VALUE: topic_value,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: oid,
      S_UPDATE_UID: uid,
      S_FORM_ID: form_id,
      S_SEQ: seq,
      S_TOPIC_ID: topic_id,
    });

    await connection.commit();
    if (topic_value === "A") {
      // มี คนอนุมัติถัดไป
      if (isApproveNext) {
        await UpdateCheckSheetFormApproval(
          form_id,
          seq,
          topic_id_next,
          oid,
          uid,
          dateNow
        );
      } else {
        console.log("ไม่มี คนอนุมัติถัดไป");
        //   เช็คว่าทุกอัน approval ใน topic value เป็น A ทั้งหมด ไหม ถ้าเป็น A ทั้งหมด จะให้ update FormUser = Done เเละ ลบค่าใน form_approval
        const isAllApproval = await getTopicIsApproval(form_id, seq);
        // ถ้า ค่า approval ทั้งหมดเป็น A
        if (isAllApproval) {
          console.log("isAllApproval true", isAllApproval);

          // clear data in table form_approval  and change state form user = Done
          await deleteFormApproval(form_id, seq);
          await UpdateStatusFormUserApprovalDone(
            form_id,
            seq,
            uid,
            oid,
            dateNow
          );
        } else {
          console.log("isAllApproval false", isAllApproval);

          // ถ้าไม่ ค่า approval ทั้งหมดไม่เป็น A
          await deleteFormApproval(form_id, seq);
          await UpdateStatusFormUserApprovalDone(
            form_id,
            seq,
            uid,
            oid,
            dateNow
          );
        }
      }
    } else {
      // clear data in table form_approval  and change state form user = Done
      await deleteFormApproval(form_id, seq);
      await UpdateStatusFormUserApprovalDone(form_id, seq, uid, oid, dateNow);
    }

    res
      .status(200)
      .json({ message: "Update check Sheet Approval Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error save form");
  }
};

const UpdateStatusFormUserApprovalDone = async (
  form_id,
  seq,
  uid,
  oid,
  dateNow
) => {
  try {
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,

      "../../sql/forms/formValue/updated/updateFormUserStatus.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_STATUS: statusFormUser.done.message,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: oid,
      S_UPDATE_UID: uid,
      S_FORM_ID: form_id,
      S_SEQ: seq,
    });

    await connection.commit();
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const deleteFormApproval = async (formId, seq) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/formApproval/delete/deleteFormApproval.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    await connection.execute(sql, {
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

const UpdateCheckSheetFormApproval = async (
  form_id,
  seq,
  topic_id_next,
  oid,
  uid,
  dateNow
) => {
  try {
    const connection = await connectToDatabase();
    const sqlFilePath = path.join(
      __dirname,

      "../../sql/forms/formApproval/updated/updateFormApproval.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_TOPIC_ID: topic_id_next,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: oid,
      S_UPDATE_UID: uid,
      S_FORM_ID: form_id,
      S_SEQ: seq,
    });

    await connection.commit();

    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getTopicIsApproval = async (formId, seq) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/forms/formApproval/select/getTopicApproval.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FORM_ID: formId,
      S_SEQ: seq,
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

    // สร้างอาร์เรย์เพื่อตรวจสอบว่าทุกรายการใน isAllApproval เป็น "A" หรือไม่
    const isAllApproval = rows.every((item) => item.topic_value === "A");

    return isAllApproval;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const CreateApproval = async (req, res) => {
  try {
    const { form_id, seq, topic_id, uid, oid } = req.body;

    if (!form_id || !seq || !topic_id || !uid || !oid)
      return res.status(400).json({ message: "Missing required fields." });

    const dateNow = new Date();
    const connection = await connectToDatabase();

    const sqlFilePath = path.join(
      __dirname,
      "../../sql/approval/insert/insertApproval.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_FORM_ID: form_id,
      S_SEQ: seq,
      S_TOPIC_ID: topic_id,
      S_CR_DATE: dateNow,
      S_CR_UID: uid,
      S_CR_OID: oid,
    });

    // update status form user
    await UpdateStatusFormUser(form_id, uid, oid, seq, dateNow);

    await connection.commit();
    res.status(200).json({ message: "Save Approval Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error save form");
  }
};

const getApprovalData = async (formId, seq) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/approval/select/getApproval.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FORM_ID: formId,
      S_SEQ: seq,
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

const UpdateApproveByFormId = async (req, res) => {
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

const UpdateStatusFormUserNotApproval = async (req, res) => {
  try {
    const { form_id, seq, uid, oid } = req.body;

    if (!form_id || !seq || !uid || !oid)
      return res.status(400).json({ message: "Missing required fields." });

    const connection = await connectToDatabase();
    const dateNow = new Date();

    const sqlFilePath = path.join(
      __dirname,

      "../../sql/forms/formValue/updated/updateFormUserStatus.sql"
    );

    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_STATUS: statusFormUser.done.message,
      S_UPDATE_DATE: dateNow,
      S_UPDATE_OID: oid,
      S_UPDATE_UID: uid,
      S_FORM_ID: form_id,
      S_SEQ: seq,
    });

    await connection.commit();
    res.status(200).json({ message: "Sent Approval Successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error save form");
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
      S_STATUS: statusFormUser.requestapproval.message,
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

module.exports = {
  CreateApproval,
  UpdateStatusFormUserNotApproval,
  UpdateCheckSheetApproval,
};
