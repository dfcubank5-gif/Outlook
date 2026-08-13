# Outlook login with Supabase

## Supabase setup

1. Create a Supabase project.
2. In **Authentication > Providers**, enable Email.
3. Create users in **Authentication > Users**, or add a sign-up flow separately.
4. Open **SQL Editor** and run `supabase-schema.sql`.
5. Copy the project URL and the public `anon` key from **Project Settings > API** into `config.js`.

The anon key is intended for browser use. Never put a `service_role` key in this folder or in Netlify client-side environment variables.

The page signs users in with Supabase email/password authentication, restores an existing session, and signs out with the Log out button. It stores the entered login name in `profiles.login_name` for the signed-in user. Client users have no `select` policy for this table, so you can inspect the metadata from the Supabase dashboard as the project owner. Passwords are handled by Supabase Auth and are never stored in or exposed by the page, including to project administrators.

## Netlify

Deploy the folder as a static site. `index.html` is the publish entry point. After deployment, add the deployed site URL under **Authentication > URL Configuration > Site URL** in Supabase. Add any redirect URLs required by your project there as well.
