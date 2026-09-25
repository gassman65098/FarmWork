FarmWork V6

FarmWork now includes:
- Full monthly calendar
- Tractors, equipment, and land
- Separate completed-work history page
- Work editing/deletion/completion
- Photos and completion notes
- Local offline storage
- Supabase account login and cloud synchronization
- Automatic cloud updates when connected to the internet

Supabase setup:
The app is configured for the FarmWork Supabase project and uses the project's publishable browser key. The database table farmwork_data must exist with Row Level Security policies for the signed-in user.

Do not put a Supabase secret/service-role key in this app.
