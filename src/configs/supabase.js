import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL;
const cle = process.env.REACT_APP_SUPABASE_KEY;

let client = null;

export const supabase = () => {
    if (!client) client = createClient(url, cle, { auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true } });
    return client;
};
