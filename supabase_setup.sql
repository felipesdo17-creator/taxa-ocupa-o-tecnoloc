-- ==========================================================
-- SCRIPT DE CONFIGURAÇÃO TECNOLOC (IDEMPOTENTE)
-- ==========================================================

-- 1. Criar a tabela de Perfis (Profiles) se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('USUARIO', 'GESTOR', 'ADMIN')) DEFAULT 'USUARIO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Criar a tabela de Equipamentos (Equipments) se não existir
CREATE TABLE IF NOT EXISTS public.equipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patrimonio TEXT,
  nome_bem TEXT,
  modelo TEXT,
  tipo TEXT,
  status TEXT,
  centro_trab TEXT,
  estado TEXT,
  numero_serie TEXT,
  pos_contador NUMERIC,
  contador_acumulado NUMERIC,
  ano_fabricacao TEXT,
  ultima_atualizacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Habilitar o Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

-- 4. Funções auxiliares de Segurança
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_gestor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('GESTOR', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Limpar e Recriar Políticas para Perfis (Evita Erro 42710)
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins possuem controle total sobre perfis" ON public.profiles;
CREATE POLICY "Admins possuem controle total sobre perfis" 
ON public.profiles FOR ALL 
USING (public.check_is_admin());

-- 6. Limpar e Recriar Políticas para Equipamentos
DROP POLICY IF EXISTS "Qualquer usuário logado pode visualizar a frota" ON public.equipments;
CREATE POLICY "Qualquer usuário logado pode visualizar a frota" 
ON public.equipments FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Apenas Gestores e Admins podem modificar a frota" ON public.equipments;
CREATE POLICY "Apenas Gestores e Admins podem modificar a frota" 
ON public.equipments FOR ALL 
USING (public.check_is_gestor());

-- 7. Trigger de Novo Usuário (Auto-Admin para Felipe)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE 
      WHEN new.email = 'felipe.sdo17@gmail.com' THEN 'ADMIN' 
      ELSE 'USUARIO' 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover e recriar o gatilho
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Garantir que o Felipe seja ADMIN se já estiver cadastrado
UPDATE public.profiles 
SET role = 'ADMIN' 
WHERE email = 'felipe.sdo17@gmail.com';