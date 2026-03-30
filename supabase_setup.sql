-- Create the app_state table
CREATE TABLE IF NOT EXISTS public.app_state (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read from the app_state table
CREATE POLICY "Allow public read access" ON public.app_state
    FOR SELECT
    USING (true);

-- Create a policy that allows anyone to insert/update the app_state table
CREATE POLICY "Allow public insert/update access" ON public.app_state
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function before update
CREATE TRIGGER update_app_state_updated_at
    BEFORE UPDATE ON public.app_state
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
