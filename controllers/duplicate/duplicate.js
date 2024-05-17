const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");
const {
    genUid15Digit,
    genUid11Digit,
    generateProtId,
} = require("../../utils/genId");


const duplicateProt = async (req, res) => {
    try {
        const { protId, userId, OID } = req.body;
        if (!protId || !userId || !OID)
            return res.status(400).json({ message: "Missing required fields." });

        const connection = await connectToDatabase();
        // get prot by protId
        const dataProt = await getProtById(protId);
        if (dataProt.length === 0) {
            return res.status(400).json({ message: "Pototype not found!" });
        }

        // create and copy prot data
        const formTitle = dataProt[0].FORM_TITLE;
        const formDescription = dataProt[0].FORM_DESC;
        const FORM_CODE = dataProt[0].FORM_CODE;
        const FORM_REVISION = dataProt[0].FORM_REVISION;
        const ISO_DOC_CODE = dataProt[0].ISO_DOC_CODE;
        const ISO_DOC_REVISION = dataProt[0].ISO_DOC_REVISION;
        const approveFlag = "W";    // status Draft

        const genProtId = await generateProtId();
        const dateNow = new Date();
        await createProtById(genProtId, userId, OID, dateNow, dataProt[0])



        // // get topic by prot id
        const topics = await getTopicsById(protId);
        const props = await getPropsById(protId);
        const options = await getOptionById(protId);
        const extras = await getExtraById(protId);
        if (topics.length > 0) {
            await createTopicsById(genProtId, userId, OID, dateNow, topics, props, options, extras)
        }


        //  new prot
        const formateData = {
            id: genProtId,
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
            CANCEL_FLAG: dataProt[0].CANCEL_FLAG,
            CODE_REV: (FORM_CODE
                ? `${FORM_CODE}/${FORM_REVISION}`
                : ISO_DOC_CODE
                    ? `${ISO_DOC_CODE}/${ISO_DOC_REVISION}`
                    : ""
            ).trim(),
        };
        res.status(200).json(formateData);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send("Error Duplicate");
    }
};



const createProtById = async (protId, userId, oid, dateNow, prot) => {
    try {
        const connection = await connectToDatabase();

        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/insertProt.sql"
        );
        const sql = fs.readFileSync(sqlFilePath, "utf-8");
        await connection.execute(sql, {
            S_PROT_ID: protId,
            S_FORM_CODE: prot.FORM_CODE,
            S_FORM_REVISION: prot.FORM_REVISION,
            S_FORM_TITLE: prot.FORM_TITLE,
            S_FORM_DESC: prot.FORM_DESC,
            S_ISO_DOC_CODE: prot.ISO_DOC_CODE,
            S_ISO_DOC_REVISION: prot.ISO_DOC_REVISION,
            S_APPV_FLAG: "W",
            S_CR_DATE: dateNow,
            S_CR_OID: oid,
            S_CR_UID: userId,
        });

        await connection.commit();
        return;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};


const createTopicsById = async (protId, userId, oid, dateNow, topics, props, options, extras) => {
    try {
        const connection = await connectToDatabase();

        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/insertTopic.sql"
        );
        const sql = fs.readFileSync(sqlFilePath, "utf-8");




        for (const topic of topics) {
            const genTopicID = genUid15Digit();
            await connection.execute(sql, {
                S_PROT_ID: protId,
                S_TOPIC_ID: genTopicID,
                S_TOPIC_TYPE: topic.TOPIC_TYPE,
                S_TOPIC_NO: topic.TOPIC_NO,
                S_CR_DATE: dateNow,
                S_CR_OID: oid,
                S_CR_UID: userId
            });

            const filteredProps = props.filter(
                (prop) =>
                    prop.PROT_ID === topic.PROT_ID &&
                    prop.TOPIC_ID === topic.TOPIC_ID
            );
            if (filteredProps.length > 0) {
                await createPropsById(protId, genTopicID, userId, oid, dateNow, filteredProps, options, extras)
            }

        }


        await connection.commit();
        return;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};


const createPropsById = async (protId, topicId, userId, oid, dateNow, props, options, extras) => {
    try {
        const connection = await connectToDatabase();

        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/insertProp.sql"
        );
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        // Assuming props is an array of objects
        for (const prop of props) {
            const genPropID = genUid15Digit();
            await connection.execute(sql, {
                S_PROT_ID: protId,
                S_TOPIC_ID: topicId,
                S_PROP_ID: genPropID,
                S_PROP_TYPE: prop.PROP_TYPE,
                S_PROP_VALUE: prop.PROP_VALUE,
                S_PROP_LIST: prop.PROP_LIST,
                S_PROP_NO: prop.PROP_NO,
                S_CR_DATE: dateNow,
                S_CR_UID: userId,
                S_CR_OID: oid
            });



            // // OPTIONS
            const filteredOptions = options.filter(
                (option) =>
                    option.PROT_ID === prop.PROT_ID &&
                    option.TOPIC_ID === prop.TOPIC_ID &&
                    option.PROP_ID === prop.PROP_ID
            );
            if (filteredOptions.length > 0) {
                await createOptionsById(protId, topicId, genPropID, userId, oid, dateNow, filteredOptions)
            }

            // EXTRAS
            const filteredExtras = extras.filter(
                (option) =>
                    option.PROT_ID === prop.PROT_ID &&
                    option.TOPIC_ID === prop.TOPIC_ID &&
                    option.PROP_ID === prop.PROP_ID
            );

            if (filteredExtras.length > 0) {
                await createExtrasById(protId, topicId, genPropID, userId, oid, dateNow, filteredExtras)
            }



        }


        await connection.commit();
        return;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};


const createOptionsById = async (protId, topicId, propId, userId, oid, dateNow, options) => {
    try {
        const connection = await connectToDatabase();

        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/insertOption.sql"
        );
        const sql = fs.readFileSync(sqlFilePath, "utf-8");




        for (const option of options) {
            const genOptionID = genUid11Digit();
            await connection.execute(sql, {
                S_PROT_ID: protId,
                S_TOPIC_ID: topicId,
                S_PROP_ID: propId,
                S_OPTION_ID: genOptionID,
                S_OPTION_DES: option.OPTION_DES,
                S_OPTION_NO: option.OPTION_NO,
                S_CR_DATE: dateNow,
                S_CR_UID: userId,
                S_CR_OID: oid
            });

        }


        await connection.commit();
        return;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};

const createExtrasById = async (protId, topicId, propId, userId, oid, dateNow, extras) => {
    try {
        const connection = await connectToDatabase();

        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/insertExtra.sql"
        );
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        for (const extra of extras) {
            const genExtraID = genUid15Digit();
            await connection.execute(sql, {
                S_PROT_ID: protId,
                S_TOPIC_ID: topicId,
                S_PROP_ID: propId,
                S_EXTRA_ID: genExtraID,
                S_EXTRA_TYPE: extra.EXTRA_TYPE,
                S_EXTRA_DESC: extra.EXTRA_DESC,
                S_EXTRA_NO: extra.EXTRA_NO,
                S_CR_DATE: dateNow,
                S_CR_UID: userId,
                S_CR_OID: oid
            });
        }
        await connection.commit();
        return;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};


const getProtById = async (protId) => {
    try {
        const connection = await connectToDatabase();

        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/getProtById.sql"
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

const getTopicsById = async (protId) => {
    try {
        const connection = await connectToDatabase();

        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/getTopicByProtId.sql"
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
const getPropsById = async (protId) => {
    try {
        const connection = await connectToDatabase();

        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/getPropsById.sql"
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
const getOptionById = async (protId) => {
    try {
        const connection = await connectToDatabase();

        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/getOptionById.sql"
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

const getExtraById = async (protId) => {
    try {
        const connection = await connectToDatabase();

        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(
            __dirname,
            "../../sql/duplicate/getExtraById.sql"
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

module.exports = {
    duplicateProt,
};
