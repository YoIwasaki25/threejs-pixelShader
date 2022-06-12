declare module '*.glsl' {
    const value: string;
    export default value;
}

declare module '*.png' {
    const value: any;
    export = value;
}

declare module 'RenderPixelatedPass';
