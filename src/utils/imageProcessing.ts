export const processImageToBlob = (dataUrl: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Error al comprimir la imagen"));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = error => reject(error);
  });
};

export const processFileToBlob = async (file: File): Promise<Blob | File> => {
  console.log(`📂 Procesando archivo: ${file.name} (${file.type}) - Tamaño: ${(file.size / 1024).toFixed(2)}KB`);

  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPDF) {
    // Devolvemos el PDF original para que se suba completo, en lugar de convertir solo la primera página.
    return file;
  }

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        try {
          const blob = await processImageToBlob(event.target?.result as string);
          resolve(blob);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  return file;
};
