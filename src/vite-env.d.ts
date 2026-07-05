/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module '*.pdf' {
  const src: string
  export default src
}
