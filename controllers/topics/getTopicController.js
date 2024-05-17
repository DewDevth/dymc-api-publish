const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");






const getTopicsByFormId = async (req, res) => {
    try {

        const { id } = req.params;
        // const FORM_ID = "DFO66110001";
        if (!id || id.trim() === "") {
            return res.status(400).json({ message: "Form id is required" });
        }

        const FormByIdData = await getFormByID(req, res, id);

        if (!FormByIdData) {
            return res.status(404).json({ message: "Form id is not found or does not meet criteria" });
        }

        const HeadTopicByFormIdData = await getHeadTopicByFormID(req, res, id);

        if (!HeadTopicByFormIdData) {
            return res.status(404).json({ message: "HeadTopic is not found " });
        }


        const OptionsData = await getOptions();
        const SubTopicValueData = await getSubTopicValue(req, res, id);
        const TopicTypeValueData = await getTopicType(id);
        const SubTopicData = await getSubTopics();

        const connection = await connectToDatabase();

        if (!id) {
            return res.status(404).json({ message: "form id is not found" });
        }

        const sqlFilePath = path.join(__dirname, "../../sql/topics/getTopicsAndValue.sql");
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        const result = await connection.execute(sql, {
            S_FORM_ID: id,
        });

        await connection.close();

        const rows = result.rows.map((row, index) => {
            const rowData = {};
            result.metaData.forEach((meta, index) => {
                rowData[meta.name] = row[index];
            });

            rowData.ID = index + 1;

            // Map OptionsData based on TOPIC_ID
            const item = OptionsData
                .filter(option => option.TOPIC_ID === rowData.TOPIC_ID)
                .map((option, optionIndex) => {
                    const subTopicItem = SubTopicData
                        .filter(subTopic => subTopic.TOPIC_ID === option.TOPIC_ID)
                        .map(subTopic => ({ ...subTopic, ID: subTopic.ID }));

                    // Check if there is a matching SUBTOPIC_VALUE in SubTopicValueData
                    const subTopicValue = SubTopicValueData.find(subTopicValue =>
                        subTopicValue.TOPIC_ID === option.TOPIC_ID &&
                        subTopicValue.OPTION_ID === option.OPTION_ID);

                    const checkValue = subTopicValue ? "T" : null;

                    // Check if SUBTOPIC_ID is null
                    if (subTopicValue && subTopicValue.SUBTOPIC_ID === null) {
                        rowData.CHECK_VALUE = "T";
                    }

                    // Update RESULT field in SUBTOPIC_ITEM based on SUBTOPIC_ID
                    subTopicItem.forEach(subTopic => {
                        const matchingSubTopicValue = SubTopicValueData.find(value =>
                            value.SUBTOPIC_ID === subTopic.SUBTOPIC_ID &&
                            value.OPTION_ID === option.OPTION_ID);

                        if (matchingSubTopicValue) {
                            //    subTopic.RESULT = matchingSubTopicValue.CHECK_VALUE;
                            subTopic.RESULT = "T";

                        }
                    });

                    return { ...option, ID: optionIndex + 1, CHECK_VALUE: checkValue, SUBTOPIC_ITEM: subTopicItem };
                });

            rowData.ITEM = item;

            return rowData;
        });

        console.log("data rows==", rows)



        // console.log(OptionsData)
        const formattedResponse = {
            FormData: FormByIdData,
            headTopics: HeadTopicByFormIdData,
            topics: rows,
            topicTypes: TopicTypeValueData,
        };
        res.status(200).json(formattedResponse);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching topics data");
    }

}


const getFormByID = async (req, res, FORM_ID) => {

    try {
        // เชื่อมต่อกับฐานข้อมูล
        const connection = await connectToDatabase();
        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(__dirname, "../../sql/forms/getFormByID.sql");
        // อ่านไฟล์ SQL แยก
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
        const result = await connection.execute(sql, {
            S_FORM_ID: FORM_ID,
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

        // console.log(rows)
        return rows[0]
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching options data");
    }
}


const getHeadTopicByFormID = async (req, res, FORM_ID) => {

    try {
        // เชื่อมต่อกับฐานข้อมูล
        const connection = await connectToDatabase();
        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(__dirname, "../../sql/forms/getHeadTopicByID.sql");
        // อ่านไฟล์ SQL แยก
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
        const result = await connection.execute(sql, {
            S_FORM_ID: FORM_ID,
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

        // console.log(rows)
        return rows
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching head topics data");
    }
}




const getOptions = async (req, res) => {

    try {
        // เชื่อมต่อกับฐานข้อมูล
        const connection = await connectToDatabase();
        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(__dirname, "../../sql/topics/getOptions.sql");
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
            rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ
            return rowData;
        });

        // console.log(rows)
        return rows
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching options data");
    }




}


const getSubTopicValue = async (req, res, FORM_ID) => {

    try {
        // เชื่อมต่อกับฐานข้อมูล
        const connection = await connectToDatabase();
        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(__dirname, "../../sql/topics/getSubtopicValue.sql");
        // อ่านไฟล์ SQL แยก
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
        const result = await connection.execute(sql, {
            S_FORM_ID: FORM_ID,
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

        // console.log(rows)
        return rows
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching options data");
    }


}



const getSubTopics = async (req, res) => {

    try {
        // เชื่อมต่อกับฐานข้อมูล
        const connection = await connectToDatabase();
        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(__dirname, "../../sql/topics/getSubTopic.sql");
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
            rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ
            return rowData;
        });

        // console.log(rows)
        return rows
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching options data");
    }





}



const getTopicType = async (FORM_ID) => {
    try {
        // เชื่อมต่อกับฐานข้อมูล
        const connection = await connectToDatabase();
        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(__dirname, "../../sql/topics/getTopicTypeValue.sql");
        // อ่านไฟล์ SQL แยก
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
        const result = await connection.execute(sql, {
            S_FORM_ID: FORM_ID,
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

        // console.log(rows)
        return rows
    } catch (error) {
        console.error("Error:", error);
        throw error; // Rethrow the error to be caught in the calling function
    }


}


module.exports = {
    getTopicsByFormId,
};
