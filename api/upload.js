const { put } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    if (!body.length) {
      return res.status(400).json({ error: "Empty body" });
    }
    if (body.length > 4.2 * 1024 * 1024) {
      return res.status(413).json({ error: "File too large (max ~4MB)" });
    }

    const contentType = req.headers["content-type"] || "image/jpeg";
    if (!String(contentType).startsWith("image/")) {
      return res.status(400).json({ error: "Only images are allowed" });
    }

    const rawName = decodeURIComponent(req.headers["x-filename"] || "photo.jpg");
    const safe = rawName.replace(/[^\w.\-ぁ-んァ-ン一-龥]/gu, "_").slice(0, 80) || "photo.jpg";
    const pathname = `photos/${Date.now()}-${safe}`;

    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });

    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
