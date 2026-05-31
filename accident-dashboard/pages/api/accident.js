import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(400).json({ error: "Failed to parse request" });
    }

    try {
      // ── Upload image to Supabase Storage ──────────────────────────────────
      const file      = Array.isArray(files.image) ? files.image[0] : files.image;
      const fileData  = fs.readFileSync(file.filepath);
      const filename  = `accident_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("accident-images")
        .upload(filename, fileData, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("accident-images")
        .getPublicUrl(filename);

      // ── Save record to database ───────────────────────────────────────────
      const timestamp = Array.isArray(fields.timestamp)
        ? fields.timestamp[0]
        : fields.timestamp || new Date().toISOString();

      const lat = parseFloat(
        Array.isArray(fields.lat) ? fields.lat[0] : fields.lat
      ) || null;

      const lon = parseFloat(
        Array.isArray(fields.lon) ? fields.lon[0] : fields.lon
      ) || null;

      const { error: dbError } = await supabase.from("accidents").insert({
        timestamp,
        lat,
        lon,
        image_url: publicUrl,
      });

      if (dbError) throw dbError;

      return res.status(200).json({ success: true, image_url: publicUrl });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}
