const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");




// delete prot 

const DeleteProtById = async (req, res) => {
    try {
        const { protId, userId, OID } = req.body;
        if (
            !protId || !userId || !OID
        ) return res.status(400).json({ message: "protId not found." });

        const connection = await connectToDatabase();
        const sqlFilePath = path.join(
            __dirname,
            "../../sql/forms/form/delete/cancelProtFlag.sql"
        );

        const sql = fs.readFileSync(sqlFilePath, "utf-8");
        const dateNow = new Date();

        // Execute 
        finalResult = await connection.execute(sql, {
            S_PROT_ID: protId,
            S_CANCEL_FLAG: "T",
            S_UPDATE_DATE: dateNow,
            S_UPDATE_OID: OID,
            S_UPDATE_UID: userId
        });



        await connection.commit();
        res.status(200).json({ message: "Delete Prot Successfully" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send("Error Delete Prot  data");
    }
}


// const DeleteProtById = async (req, res) => {
//     try {
//         const { protId } = req.body;
//         if (
//             !protId
//         ) return res.status(400).json({ message: "protId not found." });

//         const connection = await connectToDatabase();
//         const sqlFilePath = path.join(
//             __dirname,
//             "../../sql/forms/form/delete/deleteProtById.sql"
//         );

//         const sql = fs.readFileSync(sqlFilePath, "utf-8");

//         // Execute 
//         finalResult = await connection.execute(sql, {
//             S_PROT_ID: protId,
//         });

//         // clear data
//         await ClearTopics(protId)
//         await ClearProps(protId)
//         await ClearOptions(protId)
//         await ClearExtra(protId)

//         await connection.commit();
//         res.status(200).json({ message: "Delete Prot Successfully" });
//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).send("Error Delete Prot  data");
//     }
// }




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
}

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
}


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
}


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
}


const getExtraType = async (req, res) => {
    try {

        // เชื่อมต่อกับฐานข้อมูล
        const connection = await connectToDatabase();
        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(__dirname, "../../sql/forms/extra/select/getExtras.sql");
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

        const formattedData = rows.map(row => {
            return {
                "EXTRA_TYPE_ID": row.EXTRA_TYPE_ID,
                // "value": row.VALUE,
                "value": row.EXTRA_TYPE_ID,
                "label": row.LABEL
            };
        });

        res.status(200).json(formattedData);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching ExtraType data");
    }
}



module.exports = {
    DeleteProtById,
    getExtraType
};
