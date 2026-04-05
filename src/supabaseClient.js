import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zviodrqsrawcxtqcorst.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aW9kcnFzcmF3Y3h0cWNvcnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjY0NzcsImV4cCI6MjA5MTAwMjQ3N30.uozcjlP1svArOnK1vawDylA1uEa6Jp0tcdrCqsZgBUE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
