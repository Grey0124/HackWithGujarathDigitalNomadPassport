declare module 'dom-to-image' {
  interface Options {
    quality?: number;
    bgcolor?: string;
    style?: {
      [key: string]: string;
    };
    filter?: (node: HTMLElement) => boolean;
  }

  interface DomToImage {
    toPng(node: HTMLElement, options?: Options): Promise<string>;
    toJpeg(node: HTMLElement, options?: Options): Promise<string>;
    toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
    toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
  }

  const domtoimage: DomToImage;
  export default domtoimage;
} 