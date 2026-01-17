import { toPng } from 'html-to-image';
import { useCallback } from 'react';

export function useDownloadImage() {
  const downloadImage = useCallback((node: HTMLElement, fileName: string) => {
    if (!node) return;

    toPng(node, { cacheBust: true, backgroundColor: '#18181b' }) // Default bg to zinc-950
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to download image', err);
      });
  }, []);

  return { downloadImage };
}
