import sharp from "sharp";
import emailMedia from "models/emailMedia.js";

test("validates PNG and preserves all bytes and frames of an animated GIF", async () => {
  const png = await sharp({
    create: { width: 12, height: 8, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  const result = await emailMedia.validateImage(png.toString("base64"));
  expect(result.contentType).toBe("image/png");
  expect(result.width).toBe(12);
  expect(result.height).toBe(8);
  const gif = await sharp(Buffer.from([255, 0, 0, 0, 255, 0]), {
    raw: { width: 1, height: 2, channels: 3, pageHeight: 1 },
  })
    .gif({ loop: 0, delay: [100, 200] })
    .toBuffer();
  const animated = await emailMedia.validateImage(gif.toString("base64"));
  expect(animated.contentType).toBe("image/gif");
  expect(animated.buffer.equals(gif)).toBe(true);
  expect((await sharp(animated.buffer).metadata()).pages).toBe(2);
});

test("rejects SVG, corrupt files, malformed base64, excessive dimensions and excessive size", async () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
  );
  const wide = await sharp({
    create: { width: 9000, height: 1, channels: 3, background: "blue" },
  })
    .png()
    .toBuffer();
  for (const content of [
    svg.toString("base64"),
    wide.toString("base64"),
    Buffer.from("GIF89a broken").toString("base64"),
    "%%%%",
    "AAAA=",
    Buffer.alloc(3_000_001).toString("base64"),
  ]) {
    await expect(emailMedia.validateImage(content)).rejects.toMatchObject({
      name: "ValidationError",
    });
  }
});
