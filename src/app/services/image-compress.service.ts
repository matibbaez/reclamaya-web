import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // 👈 IMPORTAMOS EL ESCUDO

@Injectable({
  providedIn: 'root'
})
export class ImageCompressService {
  private platformId = inject(PLATFORM_ID); // 👈 INYECTAMOS EL ESCUDO

  constructor() { }

  async compressFile(file: File): Promise<File> {
    // 🔥 1. ESCUDO NODE.JS: Si esto corre en el servidor (durante el build), ignoramos todo
    if (!isPlatformBrowser(this.platformId)) {
      return file;
    }

    // 2. Si no es imagen (ej: PDF), devolvemos el archivo original sin tocar
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const options = {
      maxSizeMB: 0.3,          // Bajamos de 0.8 a 0.3 (Máx 300KB por foto)
      maxWidthOrHeight: 1280,  // Resolución HD (Suficiente para leer patentes/DNI)
      useWebWorker: true,      // No traba la UI
      initialQuality: 0.7      // Buena calidad, poco peso
    };

    try {
      // ✅ 3. IMPORTACIÓN DINÁMICA: Node.js nunca lee esta línea, solo el navegador
      const imageCompression = (await import('browser-image-compression')).default;
      
      const compressedFile = await imageCompression(file, options);
      
      // La librería devuelve un Blob, lo convertimos a File para mantener el nombre original
      return new File([compressedFile], file.name, { type: compressedFile.type });
    } catch {
      return file;
    }
  }
}