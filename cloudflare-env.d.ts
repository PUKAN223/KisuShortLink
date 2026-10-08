declare namespace Cloudflare {
  interface Env {
    BUCKET?: R2Bucket;
    SUPABASE_URL?: string;
    SUPABASE_ENABLED?: string;
    SUPABASE_SECRET_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
  }
}
