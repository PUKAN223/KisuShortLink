import QRCode from "qrcode";

export type QrStyle = "square" | "rounded" | "dots";

type QrOptions = {
  style: QrStyle;
  foreground: string;
  background: string;
  logo?: string;
  size?: number;
};

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read the image. Choose a PNG, JPG, or WebP file."));
    image.src = src;
  });
}

export async function renderQrCode(url: string, options: QrOptions): Promise<string> {
  const foreground = luminance(options.foreground);
  const background = luminance(options.background);
  if (foreground >= background || (background + 0.05) / (foreground + 0.05) < 4.5) {
    throw new Error("Use a dark code color and a light background with more contrast.");
  }

  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const canvas = document.createElement("canvas");
  const size = options.size ?? 640;
  const margin = 4;
  const cell = size / (qr.modules.size + margin * 2);
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not draw the QR code.");

  context.fillStyle = options.background;
  context.fillRect(0, 0, size, size);
  context.fillStyle = options.foreground;

  for (let row = 0; row < qr.modules.size; row++) {
    for (let column = 0; column < qr.modules.size; column++) {
      if (!qr.modules.get(row, column)) continue;
      const x = (column + margin) * cell;
      const y = (row + margin) * cell;
      const finder = (row < 8 && column < 8) ||
        (row < 8 && column >= qr.modules.size - 8) ||
        (row >= qr.modules.size - 8 && column < 8);

      if (finder || options.style === "square") {
        context.fillRect(x, y, cell + 0.1, cell + 0.1);
      } else if (options.style === "dots") {
        context.beginPath();
        context.arc(x + cell / 2, y + cell / 2, cell * 0.43, 0, Math.PI * 2);
        context.fill();
      } else {
        const inset = cell * 0.04;
        context.beginPath();
        context.roundRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2, cell * 0.26);
        context.fill();
      }
    }
  }

  if (options.logo) {
    const image = await loadImage(options.logo);
    const logoSize = Math.round(qr.modules.size * cell * 0.18);
    const padding = Math.round(cell * 0.9);
    const tileSize = logoSize + padding * 2;
    const tileStart = (size - tileSize) / 2;
    context.fillStyle = options.background;
    context.beginPath();
    context.roundRect(tileStart, tileStart, tileSize, tileSize, Math.round(cell));
    context.fill();

    const scale = Math.min(logoSize / image.naturalWidth, logoSize / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  }

  return canvas.toDataURL("image/png");
}
