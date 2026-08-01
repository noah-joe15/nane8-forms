# Dodoso la Washiriki — Nanenane / 51st DITF

A mobile-first, bilingual (Swahili / English) survey for TANTRADE to collect data from Nanenane / 51st DITF exhibition participants. 

This project uses **Supabase** (PostgreSQL) for secure, serverless data storage and can be hosted on any static hosting provider (like GitHub Pages, Vercel, or Netlify Static).

### Project Structure
- `index.html` — The public, multi-step survey (green/blue/gold theme).
- `admin.html` + `admin.js` — Password-gated dashboard to view, filter, and export responses to CSV.
- `styles.css` — Shared styling and theme.
- `script.js` — Survey step logic, validation, review screen, and Supabase submission.
- *(No build step, no framework, no backend server to maintain — plain HTML/CSS/JS).*

---

## 1. How Responses are Collected

The survey form submits data directly to a **Supabase** PostgreSQL database using the `@supabase/supabase-js` client. 
- When a user submits the form, `script.js` gathers the answers into a JSON object and inserts it into the `nanenane_responses` table.
- The admin dashboard (`admin.html`) reads this data directly from Supabase, allowing you to view, search, and export responses without needing any serverless functions or backend APIs.

---

## 2. Database Setup (Supabase)

Before deploying, ensure your Supabase project is configured:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. Go to the **SQL Editor** and run the following script to create the table and set up secure access:

```sql
-- Create the table to store survey responses
CREATE TABLE nanenane_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  form_data JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE nanenane_responses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone (public) to INSERT (submit the form)
CREATE POLICY "Allow public submissions" 
ON nanenane_responses FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Policy 2: Allow anyone to SELECT (read) data 
-- (Security is handled by the hidden admin URL + client-side password gate)
CREATE POLICY "Allow public read access" 
ON nanenane_responses FOR SELECT TO anon, authenticated USING (true);
