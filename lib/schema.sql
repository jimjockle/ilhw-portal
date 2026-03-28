-- ILHW Business Portal Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Businesses table: mirrors dataset.json entries for claimed businesses
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id TEXT UNIQUE, -- matches the "name" field in dataset.json for lookup
  name TEXT NOT NULL,
  address TEXT,
  town TEXT NOT NULL,
  state TEXT DEFAULT 'NY',
  zip TEXT,
  phone TEXT,
  website TEXT,
  hours TEXT,
  description TEXT, -- business-authored description (overrides scraped)
  category TEXT DEFAULT 'businesses',
  subcategory TEXT,
  keywords TEXT[],
  photos TEXT[], -- URLs to uploaded photos in Supabase storage
  promo_code TEXT,
  promo_details TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'business', 'pro', 'enterprise')),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims table: tracks the claim/verification process
CREATE TABLE claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verification_method TEXT CHECK (verification_method IN ('email', 'phone')),
  verification_code TEXT,
  verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events/promotions published by businesses
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'event' CHECK (event_type IN ('event', 'promotion', 'program')),
  start_date DATE,
  end_date DATE,
  time_details TEXT,
  location TEXT,
  cost TEXT,
  promo_code TEXT,
  flyer_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'past')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query logs: every chatbot query and which businesses were surfaced
CREATE TABLE query_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text TEXT NOT NULL,
  detected_intent TEXT,
  detected_town TEXT,
  results_count INTEGER,
  surfaced_businesses TEXT[], -- array of business dataset_ids
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business impressions: aggregated view per business per day
CREATE TABLE business_impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  queries TEXT[], -- which queries surfaced this business
  position_avg REAL, -- average position in results
  UNIQUE(business_id, date)
);

-- Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_impressions ENABLE ROW LEVEL SECURITY;

-- Policies: businesses are publicly readable, editable by owner
CREATE POLICY "Businesses are viewable by everyone"
  ON businesses FOR SELECT USING (true);

CREATE POLICY "Business owners can update their own listings"
  ON businesses FOR UPDATE USING (
    id IN (SELECT business_id FROM claims WHERE user_id = auth.uid() AND status = 'verified')
  );

-- Claims: users can see their own
CREATE POLICY "Users can view their own claims"
  ON claims FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create claims"
  ON claims FOR INSERT WITH CHECK (user_id = auth.uid());

-- Events: owners can manage, public can read active
CREATE POLICY "Active events are viewable by everyone"
  ON events FOR SELECT USING (status = 'active');

CREATE POLICY "Business owners can manage events"
  ON events FOR ALL USING (
    business_id IN (SELECT business_id FROM claims WHERE user_id = auth.uid() AND status = 'verified')
  );

-- Query logs: only service role can insert, aggregated views for business owners
CREATE POLICY "Query logs are insert-only for service"
  ON query_logs FOR SELECT USING (false);

-- Impressions: business owners can see their own
CREATE POLICY "Owners can view their impressions"
  ON business_impressions FOR SELECT USING (
    business_id IN (SELECT business_id FROM claims WHERE user_id = auth.uid() AND status = 'verified')
  );

-- Indexes
CREATE INDEX idx_businesses_town ON businesses(town);
CREATE INDEX idx_businesses_subcategory ON businesses(subcategory);
CREATE INDEX idx_businesses_dataset_id ON businesses(dataset_id);
CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_claims_business_id ON claims(business_id);
CREATE INDEX idx_events_business_id ON events(business_id);
CREATE INDEX idx_query_logs_created ON query_logs(created_at);
CREATE INDEX idx_impressions_business_date ON business_impressions(business_id, date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
