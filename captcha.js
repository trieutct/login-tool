function extractColor(text) {
  const colors = {
    "đỏ": {
      r: 255,
      g: 0,
      b: 0
    },
    "đen": {
      r: 0,
      g: 0,
      b: 0
    },
    "xanh": {
      r: 0,
      g: 255,
      b: 0
    },
    "vàng": {
      r: 255,
      g: 255,
      b: 0
    }
  };

  for (let color in colors) {
    if (text.includes(color)) {
      return colors[color];
    }
  }

  return null; // Trả về null nếu không tìm thấy màu nào
}


async function decodeBase64AndExtractText(base64String, targetColor, app_id) {
  try {
    // Xử lý chuỗi Base64 (loại bỏ tiền tố nếu có)
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Đọc ảnh từ buffer
    let image;
    try {
      image = await Jimp.read(imageBuffer);
    } catch (readError) {
      console.error("Lỗi đọc ảnh (Jimp.read):", readError.message);
      return null; // hoặc tiếp tục xử lý nếu muốn
    }
    // Lọc pixel theo màu mong muốn
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];

      // Kiểm tra xem pixel có giống với targetColor không
      if (
        Math.abs(red - targetColor.r) > 20 
        Math.abs(green - targetColor.g) > 20 
        Math.abs(blue - targetColor.b) > 20
      ) {
        this.bitmap.data[idx + 3] = 0; // Làm trong suốt các pixel không khớp màu
      }
    });

    // Lưu ảnh đã lọc
    const filteredImagePath = app_id + "filtered_fa.png";
    await image.writeAsync(filteredImagePath);

    // Nhận diện ký tự bằng OCR (Tesseract.js)
    if (!fs.existsSync(filteredImagePath)) {
      return null;
    }
    else{
      try {
        const {
          data: {
            text
          }
        } = await Tesseract.recognize(filteredImagePath, "eng").catch(err => console.error(Lỗi sendPaymentRequest ${i}:, err));
        return text;
      } catch (err) {
        console.error(Lỗi sendPaymentRequest ${i}:, err);
        return null;
      }
    }    

    //console.log("Extracted Text:", text);

  } catch (error) {
    console.error("Lỗi xử lý ảnh:", error);
    return null;
  }
}




const dataRegister = await fetchCaptcha(proxyAgent, app_url, fg);
dataRegister
    const targetColor = extractColor(dataRegister.message); // Lọc chỉ các ký tự màu đỏ
    
    console.log(dataRegister.b64);
        console.log(dataRegister.message);
        console.log(targetColor);
    let captcha = '';
  
      captcha = await decodeBase64AndExtractText(dataRegister.b64, targetColor, app_id);
  
    console.log('captcha', captcha);