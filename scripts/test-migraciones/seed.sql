-- Datos sintéticos para las pruebas de RLS. Nunca datos reales (Ley 1581).

insert into public.institutions (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Colegio A'),
  ('22222222-2222-2222-2222-222222222222', 'Colegio B');

insert into auth.users (id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd');

-- Instructor A: pertenece por instructor_institutions (profiles.institution_id nulo)
insert into public.profiles (id, role, institution_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'instructor', null);
insert into public.instructor_institutions (instructor_id, institution_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111');

-- Instructor B: pertenece por profiles.institution_id (la otra rama del OR)
insert into public.profiles (id, role, institution_id) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'instructor', '22222222-2222-2222-2222-222222222222');

-- Estudiante del Colegio A
insert into public.profiles (id, role, institution_id) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'student', '11111111-1111-1111-1111-111111111111');

-- Admin sin institución
insert into public.profiles (id, role, institution_id) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin', null);

-- Corpus: uno vigente CON embedding, uno derogado, uno vigente SIN embedding
insert into corpus.normativo
  (id, documento, tipo_norma, referencia_corta, texto, areas, grados, temas, vigente, embedding)
values
  ('ley115-art76', 'Ley 115 de 1994', 'ley', 'Ley 115/1994 Art. 76',
   'Se entiende por currículo el conjunto de criterios, planes de estudio...',
   '{Matematicas}', '{9}', '{curriculo}', true,
   ('[' || 1 || repeat(',0', 1023) || ']')::extensions.vector(1024)),
  ('derogado-x', 'Norma derogada', 'decreto', 'Derogada Art. 1',
   'Texto sin vigencia.', '{Matematicas}', '{9}', '{curriculo}', false,
   ('[' || 1 || repeat(',0', 1023) || ']')::extensions.vector(1024)),
  ('sin-embedding', 'Lineamiento pendiente de indexar', 'lineamiento', 'Lin. 1',
   'Aún no tiene embedding.', '{Matematicas}', '{9}', '{curriculo}', true, null);

-- Un plan por colegio. El del Colegio A cita: una vigente, una derogada y una inventada.
insert into public.planes_estudio
  (id, institution_id, creado_por, datos_entrada, plan_generado, citas)
values
  ('99999999-9999-9999-9999-999999999999',
   '11111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"area":"Matematicas","grado":9}'::jsonb, '{"unidades":[]}'::jsonb,
   '["ley115-art76","derogado-x","inventada-999"]'::jsonb),
  ('88888888-8888-8888-8888-888888888888',
   '22222222-2222-2222-2222-222222222222',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '{"area":"Lenguaje","grado":5}'::jsonb, '{"unidades":[]}'::jsonb,
   '[]'::jsonb);

insert into public.institution_academic_profiles (institution_id, modelo_pedagogico)
values ('11111111-1111-1111-1111-111111111111', 'Constructivista'),
       ('22222222-2222-2222-2222-222222222222', 'Escuela nueva');
