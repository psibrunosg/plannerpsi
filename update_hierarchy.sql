-- 6. TABELA DE PROFILES (HIERARQUIA)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE AO REGISTRAR USUÁRIO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, level)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 1);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Se o trigger já existir, precisamos remover primeiro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Inserir profiles para usuários que já existem (migração de dados)
INSERT INTO public.profiles (id, email, full_name, level)
SELECT id, email, raw_user_meta_data->>'full_name', 1
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. ATUALIZAÇÃO DA TABELA DE TAREFAS (ASSIGNEE E RLS)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Remover a política antiga
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;

-- Novas Políticas de Segurança para Tarefas baseadas no dono OU no responsável
CREATE POLICY "Users can view owned or assigned tasks" ON tasks FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = assignee_id
);

CREATE POLICY "Users can update owned or assigned tasks" ON tasks FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() = assignee_id
);

CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (
  auth.uid() = user_id
);
