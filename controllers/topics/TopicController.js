const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");


const SaveNewData = async (req, res) => {
    try {
        const {
            USER_ID,
            ORG,
            PPO_ID,
            PPO_REVISION,
            CHKLST_MODE,
            CHKLST_VALUE,
            REMARK,
            TOPIC_GRP,
            ARTWORK_VALUE,
        } = req.body;
        if (
            !USER_ID ||
            !ORG ||
            !PPO_ID ||
            !PPO_REVISION ||
            !CHKLST_MODE ||
            !TOPIC_GRP
        ) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        if (!Array.isArray(CHKLST_VALUE)) {
            return res
                .status(400)
                .json({ message: "CHKLST_VALUE should be an array." });
        }

        // Ensure CHKLST_VALUE is an array
        const checklistValue = Array.isArray(CHKLST_VALUE) ? CHKLST_VALUE : [];

        const connection = await connectToDatabase();

        // เงื่อนไขที่ 1
        if (CHKLST_MODE === "CHECKER") {
            await ClearCheckListIsChecker(
                connection,
                PPO_ID,
                PPO_REVISION,
                CHKLST_MODE,
                TOPIC_GRP
            );
        }

        const sqlFilePath = path.join(
            __dirname,
            "../../sql/artworks/checkListUpdate/updatePrepress_chklst.sql"
        );
        const sql_pp_chklst = fs.readFileSync(sqlFilePath, "utf-8");
        //sql not update StartDate
        const sqlFilePathNotUpdateStartDate = path.join(
            __dirname,
            "../../sql/artworks/checkListUpdate/updatePrepress_chklst_notUpdateStartDate.sql"
        );
        const sql_pp_chklst_notUpdateStartDate = fs.readFileSync(sqlFilePathNotUpdateStartDate, "utf-8");


        const dateNow = new Date();

        // Execute the main checklist update
        const promises = checklistValue.map(async (item) => {
            if (item.VALUE === "F") {
                // console.log(item.VALUE);
                await IsNotPassStampF(connection, PPO_ID, PPO_REVISION, item.TOPIC_ID);
            }
            // console.log("item.START_DATE == ", item.START_DATE);


            let finalResult

            if (item.START_DATE) {
                finalResult = await connection.execute(sql_pp_chklst_notUpdateStartDate, {
                    S_OPERATE_BY: USER_ID,
                    D_END_DATE: dateNow,
                    S_CHECK_FLAG: item.VALUE,
                    D_UPDATE_DATE: dateNow,
                    S_UPDATE_OID: ORG,
                    S_UPDATE_UID: USER_ID,
                    S_PPOD_ID: PPO_ID,
                    S_PPOD_REV: PPO_REVISION,
                    S_CHKLST_MODE: CHKLST_MODE,
                    S_TOPIC_ID: item.TOPIC_ID,
                });
            } else {
                finalResult = await connection.execute(sql_pp_chklst, {
                    S_OPERATE_BY: USER_ID,
                    D_START_DATE: dateNow,
                    D_END_DATE: dateNow,
                    S_CHECK_FLAG: item.VALUE,
                    D_UPDATE_DATE: dateNow,
                    S_UPDATE_OID: ORG,
                    S_UPDATE_UID: USER_ID,
                    S_PPOD_ID: PPO_ID,
                    S_PPOD_REV: PPO_REVISION,
                    S_CHKLST_MODE: CHKLST_MODE,
                    S_TOPIC_ID: item.TOPIC_ID,
                });
            }

            return finalResult;
        });

        // Execute the checklist value update using the separate function
        await updateCheckListValue(
            connection,
            checklistValue,
            dateNow,
            USER_ID,
            ORG,
            PPO_ID,
            PPO_REVISION,
            CHKLST_MODE
        );

        await updateRemark(connection, PPO_ID, PPO_REVISION, REMARK);

        // UPDATE artwork list
        const artWorkData = await ARTWORK_VALUE;
        // console.log("artWorkData = ", artWorkData.length);
        if (artWorkData.length > 0) {
            await updateArtworkChecklist(
                connection,
                USER_ID,
                dateNow,
                ARTWORK_VALUE,
                PPO_ID,
                PPO_REVISION,
                CHKLST_MODE
            );
        }

        // Wait for all execute operations to complete
        const results = await Promise.all(promises);

        // Commit data
        await connection.commit();

        console.log("result = ", results);
        res.status(200).json({ message: "Update CheckList Successfully" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send("Error fetching data");
    }
}


module.exports = {
    SaveNewData
};
