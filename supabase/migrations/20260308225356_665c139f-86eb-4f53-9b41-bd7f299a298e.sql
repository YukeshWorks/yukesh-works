-- Create game_scores table
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  high_score INTEGER NOT NULL DEFAULT 0,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  best_moves INTEGER,
  win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_name)
);

-- Enable RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own scores
CREATE POLICY "Users can view own scores" ON public.game_scores
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scores
CREATE POLICY "Users can insert own scores" ON public.game_scores
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own scores
CREATE POLICY "Users can update own scores" ON public.game_scores
FOR UPDATE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_game_scores_updated_at
BEFORE UPDATE ON public.game_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();