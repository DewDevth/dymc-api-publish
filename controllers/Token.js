const getToken = async (req, res) => {

  try {
    const token = req.body.token;
    // const token = req.params.token;
  
    if (!token) {
      return res.status(400).json({ message: "token Not found" });
    }

    const decodedPayload = decodeJWT(token);

    if (!decodedPayload) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const formattedData = formatDecodedPayload(decodedPayload);

    if (!formattedData) {
      return res.status(400).json({ message: "Invalid token formatted" });
    }

    // return res.redirect(
    //   `http://localhost:3000/?data=${encodeURIComponent(
    //     JSON.stringify(formattedData)
    //   )}`
    // );

    // Store formattedData in localStorage
    // localStorage.setItem("formattedData", JSON.stringify(formattedData));
    // return res.redirect("http://localhost:3000/");

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error processing request");
  }
}

const decodeJWT = (token) => {
  try {
    const [, payloadBase64] = token.split(".");
    return JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

const formatDecodedPayload = (decodedPayload) => {
  const formattedData = {};

  for (const [key, value] of Object.entries(decodedPayload)) {
    if (key.startsWith("http://schemas.")) {
      const claim = key.split("/").pop();
      formattedData[claim] = value;
    } else {
      formattedData[key] = value;
    }
  }

  return formattedData;
}

module.exports = {
  getToken,
};
