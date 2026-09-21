-- Week 2: Columbia jokes, readable by anyone with the anon key.
-- Each joke was written from a real r/columbia thread; source_url points at it.
create table if not exists public.jokes (
  id bigint generated always as identity primary key,
  setup text not null,
  punchline text not null,
  rating int not null default 3 check (rating between 1 and 5),
  source_url text,
  created_at timestamptz not null default now()
);

alter table public.jokes add column if not exists source_url text;
alter table public.jokes enable row level security;

drop policy if exists "Public can read jokes" on public.jokes;
create policy "Public can read jokes"
  on public.jokes for select
  to anon, authenticated
  using (true);

delete from public.jokes;

insert into public.jokes (setup, punchline, rating, source_url) values
  ('Why do SEAS students never worry about the swim test?', 'They already spent four years treading water in Art of Engineering.', 4, 'https://www.reddit.com/r/columbia/comments/rl0b5q/swim_test_for_columbia_engineering/'),
  ('Got an A on my University Writing essay!', 'Then I learned UWriting grades are the one thing at Columbia you can''t uncover.', 5, 'https://www.reddit.com/r/columbia/comments/fmq02u/bruh_joke_post_but_srsly_be_safe/'),
  ('People say Calc at Columbia is a joke.', 'It is. I just haven''t gotten it yet.', 4, 'https://www.reddit.com/r/columbia/comments/db3y33/why_is_calc_considered_a_joke_at_columbia/'),
  ('I almost added a class without checking CULPA.', 'Then I read the reviews and realized the professor was the final exam.', 4, 'https://www.reddit.com/r/columbia/comments/17m64jy/this_is_why_i_love_culpa_i_was_about_to_add_a/'),
  ('What is the most consistently high-performing thing on campus?', 'The red brick paths. They have never once been curved.', 3, 'https://www.reddit.com/r/columbia/comments/qqmvbu/whoever_is_in_charge_of_the_red_brick_paths/'),
  ('I got into Columbia and got sentenced to four years in federal prison the same week.', 'Both have a swim test, but only one has Lit Hum.', 5, 'https://www.reddit.com/r/columbia/comments/12rbwye/help_me_choose_columbia_data_science_econ_vs_four/'),
  ('How do I become president of the university?', 'Step one: don''t. Step two: if you already did, check your email for the no-confidence vote.', 4, 'https://www.reddit.com/r/columbia/comments/16zvb70/how_do_i_become_the_president_of_the_university/'),
  ('My girlfriend screamed "Columbia" in bed.', 'She''s ED. Apparently so am I now.', 3, 'https://www.reddit.com/r/columbia/comments/17hq2ur/my_gf_screamed_columbia_instead_of_my_name_in_bed/'),
  ('How do Columbia students describe NYU?', '"A great school. For their safety."', 4, 'https://www.reddit.com/r/columbia/comments/1ggwujg/nyu_students_according_to_columbia_students/'),
  ('How do you tell people you''re a CS major at Columbia without telling them?', 'You wait for them to ask, then say "SEAS" and let the silence do the rest.', 3, 'https://www.reddit.com/r/columbia/comments/172lrf7/how_to_avoid_telling_people_my_major_computer/'),
  ('Studied a month for the ML midterm with Verma.', 'Model overfit to the homework. Test accuracy: 10%.', 4, 'https://www.reddit.com/r/columbia/comments/qgk1ys/depressed_after_ml_midterm_with_verma/'),
  ('I applied to Columbia for the dorm views I saw on TikTok.', 'Got Carman. The view is Carman.', 4, 'https://www.reddit.com/r/columbia/comments/1polw8y/hi_just_got_in_ed_which_dorm_has_the_best_view/'),
  ('Le Monde raised prices 40% for graduation weekend.', 'Finally, a Columbia institution charging tuition rates for something you can eat.', 3, 'https://www.reddit.com/r/columbia/comments/1th1q7f/warning_for_columbia_families_le_monde/'),
  ('Trump called Columbia a "liberal, disgraceful institution."', 'Admissions sent him a thank-you note for the application bump.', 3, 'https://www.reddit.com/r/columbia/comments/gqafxz/is_anyone_else_worried_about_columbias_reputation/'),
  ('The Wallach gaming lounge door lady pretended not to hear me.', 'Fair. My swipe also pretended not to work.', 3, 'https://www.reddit.com/r/columbia/comments/164tpj5/is_it_just_me_or_are_some_campus_staff_really_rude/'),
  ('Breaking: a SEAS student has finally demystified the PhD.', 'It''s six more years of Havemeyer 309.', 3, 'https://www.reddit.com/r/columbia/comments/lbunpu/breaking_ivy_elkins_announces_she_has_finally/');
