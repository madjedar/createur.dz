// Type declarations for Deno runtime in Supabase Edge Functions
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined
    set(key: string, value: string): void
    has(key: string): boolean
    delete(key: string): void
    toObject(): Record<string, string>
  }
  export const env: Env
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number; onListen?: (params: { port: number; hostname: string }) => void }
  ): void
  export function serve(
    options: { port?: number; onListen?: (params: { port: number; hostname: string }) => void },
    handler: (req: Request) => Response | Promise<Response>
  ): void
}

// Module declarations for Deno URL / JSR imports in VS Code TypeScript server
declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js'
}

declare module 'https://esm.sh/@supabase/supabase-js' {
  export * from '@supabase/supabase-js'
}

declare module 'jsr:@supabase/functions-js/edge-runtime.d.ts' {}

