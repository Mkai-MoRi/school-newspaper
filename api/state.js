const { get, put } = require("@vercel/blob");

const STATE_PATH = "layouts/shared.json";

async function streamToText(stream) {
  return await new Response(stream).text();
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const result = await get(STATE_PATH, { access: "public", useCache: false });
      if (!result || result.statusCode !== 200 || !result.stream) {
        return res.status(200).json({ empty: true });
      }
      const text = await streamToText(result.stream);
      const data = JSON.parse(text);
      return res.status(200).json(data);
    }

    if (req.method === "PUT") {
      const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!data || data.format !== "gakuso-news-layout" || !Array.isArray(data.pages)) {
        return res.status(400).json({ error: "Invalid layout payload" });
      }

      const revision = Number(data.revision || 0) + 1;
      const payload = {
        ...data,
        revision,
        updatedAt: new Date().toISOString(),
      };

      await put(STATE_PATH, JSON.stringify(payload), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });

      return res.status(200).json({ ok: true, revision, updatedAt: payload.updatedAt });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "State API failed" });
  }
};
