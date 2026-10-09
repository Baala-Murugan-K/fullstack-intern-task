-- ========================================================
-- Mini SaaS Template Store - Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor if you prefer manual setup
-- ========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Templates Table
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_template UNIQUE (user_id, template_id)
);

-- 4. Initial Seed Templates
INSERT INTO templates (name, category, description, thumbnail_url)
VALUES 
  ('NexusCRM Pro Suite', 'CRM', 'Enterprise-grade customer relationship management dashboard with deal tracking, automated sales funnels, and customer communication history.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'),
  ('PulseMetrics Realtime Analytics', 'Analytics', 'Comprehensive analytics suite with real-time visitor tracking, custom conversion funnels, event logging, and cohort retention charts.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'),
  ('CogniBot Autonomous AI Agent', 'AI Tools', 'Ready-to-deploy LLM chat and autonomous workflow assistant with vector search integrations, prompt management, and chat playground.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'),
  ('DevDock Cloud Platform', 'Developer Tools', 'Modern developer portal with containerized microservice management, CI/CD pipeline triggers, audit logs, and API key provisioning.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'),
  ('StoreCraft Headless E-Commerce', 'E-Commerce', 'Multi-currency SaaS storefront with Stripe checkout integration, inventory management, discount codes, and order lifecycle tracking.', 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=800&q=80'),
  ('TaskFlow Kanban & Sprints', 'Project Management', 'Agile project management workspace featuring interactive drag-and-drop boards, sprint planning milestones, and velocity metrics.', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'),
  ('PayPulse Subscriptions & Billing', 'Fintech', 'B2B SaaS subscription billing engine with recurring payment invoicing, metered usage calculators, tax calculations, and churn alerts.', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'),
  ('SupportZen Omnichannel Helpdesk', 'Customer Support', 'Fast customer support ticketing platform with shared team inboxes, canned response templates, SLA monitoring, and satisfaction surveys.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80')
ON CONFLICT DO NOTHING;
