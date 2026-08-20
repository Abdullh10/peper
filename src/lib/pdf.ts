import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export type PageImage = {
  index: number;
  filename: string;
  width: number;
  height: number;
};

async function getPngDimensions(filePath: string) {
  const fh = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(24);
    await fh.read(buffer, 0, 24, 0);
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  } finally {
    await fh.close();
  }
}

export async function convertPdfToPageImages(
  pdfPath: string,
  outDir: string
): Promise<PageImage[]> {
  await fs.mkdir(outDir, { recursive: true });
  const prefix = path.join(outDir, "raw");

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("pdftoppm", ["-png", "-r", "150", pdfPath, prefix]);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`فشل تحويل ملف PDF: ${stderr || `exit code ${code}`}`));
    });
    proc.on("error", (err) => reject(new Error(`تعذر تشغيل أداة تحويل PDF: ${err.message}`)));
  });

  const files = (await fs.readdir(outDir)).filter(
    (f) => f.startsWith("raw") && f.endsWith(".png")
  );
  if (files.length === 0) {
    throw new Error("لم يتم إنتاج أي صفحات من ملف PDF، تأكد أن الملف صالح.");
  }

  const withNum = files
    .map((f) => {
      const m = f.match(/-(\d+)\.png$/);
      return { file: f, num: m ? parseInt(m[1], 10) : 0 };
    })
    .sort((a, b) => a.num - b.num);

  const results: PageImage[] = [];
  for (let i = 0; i < withNum.length; i++) {
    const oldPath = path.join(outDir, withNum[i].file);
    const filename = `page-${i + 1}.png`;
    const newPath = path.join(outDir, filename);
    await fs.rename(oldPath, newPath);
    const dims = await getPngDimensions(newPath);
    results.push({ index: i + 1, filename, ...dims });
  }

  return results;
}
